"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useUserAccountStatusSubscription } from "@/hooks/useUserAccountStatusSubscription";
import { UserAccountEvent } from "@/lib/graphql-subscriptions";
import AccountStatusModal from "./modal/AccountStatusModal";

const AccountStatusMonitor: React.FC = () => {
  const { user, logout } = useAuth();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    action: "blocked" | "deleted";
    userName: string;
  }>({
    isOpen: false,
    action: "blocked",
    userName: "",
  });

  const handleAccountBlocked = useCallback(
    (event: UserAccountEvent) => {
      console.log("🚫 Account blocked event received:", event);
      console.log("🔍 Current user when block event received:", user?.email);
      console.log("🔍 Event user:", event.userEmail);

      // Only show modal if the event is for the currently logged in user
      if (user && user.email === event.userEmail) {
        console.log("✅ Showing block modal for current user");
        setModalState({
          isOpen: true,
          action: "blocked",
          userName: event.userName,
        });
      } else {
        console.log("🚫 Block event not for current user, ignoring");
      }
    },
    [user]
  );

  const handleAccountDeleted = useCallback(
    (event: UserAccountEvent) => {
      console.log("❌ Account deleted event received:", event);
      console.log("🔍 Current user when delete event received:", user?.email);
      console.log("🔍 Event user:", event.userEmail);

      // Only show modal if the event is for the currently logged in user
      if (user && user.email === event.userEmail) {
        console.log("✅ Showing delete modal for current user");
        // Use a small delay to ensure the modal renders before any potential logout
        setTimeout(() => {
          setModalState({
            isOpen: true,
            action: "deleted",
            userName: event.userName,
          });
        }, 100);
      } else {
        console.log("🚫 Delete event not for current user, ignoring");
      }

      // Don't logout immediately - let the modal show first
      // The logout will happen when the modal is closed
    },
    [user]
  );

  const handleModalClose = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));

    // Logout the user since their account is blocked/deleted
    logout();
  }, [logout]);

  // Reset modal state when user changes or logs out
  useEffect(() => {
    if (!user) {
      setModalState({
        isOpen: false,
        action: "blocked",
        userName: "",
      });
    }
  }, [user]);

  // Only candidates need real-time block/delete alerts from admin
  useUserAccountStatusSubscription({
    onAccountBlocked:
      user?.userType === "candidate" ? handleAccountBlocked : undefined,
    onAccountDeleted:
      user?.userType === "candidate" ? handleAccountDeleted : undefined,
  });

  // Don't render anything if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <AccountStatusModal
      isOpen={modalState.isOpen}
      action={modalState.action}
      userName={modalState.userName}
      onClose={handleModalClose}
    />
  );
};

export default AccountStatusMonitor;
