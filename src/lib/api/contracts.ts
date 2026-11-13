import axiosInstance from "@/lib/axiosInstance";
import type { Contract, ContractSignature, ContractListParams, ContractPayload } from "@/types/contract";
import type { Paginated } from "@/types/pagination";
import { fetchPage } from "./_core";

const BASE = "/hr/api/v1/contract";
const SIG = "/hr/api/v1/signature";

const URLS = {
  list: `${BASE}/list/`,
  create: `${BASE}/create/`,
  detail: (id: number) => `${BASE}/${id}/`,
  update: (id: number) => `${BASE}/${id}/update/`,
  remove: (id: number) => `${BASE}/${id}/delete/`,
  send: (id: number) => `${BASE}/${id}/send/`,
  cancel: (id: number) => `${BASE}/${id}/cancel/`,
  signatureMy: `${SIG}/my/`,
  signatureDetail: (id: number) => `${SIG}/${id}/`,
  sign: (id: number) => `${SIG}/${id}/sign/`,
  register: (id: number) => `${SIG}/${id}/register/`,
} as const;

export const MAX_SIGNATURE_LENGTH = 500_000;
export const SIGNATURE_PREFIX = "data:image/png;base64,";

export function validateSignature(value: string | null): string | null {
  if (!value) return "لطفاً امضا را رسم کنید.";
  if (!value.startsWith(SIGNATURE_PREFIX)) return "فرمت امضا معتبر نیست.";
  if (value.length > MAX_SIGNATURE_LENGTH) return "حجم امضا بیش از حد مجاز است.";
  return null;
}

const post = async (url: string, body?: object) => (await axiosInstance.post<Contract>(url, body)).data;

export const contractsApi = {
  list: (params: ContractListParams = {}, signal?: AbortSignal): Promise<Paginated<Contract>> =>
    fetchPage<Contract>(URLS.list, { ...params }, signal),
  get: async (id: number) => (await axiosInstance.get<Contract>(URLS.detail(id))).data,
  create: async (payload: ContractPayload) => (await axiosInstance.post<Contract>(URLS.create, payload)).data,
  update: async (id: number, payload: Partial<ContractPayload>) =>
    (await axiosInstance.patch<Contract>(URLS.update(id), payload)).data,
  remove: async (id: number) => {
    await axiosInstance.delete(URLS.remove(id));
  },
  mySignatures: async (): Promise<ContractSignature[]> => {
    const { data } = await axiosInstance.get<ContractSignature[] | { results: ContractSignature[] }>(URLS.signatureMy);
    return Array.isArray(data) ? data : data.results ?? [];
  },
  signatureDetail: async (id: number) => (await axiosInstance.get<ContractSignature>(URLS.signatureDetail(id))).data,
  send: (id: number) => post(URLS.send(id)),
  cancel: (id: number) => post(URLS.cancel(id)),
  sign: (id: number, signature: string) => post(URLS.sign(id), { signature }),
  registerSignature: (id: number, signature: string) => post(URLS.register(id), { signature }),
};
