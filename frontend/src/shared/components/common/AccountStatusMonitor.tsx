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
      if (user && user.email === event.userEmail) {
        setModalState({
          isOpen: true,
          action: "blocked",
          userName: event.userName,
        });
      }
    },
    [user]
  );

  const handleAccountDeleted = useCallback(
    (event: UserAccountEvent) => {
      if (user && user.email === event.userEmail) {
        setTimeout(() => {
          setModalState({
            isOpen: true,
            action: "deleted",
            userName: event.userName,
          });
        }, 100);
      }
    },
    [user]
  );

  const handleModalClose = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));

    logout();
  }, [logout]);

  useEffect(() => {
    if (!user) {
      setModalState({
        isOpen: false,
        action: "blocked",
        userName: "",
      });
    }
  }, [user]);

  useUserAccountStatusSubscription({
    onAccountBlocked:
      user?.userType === "candidate" ? handleAccountBlocked : undefined,
    onAccountDeleted:
      user?.userType === "candidate" ? handleAccountDeleted : undefined,
  });

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
