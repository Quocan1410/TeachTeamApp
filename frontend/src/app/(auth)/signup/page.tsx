import SignupForm from "@/modules/auth/components/signup-form/signup-form";
import styles from "./signup-page.module.css";

export default function SignupPage() {
  return (
    <div className={styles.signupPage__pageContainer}>
      <div className={styles.signupPage__stage}>
        <SignupForm />
      </div>
    </div>
  );
}
