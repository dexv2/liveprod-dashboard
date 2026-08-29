import connectMongoDB from "@/libs/mongodb";
import { auth } from "@/auth";
import { AssignmentInputError, deassignScheduleVolunteer } from "@/services/assignments/assignmentService";
import { AssignmentAuthenticationError, requireAssignmentAdmin } from "@/utils/assignmentAuth";
import { NextResponse } from "next/server";

interface RequestData {
  scheduleId: string
}

export async function PUT(request: any) {
  try {
    const requestData: RequestData = await request.json();
    const { scheduleId } = requestData;
    await connectMongoDB();
    const cancelledBy = await requireAssignmentAdmin(await auth());
    await deassignScheduleVolunteer({ scheduleId, cancelledBy });
    return NextResponse.json({message: "Assignee removed from schedule succesfully!"}, {status: 200});
  } catch (error: any) {
    if (error instanceof AssignmentAuthenticationError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof AssignmentInputError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({message: error.message}, {status: 500});
  }
}
