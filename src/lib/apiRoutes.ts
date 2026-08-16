export const apiRoutes = {
  customers: "/customers/api/v1/customers/",
  customer: (id: number) => `/customers/api/v1/customers/${id}/`,
  createCustomer: "/customers/api/v1/customers/create/",
  updateCustomer: (id: number) => `/customers/api/v1/customers/${id}/update/`,
  deleteCustomer: (id: number) => `/customers/api/v1/customers/${id}/delete/`,

  departments: "/department/api/v1/department/list/",
  department: (id: number) => `/department/api/v1/department/${id}/`,
  createDepartment: "/department/api/v1/department/create/",
  updateDepartment: (id: number) =>
    `/department/api/v1/department/${id}/update/`,
  deleteDepartment: (id: number) =>
    `/department/api/v1/department/${id}/delete/`,

  departmentEmployees: "/department/api/v1/department_employee/list/",
  createDepartmentEmployee: "/department/api/v1/department_employee/create/",
  updateDepartmentEmployee: (id: number) =>
    `/department/api/v1/department_employee/${id}/update/`,
  deleteDepartmentEmployee: (id: number) =>
    `/department/api/v1/department_employee/${id}/delete/`,

  departmentSteps: "/department/api/v1/department_step/",
  departmentStep: (id: number) => `/department/api/v1/department_step/${id}/`,
  createDepartmentStep: "/department/api/v1/department_step/create/",
  updateDepartmentStep: (id: number) =>
    `/department/api/v1/department_step/${id}/update/`,
  deleteDepartmentStep: (id: number) =>
    `/department/api/v1/department_step/${id}/delete/`,

  employees: "/accounts/api/v1/employee/list/",
  users: "/accounts/api/v1/user/list/",

  cases: "/tasks/api/v1/cases/",
  case: (id: number) => `/tasks/api/v1/cases/${id}/`,
  createCase: "/tasks/api/v1/cases/create/",
  updateCase: (id: number) => `/tasks/api/v1/cases/${id}/update/`,
  deleteCase: (id: number) => `/tasks/api/v1/cases/${id}/delete/`,

  tasks: "/tasks/api/v1/tasks/",
  task: (id: number) => `/tasks/api/v1/tasks/${id}/`,
  createTask: "/tasks/api/v1/tasks/create/",
  updateTask: (id: number) => `/tasks/api/v1/tasks/${id}/update/`,
  deleteTask: (id: number) => `/tasks/api/v1/tasks/${id}/delete/`,
  advanceTask: (id: number) => `/tasks/api/v1/tasks/${id}/advance/`,
  revertTask: (id: number) => `/tasks/api/v1/tasks/${id}/revert/`,
  taskAttachments: (id: number) => `/tasks/api/v1/tasks/${id}/attachments/`,
  taskLogs: (id: number) => `/tasks/api/v1/tasks/${id}/logs/`,
};
