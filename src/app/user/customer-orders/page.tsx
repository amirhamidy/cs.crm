"use client";
import CustomerOrdersPage from "@/components/customer-orders/CustomerOrdersPage";
import useWarehouseAccess from "@/hooks/useWarehouseAccess";
export default function UserCustomerOrdersRoute(){
 const access=useWarehouseAccess();
 if(!access.ready)return <div className="p-8 text-center text-sm text-gray-500">در حال بررسی دسترسی...</div>;
 if(!access.hasFullAccess)return <div dir="rtl" className="rounded-2xl bg-rose-50 p-8 text-center text-sm font-bold text-rose-600 dark:bg-rose-500/10">دسترسی ندارید</div>;
 return <CustomerOrdersPage/>;
}
