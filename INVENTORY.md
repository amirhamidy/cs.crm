# INVENTORY — Batch 1 (infrastructure + accounts + department)

## Counts (before -> after)
- A1 files (axiosInstance/axios/apiRoutes/fetch in app+components+hooks): 116 -> 109
- A2 files (raw backend URL strings in app+components+hooks): 105 -> 99
- tsc --noEmit: 1 error -> 0 errors
- eslint --quiet: 2 errors (pre-existing, SoldOrderTaskModal.tsx rules-of-hooks), 0 introduced

## Done in this batch
| file | change | R3 decision |
|---|---|---|
| types/pagination.ts | single Paginated + PageParams + SearchParams | - |
| lib/api/_core.ts | Paginated re-exported from types; added cleanParams, fetchPage; listAll uses fetchPage | - |
| lib/api/accounts.ts | NEW: me, employees(list/all/get/getMany/search/byUsername/peek/create/update/remove), users(list/all/search/create/update/remove) | list: a; search: b; all: c |
| lib/api/departments.ts | extended: listPage/stepsPage/employeesPage, create/update/remove, step CRUD, assign/updateAssignment/unassign | list/steps: c (bounded); employees: c |
| lib/api/meta.ts | delegates to accountsApi/departmentsApi | c |
| lib/api/index.ts | exports accountsApi + types | - |
| hooks/usePaginatedList.ts | NEW | - |
| hooks/useEmployeeDirectory.tsx | -> accountsApi.employees.all | c (needs username map) |
| hooks/useUserOptions.ts | -> accountsApi.users.all + employees.all | c |
| hooks/usecurrentemployee.ts | employee by server search (byUsername) + departmentsApi.employees | b + c |
| hooks/useEmployeeInfo.ts | -> accountsApi.employees.get/peek | b |
| hooks/useEmployeeDepartments.ts | -> departmentsApi.employees | c |
| hooks/useEmployeesStats.ts | -> accountsApi.employees.all | c (see backend list) |
| hooks/usePurchasingAccess.ts | accounts parts migrated; purchasing call pending | b |
| components/admin/departments/departmentApi.ts | adapter over departmentsApi/accountsApi, same public shape | c |
| components/admin/human_resources/humanResourceApi.ts | dept/employee/me migrated; document calls pending | c |
| app/user/cases/page.tsx | removed stale `customers` prop (type error) | - |
| eslint.config.mjs | no-restricted-imports + no-restricted-syntax (warn) | - |

## Pending in accounts/department domain (next batches)
app/admin/users/page.tsx, components/admin/users/{UserCard,AddUserPage,EditUserModal}.tsx,
components/admin/{warehouse/AddWarehouseStaffModal,quality_control/QualityControlPage,quality_control/QCEmployeeModal,performance/MyTaskDeadlines,purchasing/PurchasingEmployeeModal}.tsx,
components/user/{customer/CustomerScoresModal,tasks/*,dashboard/DepartmentScoreManager,Internaltasks/*,TaskRoutine/Api.ts}, components/InternalTaskRoutine/Api.ts,
components/customcomponents/tasks/*, components/notifications/sync/Fetchers.ts,
hooks/{usePhoneNumberAvailability,useAnalytics,useTopStagesRanking}.ts, lib/dashboard.ts, app/user/{customer,cases,tasks}/page.tsx, app/admin/production/machines/page.tsx

## Needs backend / confirmation
1. Employee growth stat (useEmployeesStats): needs created_at__gte/lte filter or a stats endpoint; currently cached full list.
2. department_employee filter by employee/department id: needs `employee` and `department` query params; currently filtered client-side from cached full list.
3. byUsername relies on `search` matching username (search_fields: user__username); confirm exact-match behaviour.
4. department_employee/{id}/update/ uses PATCH (from UserCard); confirm.
5. Departments admin store lists are now fully loaded (previously truncated at page size 20 if backend paginates).
