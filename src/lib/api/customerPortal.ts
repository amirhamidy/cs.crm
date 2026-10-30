"use client";
import axiosInstance from "@/lib/axiosInstance";
import { cached, dedupe, fetchPage, getOne, invalidate, toPaginated } from "./_core";
import type { Paginated } from "@/types/pagination";
import type { AdminPortalAccount, CreatePortalAccountPayload, CreatePortalAccountResponse, PortalOrder, OrderStatus } from "@/types/portal";

const KEY="customerPortal:";
const BASE="/customer_portal/api/v1";
const urls={
  accounts:`${BASE}/accounts/list/`,
  account:(id:number)=>`${BASE}/accounts/${id}/`,
  create:`${BASE}/accounts/create/`,
  update:(id:number)=>`${BASE}/accounts/${id}/update/`,
  remove:(id:number)=>`${BASE}/accounts/${id}/delete/`,
  password:(id:number)=>`${BASE}/accounts/${id}/set-password/`,
  orders:`${BASE}/orders/list/`,
  order:(id:number)=>`${BASE}/orders/${id}/`,
  status:(id:number)=>`${BASE}/orders/${id}/status/`,
};
export interface PortalAccountParams { page?:number; page_size?:number; search?:string; is_active?:boolean; }
export interface CustomerOrderParams { page?:number; page_size?:number; search?:string; status?:OrderStatus; customer?:number; }
export const customerPortalApi={
 accounts:{
  page:(params:PortalAccountParams,signal?:AbortSignal):Promise<Paginated<AdminPortalAccount>>=>fetchPage<AdminPortalAccount>(urls.accounts,params,signal),
  list:(params:PortalAccountParams={})=>dedupe(`${KEY}accounts:${JSON.stringify(params)}`,async()=>toPaginated<AdminPortalAccount>((await axiosInstance.get(urls.accounts,{params})).data)),
  get:(id:number)=>cached(`${KEY}account:${id}`,()=>getOne<AdminPortalAccount>(urls.account(id))),
  create:async(payload:CreatePortalAccountPayload)=>{const {data}=await axiosInstance.post<CreatePortalAccountResponse>(urls.create,payload);invalidate(KEY);return data;},
  update:async(id:number,payload:{username?:string;is_active?:boolean})=>{const {data}=await axiosInstance.patch<AdminPortalAccount>(urls.update(id),payload);invalidate(KEY);return data;},
  remove:async(id:number)=>{await axiosInstance.delete(urls.remove(id));invalidate(KEY);},
  setPassword:async(id:number,password?:string)=>{const {data}=await axiosInstance.post<{generated_password?:string;detail?:string}>(urls.password(id),password?{password}:{});invalidate(KEY);return data;},
 },
 orders:{
  page:(params:CustomerOrderParams,signal?:AbortSignal):Promise<Paginated<PortalOrder>>=>fetchPage<PortalOrder>(urls.orders,params,signal),
  get:(id:number)=>getOne<PortalOrder>(urls.order(id)),
  setStatus:async(id:number,status:"confirmed"|"rejected",staff_note:string)=>{const {data}=await axiosInstance.post<PortalOrder>(urls.status(id),{status,staff_note});invalidate(KEY);return data;},
 },
 invalidate:()=>invalidate(KEY),
};
