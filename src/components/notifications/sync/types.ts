import type { NotificationInput } from "@/components/notifications/types";



export interface TicketAttachment {
  id: number;
  note: string;
  fileName: string;
  uploadedBy: number | null;
  createdAt: string;
}


export interface Ticket {
  id: number;
  title: string;
  status: string;
  assignedIds: number[];
  deadline: string | null;
  createdBy: string;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
  attachments: TicketAttachment[];
}

export interface Routine {
  id: number;
  task: number;
  nextRunAt: string | null;
  isActive: boolean;
}


export interface ProjectTask {
  id: number;
  title: string;
  status: string;
  currentStep: number;
  assignedIds: number[];
  departmentName: string;
  stepName: string;
  updatedAt: string;
}




export interface TicketMark {
  
  s: string;
  
  d: string | null;
  
  a: number;
  
  r: 0 | 1;
  
  t: number;
}


export interface TaskMark {
  
  m: 0 | 1;
  
  st: number;
  
  t: number;
}

export interface Snapshot {
  v: 1;
  
  tickets?: Record<string, TicketMark>;
  tasks?: Record<string, TaskMark>;
  
  routines?: Record<string, string>;
}



export interface Names {
  
  byId: Map<number, string>;
  
  byUserId: Map<number, string>;
  
  byUsername: Map<string, string>;
}

export interface DetectContext {
  
  userId: number;
  
  employeeId: number | null;
  username: string | null;
  now: number;
  
  selfTouched: Set<number>;
  names: Names;
  
  isTicketActive: (ticketId: number) => boolean;
}

export interface DetectResult<T> {
  events: NotificationInput[];
  next: T;
}
