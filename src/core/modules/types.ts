export type ModuleManifest = {
    id: string;
    name: string;
    requires: string[];
    menu?: MenuEntry[];
};
export type MenuEntry = {
    role: "admin" | "user";
    label: string;
    href: string;
    icon: string;
};
