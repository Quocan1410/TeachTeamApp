import React, { useState, useEffect } from "react";
import type { Application as TutorApplication } from "@/shared/types/application";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import styles from "./applicant-stats-visualization.module.css";

interface ApplicantStatsVisualizationProps {
  applications: TutorApplication[];
}

// Define more specific types for the tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    payload: {
      name: string;
      value: number;
    };
  }>;
  label?: string;
}

const ApplicantStatsVisualization: React.FC<
  ApplicantStatsVisualizationProps
> = ({ applications }) => {
  const [selectedData, setSelectedData] = useState<
    { name: string; value: number }[]
  >([]);
  const [applicantStats, setApplicantStats] = useState<{
    mostChosen: { name: string; count: number } | null;
    leastChosen: { name: string; count: number } | null;
    notSelected: number;
    selectedCount: number;
    trendData: { date: string; count: number }[];
    skillDistribution: { skill: string; count: number }[];
  }>({
    mostChosen: null,
    leastChosen: null,
    notSelected: 0,
    selectedCount: 0,
    trendData: [],
    skillDistribution: [],
  });

  const [courseDistribution, setCourseDistribution] = useState<
    { name: string; count: number }[]
  >([]);
  const [availabilityData, setAvailabilityData] = useState<
    { name: string; value: number }[]
  >([]);
  const [timelineData, setTimelineData] = useState<
    { date: string; count: number }[]
  >([]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  // Colors for charts
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#4CAF50",
    "#FF5252",
    "#9C27B0",
  ];
  const SELECTION_COLORS = ["#00C49F", "#FF8042"];

  // Function to process timeline data
  const processTimelineData = (apps: TutorApplication[]) => {
    const timeline: Record<string, number> = {};
    apps.forEach((app) => {
      const date = new Date(app.dateApplied).toLocaleDateString();
      timeline[date] = (timeline[date] || 0) + 1;
    });
    return Object.entries(timeline)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Function to process skill distribution
  const processSkillDistribution = (apps: TutorApplication[]) => {
    const skillCount: Record<string, number> = {};
    apps.forEach((app) => {
      app.skills.forEach((skill) => {
        skillCount[skill] = (skillCount[skill] || 0) + 1;
      });
    });
    return Object.entries(skillCount)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 skills
  };

  // Calculate statistics based on applications
  useEffect(() => {
    if (applications.length === 0) return;

    // Process timeline data
    const timelineStats = processTimelineData(applications);
    setTimelineData(timelineStats);

    // Count selected applications per applicant
    const applicantSelectionCount = applications.reduce(
      (acc, app) => {
        if (app.selected) {
          acc[app.fullName] = (acc[app.fullName] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    // Convert to array for sorting
    const applicantArray = Object.entries(applicantSelectionCount).map(
      ([name, count]) => ({
        name,
        count,
      })
    );

    // Sort by count
    applicantArray.sort((a, b) => b.count - a.count);

    // Get most and least chosen
    const mostChosen = applicantArray.length > 0 ? applicantArray[0] : null;
    const leastChosen =
      applicantArray.length > 0
        ? applicantArray[applicantArray.length - 1]
        : null;

    // Count not selected
    const notSelected = applications.filter((app) => !app.selected).length;
    const selectedCount = applications.filter((app) => app.selected).length;

    // Process skills distribution
    const skillDistributionData = processSkillDistribution(applications);

    setApplicantStats({
      mostChosen,
      leastChosen,
      notSelected,
      selectedCount,
      trendData: timelineStats,
      skillDistribution: skillDistributionData,
    });

    // Prepare data for pie chart
    setSelectedData([
      { name: "Selected", value: selectedCount },
      { name: "Not Selected", value: notSelected },
    ]);

    // Process course distribution
    const courseCount: Record<string, number> = {};
    applications.forEach((app) => {
      app.courses.forEach((course) => {
        courseCount[course] = (courseCount[course] || 0) + 1;
      });
    });

    const courseData = Object.entries(courseCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 courses

    setCourseDistribution(courseData);

    // Process availability data
    const availabilityCount: Record<string, number> = {
      "Full Time": 0,
      "Part Time": 0,
    };

    applications.forEach((app) => {
      availabilityCount[app.availability] =
        (availabilityCount[app.availability] || 0) + 1;
    });

    const availabilityChartData = Object.entries(availabilityCount).map(
      ([name, value]) => ({ name, value })
    );

    setAvailabilityData(availabilityChartData);
  }, [applications]);

  // Get top applicants for bar chart
  const getTopApplicantsData = () => {
    const applicantSelectionCount = applications.reduce(
      (acc, app) => {
        if (app.selected) {
          acc[app.fullName] = (acc[app.fullName] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(applicantSelectionCount)
      .map(([name, count]) => ({
        name: name.split(" ")[0], // Use first name only for better display
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 applicants
  };

  // Custom tooltip component with proper typing
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.applicantStatsVisualization__customTooltip}>
          <p className={styles.applicantStatsVisualization__tooltipValue}>{`${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  if (applications.length === 0) {
    return (
      <div className={styles.applicantStatsVisualization__emptyStats}>
        <div className={styles.applicantStatsVisualization__emptyStatsIcon}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={styles.applicantStatsVisualization__iconLarge}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className={styles.applicantStatsVisualization__emptyStatsTitle}>
          No Application Data Available
        </h3>
        <p className={styles.applicantStatsVisualization__emptyStatsText}>
          Statistics will be displayed when applications are submitted.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={styles.applicantStatsVisualization__statsVisualizationContainer}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className={styles.applicantStatsVisualization__statsHeader} variants={itemVariants}>
        <div className={styles.applicantStatsVisualization__statsSummaryCards}>
          <div className={styles.applicantStatsVisualization__summaryCard}>
            <div className={`${styles.applicantStatsVisualization__summaryIcon} ${styles.applicantStatsVisualization__totalIcon}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.applicantStatsVisualization__iconMedium}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className={styles.applicantStatsVisualization__summaryContent}>
              <div className={styles.applicantStatsVisualization__summaryLabel}>Total Applications</div>
              <div className={styles.applicantStatsVisualization__summaryValue}>{applications.length}</div>
              <div className={styles.applicantStatsVisualization__summaryDesc}>
                All submitted applications
              </div>
            </div>
          </div>

          <div className={styles.applicantStatsVisualization__summaryCard}>
            <div className={`${styles.applicantStatsVisualization__summaryIcon} ${styles.applicantStatsVisualization__selectedIcon}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.applicantStatsVisualization__iconMedium}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className={styles.applicantStatsVisualization__summaryContent}>
              <div className={styles.applicantStatsVisualization__summaryLabel}>Selected</div>
              <div className={styles.applicantStatsVisualization__summaryValue}>
                {applicantStats.selectedCount}
              </div>
              <div className={styles.applicantStatsVisualization__summaryDesc}>Approved applicants</div>
            </div>
          </div>

          <div className={styles.applicantStatsVisualization__summaryCard}>
            <div className={`${styles.applicantStatsVisualization__summaryIcon} ${styles.applicantStatsVisualization__pendingIcon}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.applicantStatsVisualization__iconMedium}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className={styles.applicantStatsVisualization__summaryContent}>
              <div className={styles.applicantStatsVisualization__summaryLabel}>Pending</div>
              <div className={styles.applicantStatsVisualization__summaryValue}>
                {applicantStats.notSelected}
              </div>
              <div className={styles.applicantStatsVisualization__summaryDesc}>Awaiting review</div>
            </div>
          </div>

          <div className={styles.applicantStatsVisualization__summaryCard}>
            <div className={`${styles.applicantStatsVisualization__summaryIcon} ${styles.applicantStatsVisualization__rateIcon}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.applicantStatsVisualization__iconMedium}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div className={styles.applicantStatsVisualization__summaryContent}>
              <div className={styles.applicantStatsVisualization__summaryLabel}>Selection Rate</div>
              <div className={styles.applicantStatsVisualization__summaryValue}>
                {applications.length > 0
                  ? Math.round(
                      (applicantStats.selectedCount / applications.length) * 100
                    )
                  : 0}
                %
              </div>
              <div className={styles.applicantStatsVisualization__summaryDesc}>Overall acceptance rate</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className={styles.applicantStatsVisualization__statsChartsContainer}>
        <motion.div className={styles.applicantStatsVisualization__statsChartCard} variants={itemVariants}>
          <h3 className={styles.applicantStatsVisualization__chartTitle}>Selection Status</h3>
          <div className={styles.applicantStatsVisualization__pieChartContainer}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={selectedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {selectedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SELECTION_COLORS[index % SELECTION_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.applicantStatsVisualization__chartStats}>
            <div className={`${styles.applicantStatsVisualization__chartStatItem} ${styles["applicantStatsVisualization--selected"]}`}>
              <div className={styles.applicantStatsVisualization__statTitle}>Selected</div>
              <div className={styles.applicantStatsVisualization__statValue}>
                {applicantStats.selectedCount}
              </div>
              <div className={styles.applicantStatsVisualization__statDesc}>Confirmed positions</div>
              <div className={styles.applicantStatsVisualization__statDetails}>
                <div className={styles.applicantStatsVisualization__statDetailItem}>
                  <span className={styles.applicantStatsVisualization__detailLabel}>Last selected:</span>
                  <span className={styles.applicantStatsVisualization__detailValue}>Today</span>
                </div>
                <div className={styles.applicantStatsVisualization__statDetailItem}>
                  <span className={styles.applicantStatsVisualization__detailLabel}>Status:</span>
                  <span className={`${styles.applicantStatsVisualization__detailBadge} ${styles["applicantStatsVisualization--success"]}`}>
                    Active
                  </span>
                </div>
              </div>
            </div>
            <div className={`${styles.applicantStatsVisualization__chartStatItem} ${styles["applicantStatsVisualization--pending"]}`}>
              <div className={styles.applicantStatsVisualization__statTitle}>Pending</div>
              <div className={styles.applicantStatsVisualization__statValue}>
                {applicantStats.notSelected}
              </div>
              <div className={styles.applicantStatsVisualization__statDesc}>Under review</div>
              <div className={styles.applicantStatsVisualization__statDetails}>
                <div className={styles.applicantStatsVisualization__statDetailItem}>
                  <span className={styles.applicantStatsVisualization__detailLabel}>Updated:</span>
                  <span className={styles.applicantStatsVisualization__detailValue}>2 hrs ago</span>
                </div>
                <div className={styles.applicantStatsVisualization__statDetailItem}>
                  <span className={styles.applicantStatsVisualization__detailLabel}>Priority:</span>
                  <span className={`${styles.applicantStatsVisualization__detailBadge} ${styles["applicantStatsVisualization--warning"]}`}>
                    High
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div className={styles.applicantStatsVisualization__statsChartCard} variants={itemVariants}>
          <h3 className={styles.applicantStatsVisualization__chartTitle}>Top Selected Applicants</h3>
          <div className={styles.applicantStatsVisualization__barChartContainer}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={getTopApplicantsData()}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ display: "none" }} />
                <Bar dataKey="count" name="Selection Count" fill="#8884d8">
                  {getTopApplicantsData().map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.applicantStatsVisualization__chartInfo}>
            {applicantStats.mostChosen ? (
              <div className={styles.applicantStatsVisualization__topApplicant}>
                <span className={styles.applicantStatsVisualization__infoLabel}>Most Selected: </span>
                <span className={styles.applicantStatsVisualization__infoValue}>
                  {applicantStats.mostChosen.name}
                </span>
                <span className={styles.applicantStatsVisualization__infoCount}>
                  ({applicantStats.mostChosen.count} selections)
                </span>
              </div>
            ) : (
              <div className={styles.applicantStatsVisualization__noData}>No selection data available</div>
            )}
          </div>
        </motion.div>
      </div>

      <div className={styles.applicantStatsVisualization__statsChartsContainer}>
        <motion.div className={styles.applicantStatsVisualization__statsChartCard} variants={itemVariants}>
          <h3 className={styles.applicantStatsVisualization__chartTitle}>Course Distribution</h3>
          <div className={styles.applicantStatsVisualization__barChartContainer}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={courseDistribution}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ display: "none" }} />
                <Bar dataKey="count" name="Applicants" fill="#8884d8">
                  {courseDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className={styles.applicantStatsVisualization__statsChartCard} variants={itemVariants}>
          <h3 className={styles.applicantStatsVisualization__chartTitle}>Availability Distribution</h3>
          <div className={styles.applicantStatsVisualization__pieChartContainer}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={availabilityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {availabilityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index + (2 % COLORS.length)]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div className={styles.applicantStatsVisualization__statsInsights} variants={itemVariants}>
        <h3 className={styles.applicantStatsVisualization__insightsTitle}>Key Insights</h3>
        <div className={styles.applicantStatsVisualization__insightsContent}>
          {/* Application Trends */}
          <div className={styles.applicantStatsVisualization__trendChart}>
            <h4>Application Trends</h4>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={timelineData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Skills Distribution - Using skillsListContainer instead of skillsDistribution */}
          <div className={styles.applicantStatsVisualization__skillsListContainer}>
            <h4>Top Skills</h4>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart
                data={applicantStats.skillDistribution}
                layout="vertical"
              >
                <XAxis type="number" />
                <YAxis dataKey="skill" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.applicantStatsVisualization__insightItem}>
            <div className={styles.applicantStatsVisualization__insightIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.applicantStatsVisualization__iconSmall}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div className={styles.applicantStatsVisualization__insightContent}>
              <h4>Selection Rate</h4>
              <p>
                {applications.length > 0
                  ? `${Math.round(
                      (applicantStats.selectedCount / applications.length) * 100
                    )}% of applicants have been selected.`
                  : "No applications yet."}
                {applicantStats.selectedCount > 0 &&
                  ` That's ${applicantStats.selectedCount} out of ${applications.length} total applicants.`}
              </p>
            </div>
          </div>

          <div className={styles.applicantStatsVisualization__insightItem}>
            <div className={styles.applicantStatsVisualization__insightIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.applicantStatsVisualization__iconSmall}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className={styles.applicantStatsVisualization__insightContent}>
              <h4>Course Distribution</h4>
              <p>
                {courseDistribution.length > 0
                  ? `Most popular course: ${courseDistribution[0].name} with ${courseDistribution[0].count} applications.`
                  : "No course applications yet."}
              </p>
            </div>
          </div>

          <div className={styles.applicantStatsVisualization__insightItem}>
            <div className={styles.applicantStatsVisualization__insightIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.applicantStatsVisualization__iconSmall}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className={styles.applicantStatsVisualization__insightContent}>
              <h4>Top Performer</h4>
              <p>
                {applicantStats.mostChosen
                  ? `${applicantStats.mostChosen.name} leads with ${applicantStats.mostChosen.count} selections.`
                  : "No selections made yet."}
              </p>
            </div>
          </div>

          <div className={styles.applicantStatsVisualization__insightItem}>
            <div className={styles.applicantStatsVisualization__insightIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.applicantStatsVisualization__iconSmall}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div className={styles.applicantStatsVisualization__insightContent}>
              <h4>Availability Trend</h4>
              <p>
                {availabilityData.length > 0
                  ? `${
                      availabilityData[0].value > availabilityData[1].value
                        ? "Full-time"
                        : "Part-time"
                    } availability is preferred by applicants.`
                  : "No availability data yet."}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ApplicantStatsVisualization;
