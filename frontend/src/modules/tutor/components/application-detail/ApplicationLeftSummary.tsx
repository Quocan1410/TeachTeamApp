"use client";

import React from "react";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import ApplicationSummaryCard from "./ApplicationSummaryCard";
import styles from "./ApplicationLeftSummary.module.css";

interface ApplicationLeftSummaryProps {
  application: ApplicationResponse;
  className?: string;
}

const ApplicationLeftSummary: React.FC<ApplicationLeftSummaryProps> = ({
  application,
  className,
}) => (
  <div className={`${styles.shell} ${className ?? ""}`}>
    <ApplicationSummaryCard application={application} />
  </div>
);

export default ApplicationLeftSummary;
