"use client";

import { memo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { Sale } from "@/types/crm";

import SaleCard from "./SaleCard";

interface Props {
    sales: Sale[];
    showCustomer?: boolean;
    canModify: (sale: Sale) => boolean;
    onEdit: (sale: Sale) => void;
    onDelete: (sale: Sale) => void;
    onDetails?: (sale: Sale) => void;
}

function SalesTable({ sales, canModify, onEdit, onDelete, onDetails }: Props) {
    const { can } = usePermissions();
    const allowEdit = can("sales", "edit");
    const allowDelete = can("sales", "delete");
    return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {sales.map((sale) => {
                const mine = canModify(sale);
                return (
                    <SaleCard
                        key={sale.id}
                        sale={sale}
                        canEdit={mine && allowEdit}
                        canDelete={mine && allowDelete}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onDetails={onDetails}
                    />
                );
            })}
        </div>
    );
}

export default memo(SalesTable);
