import connectMongoDB from "@/libs/mongodb";
import Schedule from "@/models/schedule";
import Volunteer from "@/models/volunteer";
import { NextResponse } from "next/server";

export async function PUT(request: any, { params }: any) {
  const { scheduleId } = params;
  await connectMongoDB();
  try {
    const schedule = await Schedule.findByIdAndUpdate(scheduleId, { $unset: { volunteer: "" }});
    await Volunteer.findByIdAndUpdate(schedule.volunteer, { $pullAll: { "schedules": [scheduleId] }});
    return NextResponse.json({message: "Assignee removed from schedule succesfully!"}, {status: 200});
  } catch (error: any) {
    return NextResponse.json({message: error.message}, {status: 500});
  }
}
