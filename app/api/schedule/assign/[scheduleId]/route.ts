import connectMongoDB from "@/libs/mongodb";
import Schedule from "@/models/schedule";
import Volunteer from "@/models/volunteer";
import { category } from '@/utils/constants';
import { recordVolunteerToSheet, recordVolunteerToSheetSNS } from '@/utils/gsheet';
import { NextResponse } from "next/server";

export async function PUT(request: any, { params }: any) {
  const { scheduleId } = params;
  await connectMongoDB();
  try {
    const schedule = await Schedule.findByIdAndUpdate(scheduleId, { $unset: { volunteer: "" }});
    await Volunteer.findByIdAndUpdate(schedule.volunteer, { $pullAll: { "schedules": [scheduleId] }});

    if (schedule?.date && category.SUNDAY_SERVICES.includes(schedule.service)) {
      // Record to Sunday services Google Sheet schedule
      recordVolunteerToSheet(schedule.date, schedule.service, schedule.role, '');
    } else if (schedule?.date && category.SATURDAY_SERVICES.includes(schedule.service)) {
      // Record to SNS Google Sheet schedule
      recordVolunteerToSheetSNS(schedule.date, schedule.service, schedule.role, '');
    }

    return NextResponse.json({message: "Assignee removed from schedule succesfully!"}, {status: 200});
  } catch (error: any) {
    return NextResponse.json({message: error.message}, {status: 500});
  }
}
