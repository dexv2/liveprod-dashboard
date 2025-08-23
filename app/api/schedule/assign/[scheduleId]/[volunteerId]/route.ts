import connectMongoDB from "@/libs/mongodb";
import Schedule from "@/models/schedule";
import Volunteer from "@/models/volunteer";
import { NextResponse } from "next/server";

export async function PUT(request: any, { params }: any) {
  const { scheduleId, volunteerId } = params;
  await connectMongoDB();
  try {
    const schedule = await Schedule.findByIdAndUpdate(scheduleId, { volunteer: volunteerId });
    await Volunteer.findByIdAndUpdate(volunteerId, { $push: { "schedules": scheduleId }});
    // remove the schedule from previous volunteer if it exists
    await Volunteer.findByIdAndUpdate(schedule.volunteer, { $pullAll: { "schedules": [scheduleId] }});
    return NextResponse.json({message: "Schedule assigned to volunteer successfully!"}, {status: 200});
  } catch (error: any) {
    return NextResponse.json({message: error.message}, {status: 500});
  }
}
