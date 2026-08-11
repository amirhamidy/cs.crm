export const apiRoutes = {
  // لیست‌ها (GET)
  tasks: "/tasks/api/v1/tasks/",
  cases: "/tasks/api/v1/cases/",
  customers: "/customers/api/v1/customers/",
  departments: "/department/api/v1/department/list/",
  employees: "/accounts/api/v1/employee/list/",

  // ساخت (POST)
  createTask: "/tasks/api/v1/tasks/create/",
  createCase: "/tasks/api/v1/cases/create/",

  // ویرایش (PATCH/PUT)
  updateTask: (id: number | string) => `/tasks/api/v1/tasks/${id}/update/`,
  updateCase: (id: number | string) => `/tasks/api/v1/cases/${id}/update/`,

  // حذف (DELETE)
  deleteTask: (id: number | string) => `/tasks/api/v1/tasks/${id}/delete/`,
  deleteCase: (id: number | string) => `/tasks/api/v1/cases/${id}/delete/`,
};
