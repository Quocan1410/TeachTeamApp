"use client";

import dynamic from "next/dynamic";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";

const LecturerDashboardClient = dynamic(
  () => import("./LecturerDashboardClient"),
  {
    loading: () => <PageSkeleton variant="lecturer" />,
    ssr: false,
  }
);

export default function LecturerPage() {
  return <LecturerDashboardClient />;
}
