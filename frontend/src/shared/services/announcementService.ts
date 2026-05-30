import axios from "axios";
import { env } from "@/lib/env";

const announcementAPI = axios.create({
  baseURL: `${env.apiEndpoint}/announcements`,
  withCredentials: true,
});

export interface Announcement {
  id: number;
  title: string;
  body: string;
}

export const AnnouncementService = {
  getActive: () =>
    announcementAPI.get("/active").then((r) => r.data),
};
