export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string | number;
  badgeColor?: "red" | "green" | "blue" | "yellow";
  children?: NavItem[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}
