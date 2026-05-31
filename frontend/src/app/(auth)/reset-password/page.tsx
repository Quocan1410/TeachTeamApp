import { Suspense } from "react";
import ResetPasswordForm from "@/modules/auth/components/reset-password-form/reset-password-form";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import styles from "../signin/signin-page.module.css";

export default function ResetPasswordPage() {
  return (
    <div className={styles.pageContainer}>
      <Suspense fallback={<PageSkeleton fullPage={false} variant="auth" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
