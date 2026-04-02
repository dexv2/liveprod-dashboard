import connectMongoDB from "@/libs/mongodb";
import Schedule from "@/models/schedule";
import { category } from "@/utils/constants";
import { getNextService } from "@/utils/helpers";
import { NextResponse } from "next/server";

export async function GET(request: any, { params }: any) {
  const { role } = params;
  const nextService = getNextService();
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
          $gte: new Date(`${nextService.saturday}T00:00:00.000+08:00`)
        },
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
