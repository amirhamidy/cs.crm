# Overlays audit (`fixed inset-0`)

heuristic (اسکریپت)، فقط گزارش. «مشترک» = import از ui/Modal|ModalShell|ConfirmDialog|ActionSheet یا ConfirmModal. هیچ فایلی خارج از ui/ از Modal مشترک استفاده نمی‌کند، مگر مواردی که ستون آن را نشان می‌دهد.


## A) بک‌دراپ جدا + AnimatePresence/fade — 11 مورد

| فایل:خط | مشترک؟ | نشانه‌ها |
|---|---|---|
| `src/components/tasks/AdminTaskNotesModal.tsx:260` | خیر | fade child AP |
| `src/components/tasks/TimeRangeModal.tsx:267` | خیر | fade child AP |
| `src/components/ui/ActionSheet.tsx:36` | (خودِ | کامپوننت مشترک) child AP |
| `src/components/ui/ConfirmDialog.tsx:45` | (خودِ | کامپوننت مشترک) child AP |
| `src/components/ui/Modal.tsx:48` | (خودِ | کامپوننت مشترک) child AP |
| `src/components/ui/Select.tsx:168` | (خودِ | کامپوننت مشترک) child AP |
| `src/components/user/cases/CaseCard.tsx:598` | خیر | child AP |
| `src/components/user/cases/CaseCard.tsx:710` | خیر | child AP |
| `src/components/user/customer/CustomerCard.tsx:804` | خیر | child AP |
| `src/components/user/customer/DeleteModal.tsx:29` | خیر | fade child AP |
| `src/components/user/customer/ImportExcelModal.tsx:133` | خیر | child AP |

## B) بک‌دراپ و wrapper یک المان — 74 مورد

| فایل:خط | مشترک؟ | نشانه‌ها |
|---|---|---|
| `src/app/admin/departments/page.tsx:299` | خیر | bg fade AP |
| `src/app/user/production/logs/page.tsx:266` | خیر | bg AP |
| `src/components/InternalTaskRoutine/Createtaskroutinemodal.tsx:452` | خیر | bg fade AP |
| `src/components/InternalTaskRoutine/EmployeeCreateTaskRoutineModal.tsx:468` | خیر | bg fade AP |
| `src/components/admin/departments/AddDepartmentDrawer.tsx:100` | خیر | bg fade AP |
| `src/components/admin/departments/AddEmployeeModal.tsx:138` | خیر | bg fade AP |
| `src/components/admin/departments/AddStageDrawer.tsx:71` | خیر | bg fade AP |
| `src/components/admin/departments/DeleteModal.tsx:27` | خیر | bg fade AP |
| `src/components/admin/departments/EditStageModal.tsx:76` | خیر | bg fade AP |
| `src/components/admin/departments/TaskCard.tsx:535` | خیر | bg fade AP |
| `src/components/admin/human_resources/HumanResourceForm.tsx:237` | خیر | bg fade AP |
| `src/components/admin/human_resources/HumanResourceStepsModal.tsx:193` | خیر | bg fade AP |
| `src/components/admin/human_resources/Humanresourcefilemodal.tsx:57` | خیر | bg fade AP |
| `src/components/admin/purchasing/PurchasingCreateTaskModal.tsx:580` | خیر | bg fade AP |
| `src/components/admin/purchasing/PurchasingDeleteModal.tsx:26` | خیر | bg fade AP |
| `src/components/admin/purchasing/PurchasingEmployeeModal.tsx:103` | خیر | bg fade AP |
| `src/components/admin/purchasing/StepFormModal.tsx:109` | خیر | bg fade AP |
| `src/components/admin/purchasing/TaskTransitionModal.tsx:98` | خیر | bg fade AP |
| `src/components/admin/purchasing/Taskhistorymodal.tsx:90` | خیر | bg fade AP |
| `src/components/admin/quality_control/QCActionModal.tsx:85` | خیر | bg fade AP |
| `src/components/admin/quality_control/QCDeleteModal.tsx:23` | خیر | bg fade AP |
| `src/components/admin/quality_control/QCEmployeeModal.tsx:78` | خیر | bg fade AP |
| `src/components/admin/warehouse/AddCategoryModal.tsx:61` | خیر | bg fade AP |
| `src/components/admin/warehouse/AddWarehouseStaffModal.tsx:145` | خیر | bg fade AP |
| `src/components/admin/warehouse/StockLimitsModal.tsx:82` | خیر | bg fade AP |
| `src/components/admin/warehouse/WarehouseCategoryCard.tsx:47` | ModalShell | bg fade AP |
| `src/components/admin/warehouse/WarehouseEmployeeBulkImportModal.tsx:122` | خیر | bg fade AP |
| `src/components/admin/warehouse/WarehouseFormModals.tsx:30` | خیر | bg fade AP |
| `src/components/admin/warehouse/WarehouseSelector.tsx:78` | خیر | bg fade AP |
| `src/components/admin/warehouse/WarehouseStaffCard.tsx:246` | خیر | bg fade AP |
| `src/components/calendar/admin/CalendarNoteModal.tsx:164` | خیر | bg fade AP |
| `src/components/calendar/user/CalendarNoteModal.tsx:218` | خیر | bg fade AP |
| `src/components/cases/CaseTasksModal.tsx:191` | خیر | bg fade AP |
| `src/components/tasks/CreateNoCaseTaskModal.tsx:352` | خیر | bg fade AP |
| `src/components/tasks/CreateTaskModal.tsx:313` | خیر | bg fade AP |
| `src/components/tasks/EditTaskModal.tsx:662` | خیر | bg fade AP |
| `src/components/tasks/TaskCard.tsx:373` | خیر | bg fade AP |
| `src/components/tasks/TaskDeadlineModal.tsx:158` | خیر | fade AP |
| `src/components/ui/ConfirmModal.tsx:49` | (خودِ | کامپوننت مشترک) bg fade AP |
| `src/components/ui/ModalShell.tsx:52` | (خودِ | کامپوننت مشترک) bg fade AP |
| `src/components/user/Internaltasks/AdminInternalTaskChatModal.tsx:503` | خیر | bg fade AP |
| `src/components/user/Internaltasks/AdminInternalTasksBoard.tsx:297` | خیر | bg fade AP |
| `src/components/user/Internaltasks/Createticketmodal.tsx:163` | خیر | bg fade AP |
| `src/components/user/Internaltasks/InternalTaskActionModal.tsx:97` | خیر | bg fade AP |
| `src/components/user/Internaltasks/InternalTaskChatModal.tsx:478` | خیر | bg fade AP |
| `src/components/user/Internaltasks/InternalTaskDeadlineModal.tsx:154` | خیر | fade AP |
| `src/components/user/Internaltasks/Senttaskcard.tsx:294` | خیر | bg fade AP |
| `src/components/user/cases/CaseReportModal.tsx:248` | خیر | bg fade AP |
| `src/components/user/cases/CreateCaseModal.tsx:253` | خیر | bg fade AP |
| `src/components/user/cases/EditCaseModal.tsx:167` | خیر | bg fade AP |
| `src/components/user/customer/AddCustomerModal.tsx:806` | خیر | bg fade AP |
| `src/components/user/customer/CustomerEditModal.tsx:705` | خیر | bg fade AP |
| `src/components/user/customer/CustomerScoresModal.tsx:139` | خیر | bg fade AP |
| `src/components/user/customer/ImportExcelModal.tsx:140` | خیر | bg fade AP |
| `src/components/user/tasks/CreateTaskModal.tsx:563` | خیر | bg fade AP |
| `src/components/user/tasks/EditTaskModal.tsx:650` | خیر | bg fade AP |
| `src/components/user/tasks/SoldOrderTaskModal.tsx:295` | خیر | bg fade AP |
| `src/components/user/tasks/TaskActionModal.tsx:174` | خیر | bg fade AP |
| `src/components/user/tasks/TaskCardx.tsx:553` | خیر | bg fade AP |
| `src/components/user/tasks/TaskCaseDescriptionModal.tsx:74` | خیر | bg fade AP |
| `src/components/user/tasks/TaskLogsModal.tsx:246` | خیر | bg fade AP |
| `src/components/user/tasks/TaskNotesModal.tsx:224` | خیر | bg fade AP |
| `src/components/user/tasks/TaskTransferModal.tsx:230` | خیر | bg fade AP |
| `src/components/user/warehouse/AddItemsToOrderModal.tsx:256` | خیر | bg fade AP |
| `src/components/user/warehouse/CreateOrderTaskModal.tsx:426` | خیر | bg fade AP |
| `src/components/user/warehouse/OrderInvoiceModal.tsx:248` | خیر | bg fade AP |
| `src/components/user/warehouse/OrderTaskAttachmentsModal.tsx:83` | خیر | bg fade AP |
| `src/components/user/warehouse/WarehouseEmployeeInitialStockModal.tsx:198` | خیر | bg fade AP |
| `src/components/user/warehouse/WarehouseEmployeeOrderTaskStatusModal.tsx:166` | خیر | bg fade AP |
| `src/components/user/warehouse/WarehouseEmployeeProductCard.tsx:705` | خیر | bg fade AP |
| `src/components/user/warehouse/WarehouseEmployeeProductEditModal.tsx:522` | خیر | bg fade AP |
| `src/components/user/warehouse/WarehouseEmployeeProductWizardModal.tsx:772` | خیر | bg fade AP |
| `src/components/user/warehouse/WarehouseEmployeeStockModal.tsx:464` | خیر | bg fade AP |
| `src/components/user/warehouse/WarehouseEmployeeTaskCard.tsx:599` | خیر | bg fade AP |

## C) بدون AnimatePresence/fade (یا overlay غیرمودال) — 10 مورد

| فایل:خط | مشترک؟ | نشانه‌ها |
|---|---|---|
| `src/app/admin/production/machines/_modals.tsx:66` | ModalShell | fade child noAP |
| `src/components/admin/users/ModalFrame.tsx:41` | خیر | bg fade noAP |
| `src/components/calendar/admin/PersianCalendar.tsx:797` | خیر | AP |
| `src/components/calendar/user/PersianCalendar.tsx:511` | خیر | noAP |
| `src/components/customer-orders/CustomerOrdersPage.tsx:71` | خیر | bg noAP |
| `src/components/customer-orders/CustomerOrdersPage.tsx:167` | خیر | bg noAP |
| `src/components/minutes/Modal.tsx:32` | خیر | bg fade noAP |
| `src/components/sidebar/Sidebar.tsx:31` | خیر | bg noAP |
| `src/components/topbar/ProfileMenu.tsx:45` | خیر | noAP |
| `src/components/user/tasks/ArchivedTaskCard.tsx:382` | خیر | bg noAP |

## یادداشت
- C شامل popoverهای تمام‌صفحه‌ی بی‌رنگ (کلیک بیرون)، Sidebar، ProfileMenu و PersianCalendar picker هم هست؛ مودال واقعی نیستند.
- `app/admin/production/machines/_modals.tsx` از ModalShell استفاده می‌کند ولی خودش هم overlay دارد (noAP در همان فایل).
- `admin/users/ModalFrame.tsx` دست‌نخورده است (خارج از محدوده).
- ImportExcelModal و CaseCard: دو لایه fixed (wrapper + بک‌دراپ جدا) → A.
