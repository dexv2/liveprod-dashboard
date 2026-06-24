import connectMongoDB from "@/libs/mongodb";
import Schedule from "@/models/schedule";
import Volunteer from "@/models/volunteer";
import { category } from '@/utils/constants';
import { recordVolunteerToSheet, recordVolunteerToSheetSNS } from '@/utils/gsheet';
import { NextResponse } from "next/server";

interface RequestData {
  scheduleId: string
  volunteerId: string
}

export async function PUT(request: any) {
  const requestData: RequestData = await request.json();
  const { scheduleId, volunteerId } = requestData;
  await connectMongoDB();
  try {
    const schedule = await Schedule.findByIdAndUpdate(scheduleId, { volunteer: volunteerId });

    // Update the volunteer's schedules array
    const volunteer = await Volunteer.findByIdAndUpdate(volunteerId, { $push: { "schedules": scheduleId }});
    if (schedule?.date && volunteer?.name && category.SUNDAY_SERVICES.includes(schedule.service)) {
      // Record to Sunday services Google Sheet schedule
      recordVolunteerToSheet(schedule.date, schedule.service, schedule.role, volunteer.name);
    } else if (schedule?.date && volunteer?.name && category.SATURDAY_SERVICES.includes(schedule.service)) {
      // Record to SNS Google Sheet schedule
      recordVolunteerToSheetSNS(schedule.date, schedule.service, schedule.role, volunteer.name);
    }

    // remove the schedule from previous volunteer if it exists
    await Volunteer.findByIdAndUpdate(schedule.volunteer, { $pullAll: { "schedules": [scheduleId] }});
    return NextResponse.json({message: "Schedule assigned to volunteer successfully!"}, {status: 200});
  } catch (error: any) {
    console.error(`Failed to assign schedule to volunteer: ${error}`);
    return NextResponse.json({message: error.message}, {status: 500});
  }
}
