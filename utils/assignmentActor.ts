import mongoose from "mongoose";

export interface AssignmentSession {
  user?: {
    id?: unknown;
    isAdmin?: boolean;
  };
}

export class AssignmentAuthenticationError extends Error {
  status: 401 | 403;

  constructor(message: string, status: 401 | 403) {
    super(message);
    this.status = status;
  }
}

export function getSessionAdminId(session: AssignmentSession | null | undefined): string {
  if (!session?.user) {
    throw new AssignmentAuthenticationError("Authentication required", 401);
  }
  if (!session.user.isAdmin || typeof session.user.id !== "string" || !mongoose.isValidObjectId(session.user.id)) {
    throw new AssignmentAuthenticationError("Authenticated admin required", 403);
  }
  return session.user.id;
}
