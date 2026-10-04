import { createApiClient } from "./apiClient";

const draftAPI = createApiClient("/application-drafts");

export interface DraftPayload {
  availability?: string;
  skills?: string;
  experience?: string;
  motivation?: string;
}

export const DraftService = {
  getDraft: (courseId: string, roleId: string) =>
    draftAPI.get(`/${courseId}/${roleId}`).then((r) => r.data),
  saveDraft: (courseId: string, roleId: string, payload: DraftPayload) =>
    draftAPI.put(`/${courseId}/${roleId}`, { payload }).then((r) => r.data),
  deleteDraft: (courseId: string, roleId: string) =>
    draftAPI.delete(`/${courseId}/${roleId}`).then((r) => r.data),
};
