# INVENTORY — Batch 1 + 2 (infrastructure, accounts, department, users page)

## Counts (before -> after)
- A1 files (axiosInstance/axios/apiRoutes/fetch in app+components+hooks): 116 -> 103 (after batch 2)
- A2 files (raw backend URL strings in app+components+hooks): 105 -> 93 (after batch 2)
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

## Batch 2 (users page)
| file | change | R3 decision |
|---|---|---|
| lib/api/score.ts | NEW: employee(id) cached 30s, adjust() | b (lazy per visible page) |
| lib/api/internalTasks.ts | NEW minimal: list, all (endpoint /tasks/api/v1/internal_task/ from JSON) | c (see backend list) |
| lib/api/accounts.ts | added users.lookup(term): server search, page_size=100, TTL 10s | b |
| app/admin/users/page.tsx | employees paginated (usePaginatedList, page_size=20, server search, Pagination UI); scores lazy for page items; admins shown on last page | a |
| components/admin/users/EditUserModal.tsx | user fetched via users.lookup(username) instead of full list; update via accountsApi | b |
| components/admin/users/AddUserPage.tsx | availability + rollback lookups via users.lookup; create/remove via accountsApi | b |
| components/admin/users/UserCard.tsx | department managers via departmentsApi.employees/updateAssignment; toggle active, delete via accountsApi | c |
| components/admin/users/AdjustScoreModal.tsx | scoreApi.adjust | mutation |
| hooks/usePhoneNumberAvailability.ts | server lookup by username and phone instead of full user list | b |

## Backend / confirmation (batch 2)
6. Users page joins page employees with phone/is_active/active-tasks: needs EmployeeListApi to include phone_number, is_active, user id, department_name, has_active_tasks (or `?user__type=2` to exclude admins). Currently: users.all + tasks.listAll + internalTasks.all + departmentsApi.employees (all cached).
7. Admin employees are filtered client-side per page, so a page can hold fewer than 20 cards and total = count + admins may over-count; needs `?exclude_admin=true` or `user__type`.
8. Internal tasks endpoint changed from `/tasks/api/v1/internal-tasks/` (which was swallowed by `.catch(() => [])`) to `/tasks/api/v1/internal_task/` (JSON). Effect: users with internal tasks now correctly block deletion. Confirm this is intended.
9. users.lookup relies on `search` matching username/phone_number; stored phone in non-normalized formats may not match a normalized search term.
10. Task aggregation (assignees, in_progress titles) needs `?assigned_employee=<id>&status=in_progress` or a summary endpoint.

## Still pending in accounts/department domain
components/admin/{warehouse/AddWarehouseStaffModal, quality_control/{QCEmployeeModal,QualityControlPage}, purchasing/PurchasingEmployeeModal, performance/MyTaskDeadlines}.tsx (migrate together with warehouse / qc / purchasing modules),
components/user/{customer/CustomerScoresModal, tasks/*, dashboard/DepartmentScoreManager, Internaltasks/*, TaskRoutine/Api.ts}, components/InternalTaskRoutine/Api.ts, components/customcomponents/tasks/*, components/notifications/sync/Fetchers.ts, hooks/{useAnalytics,useTopStagesRanking}.ts, lib/dashboard.ts, app/user/{customer,cases,tasks}/page.tsx, app/admin/production/machines/page.tsx
