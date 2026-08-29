import { UPDATE_VOLUNTEER_PROFILE } from "@/utils/constants";
import { AssignmentAuthenticationError, requireAssignmentAdmin } from "@/utils/assignmentAuth";

interface TelegramLinkSession {
  user?: {
    id?: unknown;
    isAdmin?: boolean;
    superAdmin?: boolean;
    permissions?: string[];
  };
}

export async function requireTelegramLinkAdmin(session: TelegramLinkSession | null | undefined) {
  const adminId = await requireAssignmentAdmin(session);
  if (!session?.user?.superAdmin && !session?.user?.permissions?.includes(UPDATE_VOLUNTEER_PROFILE)) {
    throw new AssignmentAuthenticationError("Volunteer profile permission required", 403);
  }
  return adminId;
}
