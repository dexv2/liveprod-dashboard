import { auth } from "@/auth";
import connectMongoDB from "@/libs/mongodb";
import Assignment from "@/models/assignment";
import {
  AssignmentNotificationError,
  notifyAssignment
} from "@/services/notifications/notificationService";
import { AssignmentAuthenticationError, requireAssignmentAdmin } from "@/utils/assignmentAuth";
import { ASSIGN_VOLUNTEER_SCHEDULE, UPDATE_EVENT } from "@/utils/constants";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    await connectMongoDB();
    const session = await auth();
    await requireAssignmentAdmin(session);
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ message: "Invalid assignment ID" }, { status: 400 });
    }
    const assignment = await Assignment.findById(params.id).select("sourceType");
    if (!assignment) return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
    const permission = assignment.sourceType === "SCHEDULE" ? ASSIGN_VOLUNTEER_SCHEDULE : UPDATE_EVENT;
    const user = session?.user as any;
    if (!user?.superAdmin && !user?.permissions?.includes(permission)) {
      return NextResponse.json({ message: "Assignment notification permission required" }, { status: 403 });
    }
    const notification = await notifyAssignment(params.id, { manual: true });
    return NextResponse.json({ notification });
  } catch (error) {
    if (error instanceof AssignmentAuthenticationError || error instanceof AssignmentNotificationError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("Manual assignment notification failed");
    return NextResponse.json({ message: "Manual assignment notification failed" }, { status: 500 });
  }
}
