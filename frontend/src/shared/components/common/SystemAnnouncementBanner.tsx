"use client";

import React, { useEffect, useState } from "react";
import {
  Announcement,
  AnnouncementService,
} from "@/shared/services/announcementService";

export default function SystemAnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await AnnouncementService.getActive();
        if (res.success && res.data?.length) {
          setAnnouncements(res.data);
        }
      } catch {
        // silent
      }
    };
    load();
  }, []);

  if (!announcements.length) return null;

  const primary = announcements[0];

  return (
    <div
      role="status"
      style={{
        background: "var(--color-primary, #f97316)",
        color: "#fff",
        padding: "0.65rem 1rem",
        textAlign: "center",
        fontSize: "0.9rem",
      }}
    >
      <strong>{primary.title}</strong>
      {primary.body ? ` — ${primary.body}` : null}
    </div>
  );
}
