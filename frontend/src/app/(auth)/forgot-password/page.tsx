"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  FingerPrintIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { signInWithPasskey } from "@/modules/auth/utils/passkey";
import Toast from "@/shared/components/common/toast/toast";
import { useToast } from "@/shared/hooks/useNotification";
import { User } from "@/shared/types/user";
import ResetLaterCard from "./reset-later-card";
import styles from "./forgot-password.module.css";

type RecoveryMode = "choose" | "later";

function destinationFor(user: User): string {
  if (user.userType === "admin") {
    return process.env.NEXT_PUBLIC_ADMIN_APP_URL || "http://localhost:3001";
  }
  if (user.userType === "lecturer") return "/lecturer";
  if (user.userType === "candidate") return "/tutor";
  return "/";
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [mode, setMode] = useState<RecoveryMode>("choose");
  const [busy, setBusy] = useState(false);
  const { toast, showError, hideToast } = useToast();

  const recoverWithPasskey = async () => {
    setBusy(true);
    const response = await signInWithPasskey();
    setBusy(false);
    if (!response.success || !response.data?.user) {
      showError(response.message || "Passkey could not be verified.");
      return;
    }
    login(response.data.user);
    const destination = destinationFor(response.data.user);
    window.scrollTo(0, 0);
    if (/^https?:\/\//i.test(destination)) {
      window.location.assign(destination);
      return;
    }
    router.replace(destination);
  };

  return (
    <div className={styles.forgotPassword__page}>
      <span className={styles.forgotPassword__orbA} aria-hidden="true" />
      <span className={styles.forgotPassword__orbB} aria-hidden="true" />
      <div className={styles.forgotPassword__stage}>
        {mode === "later" ? (
          <ResetLaterCard
            onBack={() => {
              setMode("choose");
              window.scrollTo(0, 0);
            }}
          />
        ) : (
          <div className={styles.forgotPassword__laterShell}>
            <div className={styles.forgotPassword__laterMascotSeat} aria-hidden="true">
              <Image
                src="/mascot/mascot-3.png"
                alt=""
                width={377}
                height={661}
                priority
                className={styles.forgotPassword__laterMascot}
              />
            </div>
            <div className={styles.forgotPassword__laterCard}>
              <h1 className={styles.forgotPassword__laterTitle}>Reset Password</h1>
              <p className={styles.forgotPassword__laterText}>Choose how you want to get back in.</p>
              <div className={styles.forgotPassword__options}>
                <button
                  type="button"
                  className={styles.forgotPassword__option}
                  disabled={busy}
                  onClick={recoverWithPasskey}
                >
                  <span className={styles.forgotPassword__optionIcon} aria-hidden="true">
                    <FingerPrintIcon />
                  </span>
                  <span className={styles.forgotPassword__optionCopy}>
                    <span className={styles.forgotPassword__optionTitle}>Passkey</span>
                    <span className={styles.forgotPassword__optionHint}>
                      {busy ? "Waiting…" : "Approve on this device"}
                    </span>
                  </span>
                  <ChevronRightIcon className={styles.forgotPassword__optionChevron} />
                </button>
                <button
                  type="button"
                  className={styles.forgotPassword__option}
                  disabled={busy}
                  onClick={() => setMode("later")}
                >
                  <span className={styles.forgotPassword__optionIcon} aria-hidden="true">
                    <DevicePhoneMobileIcon />
                  </span>
                  <span className={styles.forgotPassword__optionCopy}>
                    <span className={styles.forgotPassword__optionTitle}>Authenticator</span>
                    <span className={styles.forgotPassword__optionHint}>OTP 2FA · Coming later</span>
                  </span>
                  <ChevronRightIcon className={styles.forgotPassword__optionChevron} />
                </button>
                <button
                  type="button"
                  className={styles.forgotPassword__option}
                  disabled={busy}
                  onClick={() => setMode("later")}
                >
                  <span className={styles.forgotPassword__optionIcon} aria-hidden="true">
                    <EnvelopeIcon />
                  </span>
                  <span className={styles.forgotPassword__optionCopy}>
                    <span className={styles.forgotPassword__optionTitle}>Email</span>
                    <span className={styles.forgotPassword__optionHint}>Coming later</span>
                  </span>
                  <ChevronRightIcon className={styles.forgotPassword__optionChevron} />
                </button>
              </div>
              <Link href="/signin" className={styles.forgotPassword__returnLink}>
                <ArrowLeftIcon className={styles.forgotPassword__backArrow} aria-hidden="true" />
                Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
        autoCloseDelay={5000}
      />
    </div>
  );
}
