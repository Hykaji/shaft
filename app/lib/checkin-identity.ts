import { isLocalDevelopmentRequest } from "./shaft-access-policy";

export const LOCAL_CHECKIN_OWNER = "local:shaft-owner";

export function isD1CheckinStore() {
  return process.env.SHAFT_CHECKIN_STORE?.trim().toLowerCase() === "d1";
}

export function resolveAuthorizedCheckinOwner(request: Request) {
  if (isLocalDevelopmentRequest(request.url, process.env.NODE_ENV)) {
    return LOCAL_CHECKIN_OWNER;
  }

  const userId = request.headers.get("oai-authenticated-user-id")?.trim();
  if (!userId) {
    throw new Error("Authorized Shaft owner identity is unavailable.");
  }
  return `chatgpt:${userId}`;
}
