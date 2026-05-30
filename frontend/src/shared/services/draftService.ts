import axios from "axios";
import { env } from "@/lib/env";

const draftAPI = axios.create({
  baseURL: `${env.apiEndpoint}/application-drafts`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export interface DraftPayload {
  availability?: string;
  skills?: string;
  experience?: string;
  motivation?: string;
}

export const DraftService = {
  getDraft: (courseId: number, roleId: number) =>
    draftAPI.get(`/${courseId}/${roleId}`).then((r) => r.data),
  saveDraft: (courseId: number, roleId: number, payload: DraftPayload) =>
    draftAPI.put(`/${courseId}/${roleId}`, { payload }).then((r) => r.data),
  deleteDraft: (courseId: number, roleId: number) =>
    draftAPI.delete(`/${courseId}/${roleId}`).then((r) => r.data),
};
