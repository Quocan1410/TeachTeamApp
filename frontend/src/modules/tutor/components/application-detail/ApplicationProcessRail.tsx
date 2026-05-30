"use client";

import React, { useMemo } from "react";
import type { ApplicationProcessFlow } from "@/shared/utils/applicationProcessFlow";
import { isConnectorAfterActive } from "@/shared/utils/applicationProcessFlow";
import styles from "./ApplicationDetailPanel.module.css";

interface ApplicationProcessRailProps {
  flow: ApplicationProcessFlow;
}

const VB_W = 1000;
const VB_H = 20;
/** Half of 0.76rem dot in viewBox units — line stops at circle edge */
const DOT_R = 4;

/** Match dot centers to equal-width CSS grid columns: (i + 0.5) / n */
function getCenterX(index: number, total: number): number {
  if (total <= 1) return VB_W / 2;
  return (VB_W * (index + 0.5)) / total;
}

export default function ApplicationProcessRail({
  flow,
}: ApplicationProcessRailProps) {
  const count = flow.steps.length;

  const connectors = useMemo(() => {
    if (count < 2) return [];
    return Array.from({ length: count - 1 }, (_, index) => {
      const x1 = getCenterX(index, count) + DOT_R;
      const x2 = getCenterX(index + 1, count) - DOT_R;
      const active = isConnectorAfterActive(flow.steps[index].state);
      return { index, x1, x2, active };
    });
  }, [count, flow.steps]);

  return (
    <div className={styles.stepRailWrap}>
      <svg
        className={styles.stepRailSvg}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        {connectors.map(({ index, x1, x2, active }) => (
          <line
            key={index}
            x1={x1}
            y1={VB_H / 2}
            x2={x2}
            y2={VB_H / 2}
            className={
              active ? styles.stepLineActive : styles.stepLinePending
            }
          />
        ))}
      </svg>
      <ol
        className={styles.stepRail}
        style={{ "--step-count": count } as React.CSSProperties}
        aria-label={`Application progress: ${flow.currentLabel}`}
      >
        {flow.steps.map((node) => (
          <li
            key={node.id}
            className={`${styles.stepSegment} ${styles[`stepNode_${node.state}`]}`}
            aria-current={node.state === "current" ? "step" : undefined}
          >
            <span className={styles.stepDotCell}>
              <span className={styles.stepDot} aria-hidden />
            </span>
            <span className={styles.stepLabel}>{node.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
