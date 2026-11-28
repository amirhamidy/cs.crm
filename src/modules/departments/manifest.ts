import type { ModuleManifest } from "@/core/types";

const manifest: ModuleManifest = {
    id: "departments",
    name: "دپارتمان‌ها",
    requires: [],
    menu: [{ role: "admin", label: "دپارتمان‌ها", href: "/admin/departments", icon: "Building2" }],
};

export default manifest;
