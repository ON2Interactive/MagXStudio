const USER_NAME_KEY = "magx_user_name";
const USER_PROFILE_KEY = "magx_user_profile";

type UserLike = {
  name?: string;
};

declare global {
  interface Window {
    __MAGX_USER__?: UserLike;
  }
}

function cleanName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getClientUserName(): string | null {
  if (typeof window === "undefined") return null;

  const fromWindow = cleanName(window.__MAGX_USER__?.name);
  if (fromWindow) return fromWindow;

  const fromNameKey = cleanName(window.localStorage.getItem(USER_NAME_KEY));
  if (fromNameKey) return fromNameKey;

  try {
    const rawProfile = window.localStorage.getItem(USER_PROFILE_KEY);
    if (!rawProfile) return null;
    const parsed = JSON.parse(rawProfile) as { name?: unknown };
    return cleanName(parsed.name);
  } catch {
    return null;
  }
}

export function setClientUserName(name: string): void {
  if (typeof window === "undefined") return;
  const cleaned = cleanName(name);
  if (!cleaned) return;
  window.localStorage.setItem(USER_NAME_KEY, cleaned);
}
