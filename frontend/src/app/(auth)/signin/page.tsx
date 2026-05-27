import { Suspense } from "react";
import SigninForm from "../../../modules/auth/components/signin-form/signin-form";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import styles from "./signin-page.module.css";

export default function SigninPage() {
  return (
    <div className={styles.pageContainer}>
      <Suspense fallback={<PageSkeleton variant="auth" />}>
        <SigninForm />
      </Suspense>
    </div>
  );
}
