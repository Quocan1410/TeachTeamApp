import axios from "axios";
import { env } from "@/lib/env";

const announcementAPI = axios.create({
  baseURL: `${env.apiEndpoint}/announcements`,
});

announcementAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
