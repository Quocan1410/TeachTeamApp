import { createApiClient } from "./apiClient";

const announcementAPI = createApiClient("/announcements");

export interface Announcement {
  id: number;
  title: string;
  body: string;
}

export const AnnouncementService = {
  getActive: () =>
    announcementAPI.get("/active").then((r) => r.data),
};
