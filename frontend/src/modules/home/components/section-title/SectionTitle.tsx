import React from "react";
import styles from "./SectionTitle.module.css";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center"; // Optional alignment
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  align = "left",
}) => {
  const containerStyle =
    align === "center"
      ? { textAlign: "center" as const, alignItems: "center" }
      : {};
  const barStyle =
    align === "center" ? { marginLeft: "auto", marginRight: "auto" } : {};

  return (
    <div className={styles.sectionTitle__sectionTitleContainer} style={containerStyle}>
      <div className={styles.sectionTitle__sectionTitleBar} style={barStyle}></div>
      <div className={styles.sectionTitle__sectionTitleContent}>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
};

export default SectionTitle;
