import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import type { ApplicationResponse } from "@/shared/services/applicationService";
import styles from "./applicant-stats-visualization.module.css";

interface ApplicantStatsVisualizationProps {
  applications: ApplicationResponse[];
}

const ACCENT = "#f97316";
const MUTED = "#94a3b8";
const SOFT = "#fdba74";

const parseSkills = (skills?: string | null): string[] => {
  if (!skills || typeof skills !== "string") return [];
  return skills
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
};

const applicantName = (app: ApplicationResponse): string => {
  const first = app.candidate?.firstName?.trim() || "";
  const last = app.candidate?.lastName?.trim() || "";
  const full = `${first} ${last}`.trim();
  return full || app.candidate?.email || "Unknown";
};

const availabilityLabel = (app: ApplicationResponse): string => {
  const raw = app.availability?.type || "";
  const normalized = raw.toLowerCase().replace(/[_-]/g, " ").trim();
  if (normalized.includes("full")) return "Full time";
  if (normalized.includes("part")) return "Part time";
  return raw || "Unknown";
};

const ChartTip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tip}>
      {label ? <span className={styles.tipLabel}>{label}</span> : null}
      <span className={styles.tipValue}>{payload[0].value}</span>
    </div>
  );
};

const ApplicantStatsVisualization: React.FC<
  ApplicantStatsVisualizationProps
> = ({ applications }) => {
  const stats = useMemo(() => {
    const selectedCount = applications.filter(
      (app) => app.status === "selected"
    ).length;
    const pendingCount = applications.length - selectedCount;
    const rate =
      applications.length > 0
        ? Math.round((selectedCount / applications.length) * 100)
        : 0;

    const selectedByName: Record<string, number> = {};
    applications
      .filter((app) => app.status === "selected")
      .forEach((app) => {
        const name = applicantName(app);
        selectedByName[name] = (selectedByName[name] || 0) + 1;
      });
    const topApplicants = Object.entries(selectedByName)
      .map(([name, count]) => ({
        name: name.split(" ")[0] || name,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const timeline: Record<string, number> = {};
    applications.forEach((app) => {
      const raw = app.appliedAt || app.updatedAt;
      if (!raw) return;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      timeline[key] = (timeline[key] || 0) + 1;
    });
    const timelineData = Object.entries(timeline).map(([date, count]) => ({
      date,
      count,
    }));

    const skillCount: Record<string, number> = {};
    applications.forEach((app) => {
      parseSkills(app.skills).forEach((skill) => {
        skillCount[skill] = (skillCount[skill] || 0) + 1;
      });
    });
    const skillDistribution = Object.entries(skillCount)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const courseCount: Record<string, number> = {};
    applications.forEach((app) => {
      const code =
        app.course?.courseCode ||
        app.course?.courseName ||
        app.courseId ||
        "Unknown";
      courseCount[code] = (courseCount[code] || 0) + 1;
    });
    const courseDistribution = Object.entries(courseCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const availabilityCount: Record<string, number> = {};
    applications.forEach((app) => {
      const label = availabilityLabel(app);
      availabilityCount[label] = (availabilityCount[label] || 0) + 1;
    });
    const availabilityData = Object.entries(availabilityCount).map(
      ([name, value]) => ({ name, value })
    );

    return {
      selectedCount,
      pendingCount,
      rate,
      topApplicants,
      timelineData,
      skillDistribution,
      courseDistribution,
      availabilityData,
      statusData: [
        { name: "Selected", value: selectedCount },
        { name: "Other", value: pendingCount },
      ],
      leadCourse: courseDistribution[0] ?? null,
      leadSkill: skillDistribution[0] ?? null,
    };
  }, [applications]);

  if (applications.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No applications yet</p>
        <p className={styles.emptyText}>
          Charts appear here once candidates start applying to your courses.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <section className={styles.metrics} aria-label="Summary">
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Applications</span>
          <strong className={styles.metricValue}>{applications.length}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Selected</span>
          <strong className={styles.metricValue}>{stats.selectedCount}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Pending</span>
          <strong className={styles.metricValue}>{stats.pendingCount}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Selection rate</span>
          <strong className={styles.metricValue}>{stats.rate}%</strong>
        </div>
      </section>

      <section className={styles.charts}>
        <article className={styles.block}>
          <h3 className={styles.blockTitle}>Status</h3>
          <div className={styles.chartFrame}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={74}
                  paddingAngle={2}
                  stroke="none"
                >
                  <Cell fill={ACCENT} />
                  <Cell fill={MUTED} />
                </Pie>
                <Tooltip content={<ChartTip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className={styles.blockNote}>
            {stats.selectedCount} selected · {stats.pendingCount} still open
          </p>
        </article>

        <article className={styles.block}>
          <h3 className={styles.blockTitle}>By course</h3>
          <div className={styles.chartFrame}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={stats.courseDistribution}
                layout="vertical"
                margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={72}
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTip />} cursor={{ fill: "transparent" }} />
                <Bar dataKey="count" fill={ACCENT} radius={[0, 6, 6, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {stats.leadCourse ? (
            <p className={styles.blockNote}>
              Most applications: {stats.leadCourse.name} (
              {stats.leadCourse.count})
            </p>
          ) : null}
        </article>

        <article className={styles.block}>
          <h3 className={styles.blockTitle}>Availability</h3>
          <div className={styles.chartFrame}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.availabilityData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={74}
                  paddingAngle={2}
                  stroke="none"
                >
                  {stats.availabilityData.map((_, index) => (
                    <Cell
                      key={`avail-${index}`}
                      fill={index === 0 ? ACCENT : SOFT}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className={styles.blockNote}>
            {stats.availabilityData
              .map((row) => `${row.name} ${row.value}`)
              .join(" · ")}
          </p>
        </article>

        <article className={styles.block}>
          <h3 className={styles.blockTitle}>Top selected</h3>
          <div className={styles.chartFrame}>
            {stats.topApplicants.length === 0 ? (
              <p className={styles.blockNote}>No selections yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={stats.topApplicants}
                  margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "currentColor", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "transparent" }} />
                  <Bar dataKey="count" fill={ACCENT} radius={[6, 6, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>

      <section className={styles.lower}>
        <article className={styles.blockWide}>
          <h3 className={styles.blockTitle}>Application pace</h3>
          <div className={styles.chartFrameTall}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart
                data={stats.timelineData}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <XAxis
                  dataKey="date"
                  tick={{ fill: "currentColor", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<ChartTip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={ACCENT}
                  strokeWidth={2}
                  dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className={styles.blockWide}>
          <h3 className={styles.blockTitle}>Skills mentioned</h3>
          {stats.skillDistribution.length === 0 ? (
            <p className={styles.blockNote}>No skill tags yet.</p>
          ) : (
            <ul className={styles.skillList}>
              {stats.skillDistribution.map((row) => {
                const max = stats.skillDistribution[0]?.count || 1;
                const width = Math.max(12, Math.round((row.count / max) * 100));
                return (
                  <li key={row.skill} className={styles.skillRow}>
                    <span className={styles.skillName}>{row.skill}</span>
                    <span className={styles.skillTrack} aria-hidden="true">
                      <span
                        className={styles.skillFill}
                        style={{ width: `${width}%` }}
                      />
                    </span>
                    <span className={styles.skillCount}>{row.count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
};

export default ApplicantStatsVisualization;
