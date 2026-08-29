import Admin from "@/models/admin";
import {
  AssignmentAuthenticationError,
  AssignmentSession,
  getSessionAdminId
} from "@/utils/assignmentActor";

export { AssignmentAuthenticationError } from "@/utils/assignmentActor";

export async function requireAssignmentAdmin(session: AssignmentSession | null | undefined): Promise<string> {
  const adminId = getSessionAdminId(session);
  if (!await Admin.exists({ _id: adminId })) {
    throw new AssignmentAuthenticationError("Authenticated admin no longer exists", 403);
  }
  return adminId;
}
