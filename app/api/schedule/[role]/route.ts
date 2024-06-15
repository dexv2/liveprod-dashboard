import connectMongoDB from "@/libs/mongodb";
import Schedule from "@/models/schedule";
import { category } from "@/utils/constants";
import { getNextService } from "@/utils/helpers";
import { NextResponse } from "next/server";

export async function GET(request: any, { params }: any) {
  const { role } = params;
  const nextService = getNextService();
  console.log({nextService})
  await connectMongoDB();
  const schedules = await Schedule.aggregate([
    {
      $sort: { date: 1 }
    },
    {
      $match: {
        role,
        service: {
          $in: category.REGULAR_SERVICES
        },
        date: {
          $gte: new Date(`${nextService.saturday} 00:00`)
        },
      }
    },
    {
      $lookup: {
        from: "volunteers",
        localField: "volunteer",
        foreignField: "_id",
        as: "volunteer"
      }
    },
    {
      $group: {
        _id: "$service",
        service: { 
          $push: { 
            date: "$date", 
            volunteer: "$volunteer",
            id: "$_id"
          } 
        }
      }
    }
  ]
  );
  return NextResponse.json({data: schedules}, {status: 200});
}
