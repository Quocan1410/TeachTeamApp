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
    <header className={styles.intro}>
      <p className={styles.kicker}>{kicker}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </header>
  );
}
