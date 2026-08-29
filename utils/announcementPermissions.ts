export type AnnouncementPermission = "VIEW_ANNOUNCEMENTS" | "UPDATE_ANNOUNCEMENTS";

interface AnnouncementSession {
  user?: {
    isAdmin?: boolean;
    permissions?: string[];
  };
}

export type AnnouncementAuthorization =
  | { allowed: true }
  | { allowed: false; status: 401 | 403 };

export function authorizeAnnouncement(
  session: AnnouncementSession | null | undefined,
  permission: AnnouncementPermission
): AnnouncementAuthorization {
  if (!session?.user) return { allowed: false, status: 401 };
  if (!session.user.isAdmin || !session.user.permissions?.includes(permission)) {
    return { allowed: false, status: 403 };
  }
  return { allowed: true };
}
