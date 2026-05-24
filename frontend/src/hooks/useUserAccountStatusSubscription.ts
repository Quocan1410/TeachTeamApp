import { useCallback, useEffect, useState, useRef } from "react";
import { UserAccountEvent } from "@/lib/graphql-subscriptions";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { AuthService } from "@/shared/services/authService";

interface UseUserAccountStatusSubscriptionOptions {
  onAccountBlocked?: (event: UserAccountEvent) => void;
  onAccountDeleted?: (event: UserAccountEvent) => void;
}

export function useUserAccountStatusSubscription({
  onAccountBlocked,
  onAccountDeleted,
}: UseUserAccountStatusSubscriptionOptions = {}) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const isCleanedUpRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 2;
  const onAccountBlockedRef = useRef(onAccountBlocked);
  const onAccountDeletedRef = useRef(onAccountDeleted);

  // Update refs when callbacks change
  useEffect(() => {
    onAccountBlockedRef.current = onAccountBlocked;
  }, [onAccountBlocked]);

  useEffect(() => {
    onAccountDeletedRef.current = onAccountDeleted;
  }, [onAccountDeleted]);

  const [subscriptionState, setSubscriptionState] = useState({
    loading: true,
    error: undefined as Error | undefined,
    isConnected: false,
  });

  // Process subscription data
  const processAccountEvent = useCallback((event: UserAccountEvent) => {
    if (event.action === "blocked" && onAccountBlockedRef.current) {
      onAccountBlockedRef.current(event);
    } else if (event.action === "deleted" && onAccountDeletedRef.current) {
      onAccountDeletedRef.current(event);
    }
  }, []);

  // Create WebSocket connection
  const createConnection = useCallback(() => {
    if (
      isCleanedUpRef.current ||
      !user?.id ||
      (!onAccountBlockedRef.current && !onAccountDeletedRef.current)
    ) {
      return;
    }

    const wsUrl =
      process.env.NEXT_PUBLIC_ADMIN_WS_ENDPOINT ||
      "ws://localhost:4002/graphql";

    const ws = new WebSocket(wsUrl, "graphql-transport-ws");
    wsRef.current = ws;

    ws.onopen = () => {
      if (isCleanedUpRef.current) {
        ws.close();
        return;
      }

      // Send connection init message
      const token = AuthService.getToken();
      const initMessage = {
        type: "connection_init",
        payload: token ? { authorization: `Bearer ${token}` } : {},
      };
      
      try {
        ws.send(JSON.stringify(initMessage));
      } catch (error) {
        console.error("Failed to send connection init:", error);
      }
    };

    ws.onmessage = (event) => {
      if (isCleanedUpRef.current) {
        return;
      }

      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "connection_ack":
            // Send subscription message for user account updates
            const subscriptionMessage = {
              id: `user-account-subscription-${user.id}`,
              type: "subscribe",
              payload: {
                query: `
                  subscription UserAccountUpdates($userId: Int!) {
                    userAccountUpdates(userId: $userId) {
                      userId
                      userEmail
                      userName
                      userType
                      action
                      timestamp
                      user {
                        id
                        email
                        fullName
                        userType
                        isBlocked
                        createdAt
                        updatedAt
                      }
                    }
                  }
                `,
                variables: {
                  userId: user.id,
                },
              },
            };
            
            try {
              ws.send(JSON.stringify(subscriptionMessage));
              setSubscriptionState((prev) => ({
                ...prev,
                loading: false,
                error: undefined,
                isConnected: true,
              }));
            } catch (error) {
              console.error("Failed to send subscription:", error);
            }
            break;

          case "next":
            if (message.payload?.data?.userAccountUpdates) {
              processAccountEvent(message.payload.data.userAccountUpdates);
            }
            break;

          case "error":
            console.error("Account subscription error:", message.payload);
            if (!isCleanedUpRef.current) {
              setSubscriptionState((prev) => ({
                ...prev,
                error: new Error(JSON.stringify(message.payload)),
                loading: false,
                isConnected: false,
              }));
            }
            break;

          case "complete":
            if (!isCleanedUpRef.current) {
              setSubscriptionState((prev) => ({
                ...prev,
                loading: false,
                isConnected: false,
              }));
            }
            break;

          default:
            break;
        }
      } catch (error) {
        console.error("Error parsing account subscription message:", error);
      }
    };

    ws.onerror = (error) => {
      if (isCleanedUpRef.current) {
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.warn("Account subscription WebSocket error:", error);
      }

      setTimeout(() => {
        if (!isCleanedUpRef.current && ws.readyState === WebSocket.CLOSED) {
          setSubscriptionState((prev) => ({
            ...prev,
            error: new Error("Failed to connect to account status updates"),
            loading: false,
            isConnected: false,
          }));
        }
      }, 1000);
    };

    ws.onclose = (event) => {
      if (isCleanedUpRef.current) {
        return;
      }

      if (event.code !== 1000) {
        setSubscriptionState((prev) => ({
          ...prev,
          isConnected: false,
          loading: false,
        }));

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          setTimeout(() => {
            if (!isCleanedUpRef.current) {
              createConnection();
            }
          }, 5000 * reconnectAttemptsRef.current);
        }
      }
    };
  }, [user?.id, processAccountEvent]);

  // Set up connection when user is available
  useEffect(() => {
    if (
      !user?.id ||
      (!onAccountBlocked && !onAccountDeleted)
    ) {
      setSubscriptionState({
        loading: false,
        error: undefined,
        isConnected: false,
      });
      return;
    }

    isCleanedUpRef.current = false;
    reconnectAttemptsRef.current = 0;
    createConnection();

    return () => {
      isCleanedUpRef.current = true;
      
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          // Send complete message before closing
          try {
            wsRef.current.send(JSON.stringify({
              id: `user-account-subscription-${user.id}`,
              type: "complete",
            }));
          } catch {
            // Ignore errors when cleaning up
          }
        }
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user?.id, onAccountBlocked, onAccountDeleted, createConnection]);

  return subscriptionState;
} 