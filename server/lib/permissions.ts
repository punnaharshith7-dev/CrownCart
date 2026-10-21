/**
 * The single source of truth for who may do what. Platform roles live in
 * user_roles; store-level access comes from store_members.member_role.
 */

export const ROLES = {
  customer: { name: "Customer", description: "Shops on CrownCart." },
  store_owner: { name: "Store Owner", description: "Operates one or more assigned stores." },
  platform_admin: { name: "Platform Admin", description: "Administers the whole platform." },
  delivery_partner: { name: "Delivery Partner", description: "Delivers assigned shipments." },
} as const;
export type RoleKey = keyof typeof ROLES;

export const ADMIN_PERMISSIONS = {
  "admin.users": "View and manage user accounts",
  "admin.roles": "Grant and revoke roles",
  "admin.stores": "Create, approve and suspend stores",
  "admin.catalog": "Moderate products, categories and brands",
  "admin.orders": "Inspect and intervene in any order",
  "admin.finance": "Process refunds and view platform financials",
  "admin.delivery": "Approve delivery partners and assign shipments",
  "admin.settings": "Change platform configuration",
  "admin.audit": "Read the audit log",
  "admin.support": "Handle support tickets and review moderation",
} as const;
export type AdminPermission = keyof typeof ADMIN_PERMISSIONS;

export const ROLE_PERMISSIONS: Record<RoleKey, AdminPermission[]> = {
  customer: [],
  store_owner: [],
  delivery_partner: [],
  platform_admin: Object.keys(ADMIN_PERMISSIONS) as AdminPermission[],
};

export const MEMBER_ROLES = ["owner", "product_editor", "inventory_operator", "order_manager", "analyst"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export type StorePermission =
  | "store.products"
  | "store.inventory"
  | "store.orders"
  | "store.promotions"
  | "store.analytics"
  | "store.finance"
  | "store.team"
  | "store.settings";

export const MEMBER_ROLE_PERMISSIONS: Record<MemberRole, StorePermission[]> = {
  owner: [
    "store.products",
    "store.inventory",
    "store.orders",
    "store.promotions",
    "store.analytics",
    "store.finance",
    "store.team",
    "store.settings",
  ],
  product_editor: ["store.products"],
  inventory_operator: ["store.inventory"],
  order_manager: ["store.orders"],
  analyst: ["store.analytics"],
};
