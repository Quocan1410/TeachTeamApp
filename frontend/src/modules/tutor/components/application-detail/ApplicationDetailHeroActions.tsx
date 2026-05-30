"use client";

import React from "react";
import PinIcon from "@/shared/components/common/icons/PinIcon";
import CloseIcon from "@/shared/components/common/icons/CloseIcon";
import styles from "./ApplicationDetailPanel.module.css";

interface ApplicationDetailHeroActionsProps {
  isPinned: boolean;
  onTogglePin: () => void;
  onClose: () => void;
  className?: string;
}

const ApplicationDetailHeroActions: React.FC<ApplicationDetailHeroActionsProps> = ({
  isPinned,
  onTogglePin,
  onClose,
  className,
}) => (
  <div className={`${styles.heroActions} ${className ?? ""}`}>
    <button
      type="button"
      className={`${styles.iconBtnPin} iconCloseHit ${isPinned ? styles.iconBtnPinActive : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onTogglePin();
      }}
      aria-pressed={isPinned}
      aria-label={isPinned ? "Unpin application" : "Pin application"}
      title={isPinned ? "Unpin" : "Pin to top"}
    >
      <PinIcon />
    </button>
    <button
      type="button"
      className={`${styles.iconBtnClose} iconCloseHit`}
      onClick={onClose}
      aria-label="Close details"
      title="Close"
    >
      <CloseIcon size={15} />
    </button>
  </div>
);

export default ApplicationDetailHeroActions;
