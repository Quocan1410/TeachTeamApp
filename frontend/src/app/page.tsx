"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import HiringHome from "@/modules/home/components/hiring-home/HiringHome";

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const redirecting =
    !authLoading &&
    isAuthenticated &&
    (user?.userType === "candidate" || user?.userType === "lecturer");

  useEffect(() => {
    if (!redirecting || !user) return;
    if (user.userType === "candidate") {
      router.replace("/tutor");
    } else if (user.userType === "lecturer") {
      router.replace("/lecturer");
    }
  }, [redirecting, user, router]);

  if (authLoading || redirecting) {
    return <PageSkeleton variant="plain" />;
  }

  return (
    <HiringHome
      isLoggedIn={isAuthenticated}
      userRole={user?.userType ?? null}
    />
  );
}
