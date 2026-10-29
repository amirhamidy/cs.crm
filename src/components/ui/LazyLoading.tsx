"use client";

import { Loader2 } from "lucide-react";


export default function LazyLoading() {
    return (
        <div className="flex items-center justify-center p-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
    );
}
