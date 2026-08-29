import connectMongoDB from "@/libs/mongodb";
import { auth } from "@/auth";
import { AssignmentInputError, deleteSchedules } from "@/services/assignments/assignmentService";
import { AssignmentAuthenticationError, requireAssignmentAdmin } from "@/utils/assignmentAuth";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    await connectMongoDB();
    const actorId = await requireAssignmentAdmin(await auth());
    const result = await deleteSchedules({ service: "sns2" }, actorId);
    return NextResponse.json({
      message: `Successfully deleted ${result.deletedCount} schedule(s) with service "sns2"`,
      deletedCount: result.deletedCount
    }, { status: 200 });
  } catch (error: any) {
    if (error instanceof AssignmentAuthenticationError || error instanceof AssignmentInputError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({
      message: "Failed to delete schedules",
      error: error.message
    }, { status: 500 });
  }
}
