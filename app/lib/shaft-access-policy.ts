export type ShaftAccessUser = {
  userId: string;
  email: string;
};

export type ShaftAccessDecision =
  | "allowed"
  | "unauthenticated"
  | "not_configured"
  | "forbidden";

type ShaftAccessInput = {
  user: ShaftAccessUser | null;
  allowedUserIds?: string;
  allowedUserEmails?: string;
  allowLocalDevelopment?: boolean;
};

export function parseAccessList(value: string | undefined): string[] {
  return Array.from(
    new Set(
      String(value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function decideShaftAccess({
  user,
  allowedUserIds,
  allowedUserEmails,
  allowLocalDevelopment = false,
}: ShaftAccessInput): ShaftAccessDecision {
  if (allowLocalDevelopment) return "allowed";
  if (!user) return "unauthenticated";

  const userIds = new Set(parseAccessList(allowedUserIds));
  const userEmails = new Set(
    parseAccessList(allowedUserEmails).map((email) => email.toLowerCase()),
  );

  if (userIds.size === 0 && userEmails.size === 0) return "not_configured";
  if (userIds.has(user.userId.trim())) return "allowed";
  if (userEmails.has(user.email.trim().toLowerCase())) return "allowed";

  return "forbidden";
}

export function isLocalDevelopmentRequest(
  requestUrl: string,
  nodeEnv: string | undefined,
): boolean {
  if (nodeEnv === "production") return false;

  try {
    const hostname = new URL(requestUrl).hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "[::1]"
    );
  } catch {
    return false;
  }
}
