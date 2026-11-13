import axios from "axios";
import axiosInstance from "@/lib/axiosInstance";
import { listAll } from "@/lib/api";
import { getApiUrl } from "@/lib/config";
import type { MeetingCreatePayload, MeetingDetail, MeetingListItem, MeetingStatus, MeetingUpdatePayload, PublicSigner, SignerCreatePayload, SignerItem, SignerUpdatePayload } from "@/types/minutes";

const BASE = "/minutes/api/v1";


const publicClient = axios.create({
  headers: { "Content-Type": "application/json" },
});
publicClient.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();
  return config;
});

export const minutesApi = {
  
  async listMeetings(params: { status?: MeetingStatus | ""; search?: string } = {}) {
    const query: Record<string, string> = {};
    if (params.status) query.status = params.status;
    if (params.search?.trim()) query.search = params.search.trim();
    return listAll<MeetingListItem>(`${BASE}/meeting/list/`, query);
  },

  async getMeeting(id: number) {
    const res = await axiosInstance.get<MeetingDetail>(`${BASE}/meeting/${id}/`);
    return res.data;
  },

  async createMeeting(payload: MeetingCreatePayload) {
    const res = await axiosInstance.post<{ id?: number }>(`${BASE}/meeting/create/`, payload);
    return res.data;
  },

  async replaceMeeting(id: number, payload: MeetingCreatePayload) {
    const res = await axiosInstance.put<MeetingDetail>(`${BASE}/meeting/${id}/update/`, payload);
    return res.data;
  },

  async updateMeeting(id: number, payload: MeetingUpdatePayload) {
    const res = await axiosInstance.patch<MeetingDetail>(`${BASE}/meeting/${id}/update/`, payload);
    return res.data;
  },

  async deleteMeeting(id: number) {
    await axiosInstance.delete(`${BASE}/meeting/${id}/delete/`);
  },

  async sendMeeting(id: number) {
    const res = await axiosInstance.post<MeetingDetail>(`${BASE}/meeting/${id}/send/`);
    return res.data;
  },

  async cancelMeeting(id: number) {
    const res = await axiosInstance.post<MeetingDetail>(`${BASE}/meeting/${id}/cancel/`);
    return res.data;
  },

  
  async mySignatures(pendingOnly = false) {
    return listAll<SignerItem>(`${BASE}/signer/my/`, pendingOnly ? { pending: 1 } : {});
  },

  async createSigner(payload: SignerCreatePayload) {
    const res = await axiosInstance.post<SignerItem>(`${BASE}/signer/create/`, payload);
    return res.data;
  },

  async replaceSigner(id: number, payload: SignerUpdatePayload) {
    const res = await axiosInstance.put<SignerItem>(`${BASE}/signer/${id}/update/`, payload);
    return res.data;
  },

  async updateSigner(id: number, payload: SignerUpdatePayload) {
    const res = await axiosInstance.patch<SignerItem>(`${BASE}/signer/${id}/update/`, payload);
    return res.data;
  },

  async deleteSigner(id: number) {
    await axiosInstance.delete(`${BASE}/signer/${id}/delete/`);
  },

  
  async signInternal(signerId: number, signatureImage: string) {
    const res = await axiosInstance.post<SignerItem>(`${BASE}/signer/${signerId}/sign/`, {
      signature_image: signatureImage,
    });
    return res.data;
  },

  
  async getPublicSigner(token: string) {
    const res = await axios.get<PublicSigner>(`/api/public-sign/${encodeURIComponent(token)}`);
    return res.data;
  },

  async signPublic(token: string, signatureImage: string) {
    const res = await axios.post<PublicSigner>(`/api/public-sign/${encodeURIComponent(token)}`, {
      signature_image: signatureImage,
    });
    return res.data;
  },
};
