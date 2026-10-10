import React from "react";
import styles from "./GuestPageIntro.module.css";

interface GuestPageIntroProps {
  kicker: string;
  title: string;
  subtitle: string;
}

export default function GuestPageIntro({
  kicker,
  title,
  subtitle,
}: GuestPageIntroProps) {
  return (
    <header className={styles.guestPageIntro__intro}>
      <p className={styles.guestPageIntro__kicker}>{kicker}</p>
      <h1 className={styles.guestPageIntro__title}>{title}</h1>
      <p className={styles.guestPageIntro__subtitle}>{subtitle}</p>
    </header>
  );
}
