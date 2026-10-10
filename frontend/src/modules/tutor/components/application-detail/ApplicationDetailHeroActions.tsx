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
  <div className={`${styles.applicationDetailPanel__heroActions} ${className ?? ""}`}>
    <button
      type="button"
      className={`${styles.applicationDetailPanel__iconBtnPin} iconClose__hit iconClose__circle ${isPinned ? styles.applicationDetailPanel__iconBtnPinActive : ""}`}
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
      className={`${styles.applicationDetailPanel__iconBtnClose} iconClose__hit iconClose__circle`}
      onClick={onClose}
      aria-label="Close details"
      title="Close"
    >
      <CloseIcon size={15} />
    </button>
  </div>
);

export default ApplicationDetailHeroActions;
