"use client";

import React from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import styles from "./KanbanBoard.module.css";

const COLUMNS = [
  { key: "pending", label: "Pending" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "selected", label: "Selected" },
  { key: "rejected", label: "Rejected" },
] as const;

type StatusKey = (typeof COLUMNS)[number]["key"];

interface KanbanBoardProps {
  applications: ApplicationResponse[];
  selectedId: number | null;
  compareIds: number[];
  onSelect: (app: ApplicationResponse) => void;
  onToggleCompare: (app: ApplicationResponse) => void;
  onMoveStatus: (
    app: ApplicationResponse,
    status: StatusKey
  ) => void | Promise<void>;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  selectedId,
  compareIds,
  onSelect,
  onToggleCompare,
  onMoveStatus,
}) => {
  const byStatus = (status: StatusKey) =>
    applications.filter((a) => a.status === status);

  return (
    <div className={styles.board}>
      {COLUMNS.map((col) => {
        const items = byStatus(col.key);
        return (
          <div
            key={col.key}
            className={`${styles.column} ${styles[col.key]}`}
          >
            <div className={styles.columnHeader}>
              {col.label}
              <span className={styles.count}>{items.length}</span>
            </div>
            <div className={styles.columnBody}>
              {items.map((app) => {
                const name = `${app.candidate?.firstName ?? ""} ${app.candidate?.lastName ?? ""}`.trim();
                const isSelected = selectedId === app.id;
                const inCompare = compareIds.includes(app.id);
                return (
                  <button
                    key={app.id}
                    type="button"
                    className={`${styles.card} ${isSelected ? styles.cardSelected : ""} ${inCompare ? styles.cardCompare : ""}`}
                    onClick={() => onSelect(app)}
                  >
                    <div className={styles.cardName}>{name || "Candidate"}</div>
                    <div className={styles.cardMeta}>
                      {app.course.courseCode} · {app.role?.roleName}
                    </div>
                    <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={styles.miniBtn}
                        onClick={() => onToggleCompare(app)}
                      >
                        {inCompare ? "✓ Compare" : "Compare"}
                      </button>
                      {COLUMNS.filter((c) => c.key !== col.key).map((target) => (
                        <button
                          key={target.key}
                          type="button"
                          className={styles.miniBtn}
                          onClick={() => onMoveStatus(app, target.key)}
                        >
                          → {target.label}
                        </button>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
