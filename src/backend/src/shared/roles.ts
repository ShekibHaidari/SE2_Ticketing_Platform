export type UiRole = "CUSTOMER" | "CINEMA_MANAGER" | "STAFF" | "ADMIN";

const roleMap: Record<string, { key: UiRole; label: string }> = {
  customer: { key: "CUSTOMER", label: "خریدار" },
  CUSTOMER: { key: "CUSTOMER", label: "خریدار" },
  manager: { key: "CINEMA_MANAGER", label: "مدیر سینما" },
  CINEMA_MANAGER: { key: "CINEMA_MANAGER", label: "مدیر سینما" },
  staff: { key: "STAFF", label: "کارمند گیشه / کنترل بلیت" },
  STAFF: { key: "STAFF", label: "کارمند گیشه / کنترل بلیت" },
  admin: { key: "ADMIN", label: "مدیر سیستم" },
  ADMIN: { key: "ADMIN", label: "مدیر سیستم" },
};

export function normalizeRole(role: string): UiRole {
  return roleMap[role]?.key ?? "CUSTOMER";
}

export function roleLabel(role: string) {
  return roleMap[role]?.label ?? "خریدار";
}

export function toAuthUser(user: {
  id: number;
  full_name: string;
  email: string;
  phone_number?: string | null;
  role: string;
  account_status?: string;
}) {
  const normalizedRole = normalizeRole(user.role);

  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phoneNumber: user.phone_number ?? null,
    role: normalizedRole,
    roleLabel: roleLabel(user.role),
    rawRole: user.role,
    accountStatus: user.account_status,
  };
}
