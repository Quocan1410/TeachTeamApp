"use client";

import React from "react";
import AppSelect from "@/shared/components/common/app-select/AppSelect";
import {
  SECURITY_QUESTIONS,
  SECURITY_QUESTION_COUNT,
} from "@/shared/constants/securityQuestions";
import grid from "@/modules/auth/styles/signup-grid.module.css";
import styles from "./SecurityQuestionFields.module.css";

export interface SecurityAnswerFormRow {
  questionId: string;
  answer: string;
}

interface SecurityQuestionFieldsProps {
  rows: SecurityAnswerFormRow[];
  onChange: (rows: SecurityAnswerFormRow[]) => void;
  errors: Record<string, string>;
  disabled?: boolean;
  heading?: string;
  lockedQuestions?: { questionId: string; text: string }[];
}

const PLACEHOLDER_OPTION = {
  value: "",
  label: "Select a question",
  isDefault: true,
};

export default function SecurityQuestionFields({
  rows,
  onChange,
  errors,
  disabled = false,
  heading = "Security questions",
  lockedQuestions,
}: SecurityQuestionFieldsProps) {
  const updateRow = (
    index: number,
    patch: Partial<SecurityAnswerFormRow>
  ) => {
    const next = rows.map((row, i) =>
      i === index ? { ...row, ...patch } : row
    );
    onChange(next);
  };

  const usedIds = new Set(
    rows.map((r) => r.questionId).filter(Boolean)
  );

  const optionsForSlot = (index: number) => {
    const currentId = rows[index]?.questionId;
    return [
      PLACEHOLDER_OPTION,
      ...SECURITY_QUESTIONS.filter(
        (q) => q.id === currentId || !usedIds.has(q.id)
      ).map((q) => ({ value: q.id, label: q.text })),
    ];
  };

  const displayRows = lockedQuestions
    ? lockedQuestions.map((q) => ({
        questionId: q.questionId,
        text: q.text,
      }))
    : rows.map((r) => ({
        questionId: r.questionId,
        text:
          SECURITY_QUESTIONS.find((q) => q.id === r.questionId)?.text || "",
      }));

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.heading}>{heading}</h3>
      <p className={styles.hint}>
        Choose {SECURITY_QUESTION_COUNT} different questions and answers you will
        remember. 
      </p>
      {errors.securityAnswers && (
        <div className={styles.blockError}>{errors.securityAnswers}</div>
      )}
      <div className={grid.stack}>
        {displayRows.map((item, index) => (
          <div
            key={lockedQuestions ? item.questionId : index}
            className={grid.row}
          >
            <div className={grid.cell}>
              {lockedQuestions ? (
                <p className={styles.questionLabel}>{item.text}</p>
              ) : (
                <AppSelect
                  id={`security-question-${index}`}
                  value={rows[index]?.questionId || ""}
                  onChange={(value) =>
                    updateRow(index, {
                      questionId: value,
                      answer: rows[index]?.answer || "",
                    })
                  }
                  options={optionsForSlot(index)}
                  variant="pill"
                  hasError={!!errors[`securityAnswers.${index}.questionId`]}
                  className={grid.selectWrap}
                  aria-label={`Security question ${index + 1}`}
                  aria-required="true"
                  disabled={disabled}
                />
              )}
              {errors[`securityAnswers.${index}.questionId`] && (
                <span className={grid.fieldError}>
                  {errors[`securityAnswers.${index}.questionId`]}
                </span>
              )}
            </div>
            <div className={grid.cell}>
              <input
                type="text"
                className={`${grid.control} ${
                  errors[`securityAnswers.${index}.answer`]
                    ? grid.controlError
                    : ""
                }`}
                placeholder="Your answer"
                value={rows[index]?.answer || ""}
                onChange={(e) => updateRow(index, { answer: e.target.value })}
                disabled={disabled || (!lockedQuestions && !rows[index]?.questionId)}
                autoComplete="off"
                required={!lockedQuestions}
                aria-required={!lockedQuestions}
              />
              {errors[`securityAnswers.${index}.answer`] && (
                <span className={grid.fieldError}>
                  {errors[`securityAnswers.${index}.answer`]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const createEmptySecurityRows = (): SecurityAnswerFormRow[] =>
  Array.from({ length: SECURITY_QUESTION_COUNT }, () => ({
    questionId: "",
    answer: "",
  }));
