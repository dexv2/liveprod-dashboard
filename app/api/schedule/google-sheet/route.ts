import connectMongoDB from '@/libs/mongodb';
import Schedule from '@/models/schedule';
import { category } from '@/utils/constants';
import { bulkRecordVolunteerToSheet, bulkRecordVolunteerToSheetSNS } from '@/utils/gsheet';
import { NextResponse } from "next/server";

interface RequestData {
  saturday: string
  sunday: string
}

export async function POST(request: any) {
  const requestData: RequestData = await request.json();
  const { saturday, sunday } = requestData;
  console.log(saturday, sunday);
  try {
    await connectMongoDB();
    const schedules = await Schedule.aggregate([
      {
        $match: {
          service: {
            $in: category.REGULAR_SERVICES
          },
          date: {
            $gte: new Date(`${saturday}T00:00:00.000+08:00`),
            $lte: new Date(`${sunday}T23:59:00.000+08:00`)
          }
        }
      },
      {
        $lookup: {
          from: "volunteers",
          let: { volunteerId: "$volunteer" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$volunteerId"] } } },
            { $project: { firstName: 1, name: 1, _id: 0 } }
          ],
          as: "volunteer"
        }
      },
      {
        $addFields: {
          volunteer: { $arrayElemAt: ["$volunteer", 0] }
        }
      },
      {
        $group: {
          _id: "$service",
          service: {
            $push: {
              role: "$role",
              date: "$date", 
              volunteer: "$volunteer",
              id: "$_id"
            }
          }
        }
      }
    ]);

    const sundayVolunteers: string[][] = Array.from({ length: category.ROLES.length }, () => []);
    const saturdayVolunteers: string[][] = Array.from({ length: category.SNS_GSHEET_ROLES.length }, () => []);
    for (const sched of schedules || []) {
      if (category.SUNDAY_SERVICES.includes(sched?._id)) {
        const schedIndex = category.SUNDAY_SERVICES.findIndex(s => s === sched?._id);
        for (const svc of sched?.service) {
          const roleIndex = category.ROLES.findIndex(role => role === svc?.role);
          sundayVolunteers[roleIndex][schedIndex] = svc?.volunteer?.name || '';
        }
      } else if (category.SATURDAY_SERVICES.includes(sched?._id)) {
        const schedIndex = category.SATURDAY_SERVICES.findIndex(s => s === sched?._id);
        for (const svc of sched?.service) {
          const roleIndex = category.SNS_GSHEET_ROLES.findIndex(role => role === svc?.role);
          saturdayVolunteers[roleIndex][schedIndex] = svc?.volunteer?.name || '';
        }
      }
    }
    bulkRecordVolunteerToSheet(sunday, sundayVolunteers);
    bulkRecordVolunteerToSheetSNS(saturday, saturdayVolunteers);

    return NextResponse.json({message: `Google sheet schedule updated`}, {status: 201});
  } catch (error: any) {
    return NextResponse.json({message: error.message}, {status: 500});
  }
}
