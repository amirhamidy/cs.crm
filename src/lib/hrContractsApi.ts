import axiosInstance from "@/lib/axiosInstance";
import { listAll } from "@/lib/api";
import type {
  ContractStatus, HrContractDetail, HrContractListItem, HrContractPayload,
  HrResponsible, HrSignature, HrSummary,
} from "@/types/hrContracts";

const BASE = "/hr/api/v1";

export const hrContractsApi = {
  async getResponsible() {
    return (await axiosInstance.get<HrResponsible>(`${BASE}/responsible/`)).data;
  },
  async setResponsible(user: number | null) {
    return (await axiosInstance.put<HrResponsible>(`${BASE}/responsible/`, { user })).data;
  },
  async summary() {
    return (await axiosInstance.get<HrSummary>(`${BASE}/summary/`)).data;
  },
  async list(params: { status?: ContractStatus | ""; department?: number | ""; search?: string } = {}) {
    const q: Record<string, string> = {};
    if (params.status) q.status = params.status;
    if (params.department) q.department = String(params.department);
    if (params.search?.trim()) q.search = params.search.trim();
    return listAll<HrContractListItem>(`${BASE}/contract/list/`, q);
  },
  async get(id: number) {
    return (await axiosInstance.get<HrContractDetail>(`${BASE}/contract/${id}/`)).data;
  },
  async create(p: HrContractPayload) {
    return (await axiosInstance.post<{ id?: number }>(`${BASE}/contract/create/`, p)).data;
  },
  async update(id: number, p: Partial<HrContractPayload>) {
    return (await axiosInstance.patch(`${BASE}/contract/${id}/update/`, p)).data;
  },
  async remove(id: number) {
    await axiosInstance.delete(`${BASE}/contract/${id}/delete/`);
  },
  async send(id: number) {
    return (await axiosInstance.post(`${BASE}/contract/${id}/send/`)).data;
  },
  async cancel(id: number) {
    return (await axiosInstance.post(`${BASE}/contract/${id}/cancel/`)).data;
  },
  async mySignatures(pending = false) {
    return listAll<HrSignature>(`${BASE}/signature/my/`, pending ? { pending: "1" } : {});
  },
  async sign(id: number, signature_image: string) {
    return (await axiosInstance.post(`${BASE}/signature/${id}/sign/`, { signature_image })).data;
  },
  async register(id: number) {
    return (await axiosInstance.post(`${BASE}/signature/${id}/register/`, { method: "employer" })).data;
  },
  async getSignature(id: number) {
    return (await axiosInstance.get<HrSignature>(`${BASE}/signature/${id}/`)).data;
  },
};
