import connectMongoDB from "@/libs/mongodb";
import { auth } from "@/auth";
import { AssignmentInputError, assignScheduleVolunteer } from "@/services/assignments/assignmentService";
import { AssignmentAuthenticationError, requireAssignmentAdmin } from "@/utils/assignmentAuth";
import { NextResponse } from "next/server";

interface RequestData {
  scheduleId: string
  volunteerId: string
}

export async function PUT(request: any) {
  try {
    const requestData: RequestData = await request.json();
    const { scheduleId, volunteerId } = requestData;
    await connectMongoDB();
    const scheduledBy = await requireAssignmentAdmin(await auth());
    await assignScheduleVolunteer({ scheduleId, volunteerId, scheduledBy });
    return NextResponse.json({message: "Schedule assigned to volunteer successfully!"}, {status: 200});
  } catch (error: any) {
    if (error instanceof AssignmentAuthenticationError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof AssignmentInputError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error(`Failed to assign schedule to volunteer: ${error}`);
    return NextResponse.json({message: error.message}, {status: 500});
  }
}
