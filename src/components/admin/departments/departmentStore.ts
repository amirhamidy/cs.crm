import { create } from "zustand";
import {
  Department,
  Employee,
  Stage,
  DepartmentAPIItem,
  EmployeeAPIItem,
  StageAPIItem,
  DepartmentEmployeeAPIItem,
} from "./types";
import { departmentApi } from "./departmentApi";

const ACCENTS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
];

const STAGE_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
];

function mapEmployee(
  e: EmployeeAPIItem,
  assignment?: DepartmentEmployeeAPIItem,
): Employee {
  return {
    id: String(e.id),
    apiId: e.id,
    assignmentId: assignment?.id,
    name: `${e.first_name} ${e.last_name}`.trim(),
    role: e.role ?? "—",
    avatar: e.avatar,
  };
}

function mapStage(s: StageAPIItem, index: number): Stage {
  return {
    id: String(s.id),
    apiId: s.id,
    name: s.name,
    description: s.description,
    order: s.order,
    color: STAGE_COLORS[index % STAGE_COLORS.length],
  };
}

function mapDepartment(
  d: DepartmentAPIItem,
  index: number,
  assignedEmployees: Employee[] = [],
  stages: Stage[] = [],
): Department {
  return {
    id: String(d.id),
    apiId: d.id,
    name: d.name,
    description: "",
    accent: ACCENTS[index % ACCENTS.length],
    stages,
    employees: assignedEmployees,
    createdAt: new Date().toLocaleDateString("fa-IR"),
    order: d.order,
  };
}

interface DepartmentStore {
  departments: Department[];
  allEmployees: Employee[];
  loading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;

  addDepartment: (name: string) => Promise<Department>;
  updateDepartment: (id: string, name: string) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;

  addStage: (
    departmentId: string,
    payload: { name: string; description?: string },
  ) => Promise<void>;
  updateStage: (
    departmentId: string,
    stageId: string,
    payload: { name: string; description?: string; order: number },
  ) => Promise<void>;
  deleteStage: (departmentId: string, stageId: string) => Promise<void>;

  assignEmployee: (departmentId: string, employeeId: string) => Promise<void>;
  removeEmployee: (departmentId: string, employeeId: string) => Promise<void>;
}

export const useDepartmentStore = create<DepartmentStore>((set, get) => ({
  departments: [],
  allEmployees: [],
  loading: false,
  error: null,

  

  fetchAll: async () => {
    
    set({ loading: true, error: null });
    try {
      const [depts, employees, assignments, steps] = await Promise.all([
        
        departmentApi.getDepartments(),
        departmentApi.getEmployees(),
        departmentApi.getAssignments(),
        departmentApi.getSteps(),

      ]);

      const mappedEmployees = employees.map((e) => mapEmployee(e));

      const departments = depts.map((d, i) => {
        const deptAssignments = assignments.filter(
          (a) => a.department === d.id,
        );

        const assignedEmployees = deptAssignments
          .map((a) => {
            const emp = employees.find((e) => e.id === a.employee);
            if (!emp) return null;
            return mapEmployee(emp, a);
          })
          .filter((e): e is Employee => e !== null);

        const deptStages = steps
          .filter((s) => s.department === d.id)
          .sort((a, b) => a.order - b.order)
          .map((s, idx) => mapStage(s, idx));

        return mapDepartment(d, i, assignedEmployees, deptStages);
      });

      set({ departments, allEmployees: mappedEmployees, loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در دریافت اطلاعات";
      set({ error: msg, loading: false });
    }
  },

  addDepartment: async (name: string) => {
    const { departments } = get();
    const maxOrder =
      departments.length > 0 ? Math.max(...departments.map((d) => d.order)) : 0;
    const created = await departmentApi.createDepartment({
      name,
      order: maxOrder + 1,
    });
    const newDept = mapDepartment(created, departments.length);
    set({ departments: [...departments, newDept] });
    return newDept;
  },

  updateDepartment: async (id: string, name: string) => {
    const { departments } = get();
    const dept = departments.find((d) => d.id === id);
    if (!dept) return;

    await departmentApi.updateDepartment(dept.apiId, {
      name,
      order: dept.order ?? 1,
    });

    set({
      departments: departments.map((d) => (d.id === id ? { ...d, name } : d)),
    });
  },

  deleteDepartment: async (id: string) => {
    const { departments } = get();
    const dept = departments.find((d) => d.id === id);
    if (!dept) return;

    await departmentApi.deleteDepartment(dept.apiId);

    set({ departments: departments.filter((d) => d.id !== id) });
  },

  addStage: async (departmentId, { name, description }) => {
    const { departments } = get();
    const dept = departments.find((d) => d.id === departmentId);
    if (!dept) return;

    const order =
      dept.stages.length > 0
        ? Math.max(...dept.stages.map((s) => s.order)) + 1
        : 1;

    const created = await departmentApi.createStep({
      department: dept.apiId,
      name,
      description,
      order,
    });

    const newStage = mapStage(created, dept.stages.length);

    set((s) => ({
      departments: s.departments.map((d) =>
        d.id === departmentId ? { ...d, stages: [...d.stages, newStage] } : d,
      ),
    }));
  },

  updateStage: async (departmentId, stageId, { name, description, order }) => {
    const { departments } = get();
    const dept = departments.find((d) => d.id === departmentId);
    const stage = dept?.stages.find((s) => s.id === stageId);
    if (!dept || !stage) return;

    await departmentApi.updateStep(stage.apiId, { name, description, order });

    set((s) => ({
      departments: s.departments.map((d) =>
        d.id !== departmentId
          ? d
          : {
              ...d,
              stages: d.stages.map((st) =>
                st.id === stageId ? { ...st, name, description, order } : st,
              ),
            },
      ),
    }));
  },

  deleteStage: async (departmentId, stageId) => {
    const { departments } = get();
    const dept = departments.find((d) => d.id === departmentId);
    const stage = dept?.stages.find((s) => s.id === stageId);
    if (!dept || !stage) return;

    await departmentApi.deleteStep(stage.apiId);

    set((s) => ({
      departments: s.departments.map((d) =>
        d.id !== departmentId
          ? d
          : { ...d, stages: d.stages.filter((st) => st.id !== stageId) },
      ),
    }));
  },

  assignEmployee: async (departmentId: string, employeeId: string) => {
    const { departments } = get();
    const dept = departments.find((d) => d.id === departmentId);
    if (!dept) return;

    const assignment = await departmentApi.assignEmployee({
      employee: Number(employeeId),
      department: dept.apiId,
    });

    set((s) => {
      const emp = s.allEmployees.find((e) => e.id === employeeId);
      if (!emp) return s;

      const empWithAssignment: Employee = {
        ...emp,
        assignmentId: assignment.id,
      };

      return {
        departments: s.departments.map((d) =>
          d.id !== departmentId
            ? d
            : {
                ...d,
                employees: d.employees.some((e) => e.id === employeeId)
                  ? d.employees
                  : [...d.employees, empWithAssignment],
              },
        ),
      };
    });
  },

  removeEmployee: async (departmentId: string, employeeId: string) => {
    const { departments } = get();
    const dept = departments.find((d) => d.id === departmentId);
    const emp = dept?.employees.find((e) => e.id === employeeId);
    if (!dept || !emp) return;

    if (!emp.assignmentId) {
      throw new Error("شناسه تخصیص یافت نشد");
    }

    await departmentApi.removeEmployee(emp.assignmentId);

    set((s) => ({
      departments: s.departments.map((d) =>
        d.id !== departmentId
          ? d
          : { ...d, employees: d.employees.filter((e) => e.id !== employeeId) },
      ),
    }));
  },
}));
