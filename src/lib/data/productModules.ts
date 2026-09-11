export interface ProductModule {
  code: string;
  name: string;
  fullName: string;
  description: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export const PRODUCT_MODULES: ProductModule[] = [
  {
    code: "azapal-tms-fms",
    name: "Azapal TMS/FMS",
    fullName: "Transport/Fleet Management System",
    description: "Plan routes, dispatch fleets, and track deliveries in real time.",
    icon: "ri-truck-line",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    code: "azapal-ims",
    name: "Azapal IMS",
    fullName: "Inventory Management System",
    description: "Track stock levels, warehouse movement, and reorder points.",
    icon: "ri-archive-2-line",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
  },
  {
    code: "azapal-noc",
    name: "Azapal NOC",
    fullName: "Network Operations Center",
    description: "Monitor live deliveries, driver activity, and network health across all branches in real time.",
    icon: "ri-radar-line",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
  },
];
