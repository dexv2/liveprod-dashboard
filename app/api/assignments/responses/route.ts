import { auth } from "@/auth";
import connectMongoDB from "@/libs/mongodb";
import {
  getAssignmentResponseQueue,
  parseAssignmentResponseQueueFilters
} from "@/services/assignments/assignmentResponseQueueService";
import { AssignmentAuthenticationError, requireAssignmentAdmin } from "@/utils/assignmentAuth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await connectMongoDB();
    const adminId = await requireAssignmentAdmin(await auth());
    const filters = parseAssignmentResponseQueueFilters(new URL(request.url).searchParams);
    const queue = await getAssignmentResponseQueue(adminId, filters);
    return NextResponse.json(queue);
  } catch (error) {
    if (error instanceof AssignmentAuthenticationError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message.startsWith("INVALID_")) {
      return NextResponse.json({ message: "Invalid response queue filter" }, { status: 400 });
    }
    console.error("Assignment response queue failed");
    return NextResponse.json({ message: "Unable to load assignment responses" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
