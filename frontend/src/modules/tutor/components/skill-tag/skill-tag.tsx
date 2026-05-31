import React from "react";
import CloseIcon from "@/shared/components/common/icons/CloseIcon";
import styles from "./skill-tag.module.css";

interface SkillTagProps {
  skill: string;
  onRemove?: (skill: string) => void;
}

const SkillTag: React.FC<SkillTagProps> = ({ skill, onRemove }) => {
  return (
    <div className={styles.skillTag}>
      {skill}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(skill)}
          className={`${styles.skillTagRemove} iconCloseHit iconCloseCircle`}
          aria-label={`Remove skill ${skill}`}
        >
          <CloseIcon size={12} />
        </button>
      )}
    </div>
  );
};

export default SkillTag;
