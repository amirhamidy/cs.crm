"use client";

import { memo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { Sale } from "@/types/crm";
import { GRID, Stagger } from "../shared/kit";
import SaleCard from "./SaleCard";

interface Props {
    sales: Sale[];
    showCustomer?: boolean;
    canModify: (sale: Sale) => boolean;
    onEdit: (sale: Sale) => void;
    onDelete: (sale: Sale) => void;
    onDetails?: (sale: Sale) => void;
    onReturn?: (sale: Sale) => void;
    onUndoReturn?: (sale: Sale) => void;
    compact?: boolean;
}

function SalesTable({ sales, canModify, onEdit, onDelete, onDetails, onReturn, onUndoReturn, compact = false }: Props) {
    const { can } = usePermissions();
    const allowEdit = can("sales", "edit");
    const allowDelete = can("sales", "delete");

    return (
        <div className={compact ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : GRID}>
            {sales.map((sale, i) => {
                const mine = canModify(sale);
                return (
                    <Stagger key={sale.id} index={i}>
                        <SaleCard
                            sale={sale}
                            canEdit={mine && allowEdit}
                            canDelete={mine && allowDelete}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onDetails={onDetails}
                            onReturn={onReturn}
                            onUndoReturn={onUndoReturn}
                        />
                    </Stagger>
                );
            })}
        </div>
    );
}

export default memo(SalesTable);
