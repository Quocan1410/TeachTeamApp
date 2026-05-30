import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { formatLecturerDisplayName } from "@/shared/utils/personDisplayName";

export const useLecturerAuth = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [lecturerName, setLecturerName] = useState<string>("");
  const [currentLecturerId, setCurrentLecturerId] = useState<string>("");

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      redirect("/signin");
      return;
    }

    if (user.userType !== "lecturer") {
      redirect(user.userType === "candidate" ? "/tutor" : "/");
      return;
    }

    setLecturerName(
      formatLecturerDisplayName(
        {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: "lecturer",
        },
        "Lecturer"
      )
    );
    setCurrentLecturerId(user.id.toString());
  }, [user, isAuthenticated, isLoading]);

  return {
    lecturerName,
    currentLecturerId,
    isLoading,
  };
};
