import type { ModuleManifest } from "@/core/modules/types";

const manifest: ModuleManifest = {
    id: "calendar",
    name: "تقویم",
    requires: [],
    menu: [
        { role: "admin", label: "تقویم", href: "/admin/calendar", icon: "CalendarCheck2" },
        { role: "user", label: "تقویم", href: "/user/calendar", icon: "CalendarCheck2" },
    ],
};

export default manifest;
