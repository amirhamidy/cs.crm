export interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  accent: string;
  stages: Stage[];
  employees: Employee[];
  createdAt: string;
}
