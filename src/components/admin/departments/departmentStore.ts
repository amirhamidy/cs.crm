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
name: e.full_name,
role: e.username ?? "—",
avatar: undefined,
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

let fetchVersion = 0;
let mutationQueue: Promise<unknown> = Promise.resolve();

function queueMutation<T>(mutation: () => Promise<T>): Promise<T> {
const next = mutationQueue.then(mutation, mutation);
mutationQueue = next.then(
() => undefined,
() => undefined,
);
return next;
}

interface DepartmentStore {
departments: Department[];
allEmployees: Employee[];
loading: boolean;
error: string | null;
fetchAll: () => Promise<void>;
addDepartment: (name: string) => Promise<void>;
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
const version = ++fetchVersion;

 
set({
  loading: true,
  error: null,
});

try {
  const [depts, employees, assignments, steps] = await Promise.all([
    departmentApi.getDepartments(),
    departmentApi.getEmployees(),
    departmentApi.getAssignments(),
    departmentApi.getSteps(),
  ]);

  if (version !== fetchVersion) {
    return;
  }

  const mappedEmployees = employees.map((e) => mapEmployee(e));

  const departments = depts.map((d, i) => {
    const deptAssignments = assignments.filter(
      (a) => a.department === d.id,
    );

    const assignedEmployees = deptAssignments
      .map((a) => {
        const emp = employees.find((e) => e.id === a.employee);

        if (!emp) {
          return null;
        }

        return mapEmployee(emp, a);
      })
      .filter((e): e is Employee => e !== null);

    const deptStages = steps
      .filter((s) => s.department === d.id)
      .sort((a, b) => a.order - b.order)
      .map((s, idx) => mapStage(s, idx));

    return mapDepartment(
      d,
      i,
      assignedEmployees,
      deptStages,
    );
  });

  if (version !== fetchVersion) {
    return;
  }

  set({
    departments,
    allEmployees: mappedEmployees,
    loading: false,
    error: null,
  });
} catch (err: unknown) {
  if (version !== fetchVersion) {
    return;
  }

  const msg =
    err instanceof Error
      ? err.message
      : "خطا در دریافت اطلاعات";

  set({
    error: msg,
    loading: false,
  });
}
 

},

addDepartment: async (name: string) => {
return queueMutation(async () => {
const currentDepartments = get().departments;

 
  const maxOrder =
    currentDepartments.length > 0
      ? Math.max(
          ...currentDepartments.map((d) => d.order ?? 0),
        )
      : 0;

  await departmentApi.createDepartment({
    name,
    order: maxOrder + 1,
  });
});
 

},

updateDepartment: async (id: string, name: string) => {
return queueMutation(async () => {
const dept = get().departments.find(
(d) => String(d.id) === String(id),
);

 
  if (!dept) {
    return;
  }

  await departmentApi.updateDepartment(dept.apiId, {
    name,
    order: dept.order ?? 1,
  });

  set((state) => ({
    departments: state.departments.map((d) =>
      String(d.id) === String(id)
        ? {
            ...d,
            name,
          }
        : d,
    ),
    error: null,
  }));
});
 

},

deleteDepartment: async (id: string) => {
return queueMutation(async () => {
const dept = get().departments.find(
(d) => String(d.id) === String(id),
);

 
  if (!dept) {
    return;
  }

  await departmentApi.deleteDepartment(dept.apiId);

  set((state) => ({
    departments: state.departments.filter(
      (d) => String(d.id) !== String(id),
    ),
    error: null,
  }));
});
 

},

addStage: async (
departmentId,
{ name, description },
) => {
return queueMutation(async () => {
const dept = get().departments.find(
(d) => String(d.id) === String(departmentId),
);

 
  if (!dept) {
    return;
  }

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

  const newStage = mapStage(
    created,
    dept.stages.length,
  );

  set((state) => ({
    departments: state.departments.map((d) =>
      String(d.id) !== String(departmentId)
        ? d
        : {
            ...d,
            stages: [...d.stages, newStage].sort(
              (a, b) => a.order - b.order,
            ),
          },
    ),
    error: null,
  }));
});
 

},

updateStage: async (
departmentId,
stageId,
{ name, description, order },
) => {
return queueMutation(async () => {
const dept = get().departments.find(
(d) => String(d.id) === String(departmentId),
);

 
  const stage = dept?.stages.find(
    (s) => String(s.id) === String(stageId),
  );

  if (!dept || !stage) {
    return;
  }

  await departmentApi.updateStep(stage.apiId, {
    name,
    description,
    order,
  });

  set((state) => ({
    departments: state.departments.map((d) =>
      String(d.id) !== String(departmentId)
        ? d
        : {
            ...d,
            stages: d.stages
              .map((st) =>
                String(st.id) === String(stageId)
                  ? {
                      ...st,
                      name,
                      description,
                      order,
                    }
                  : st,
              )
              .sort((a, b) => a.order - b.order),
          },
    ),
    error: null,
  }));
});
 

},

deleteStage: async (
departmentId,
stageId,
) => {
return queueMutation(async () => {
const dept = get().departments.find(
(d) => String(d.id) === String(departmentId),
);

 
  const stage = dept?.stages.find(
    (s) => String(s.id) === String(stageId),
  );

  if (!dept || !stage) {
    return;
  }

  await departmentApi.deleteStep(stage.apiId);

  set((state) => ({
    departments: state.departments.map((d) =>
      String(d.id) !== String(departmentId)
        ? d
        : {
            ...d,
            stages: d.stages.filter(
              (st) =>
                String(st.id) !== String(stageId),
            ),
          },
    ),
    error: null,
  }));
});
 

},

assignEmployee: async (
departmentId: string,
employeeId: string,
) => {
return queueMutation(async () => {
const dept = get().departments.find(
(d) => String(d.id) === String(departmentId),
);

 
  const emp = get().allEmployees.find(
    (e) => String(e.id) === String(employeeId),
  );

  if (!dept || !emp) {
    return;
  }

  const assignment =
    await departmentApi.assignEmployee({
      employee: emp.apiId,
      department: dept.apiId,
    });

  const empWithAssignment: Employee = {
    ...emp,
    assignmentId: assignment.id,
  };

  set((state) => ({
    departments: state.departments.map((d) =>
      String(d.id) !== String(departmentId)
        ? d
        : {
            ...d,
            employees: d.employees.some(
              (e) =>
                String(e.id) === String(employeeId),
            )
              ? d.employees.map((e) =>
                  String(e.id) ===
                  String(employeeId)
                    ? empWithAssignment
                    : e,
                )
              : [
                  ...d.employees,
                  empWithAssignment,
                ],
          },
    ),
    error: null,
  }));
});
 

},

removeEmployee: async (
departmentId: string,
employeeId: string,
) => {
return queueMutation(async () => {
const dept = get().departments.find(
(d) => String(d.id) === String(departmentId),
);

 
  const emp = dept?.employees.find(
    (e) => String(e.id) === String(employeeId),
  );

  if (!dept || !emp) {
    return;
  }

  if (!emp.assignmentId) {
    throw new Error(
      "شناسه تخصیص یافت نشد",
    );
  }

  await departmentApi.removeEmployee(
    emp.assignmentId,
  );

  set((state) => ({
    departments: state.departments.map((d) =>
      String(d.id) !== String(departmentId)
        ? d
        : {
            ...d,
            employees: d.employees.filter(
              (e) =>
                String(e.id) !==
                String(employeeId),
            ),
          },
    ),
    error: null,
  }));
});
 

},
}));
