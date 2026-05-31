import ForgotPasswordForm from "@/modules/auth/components/forgot-password-form/forgot-password-form";
import styles from "../signin/signin-page.module.css";

export default function ForgotPasswordPage() {
  return (
    <div className={styles.pageContainer}>
      <ForgotPasswordForm />
    </div>
  );
}
