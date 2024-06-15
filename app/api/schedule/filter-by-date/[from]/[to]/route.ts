import connectMongoDB from "@/libs/mongodb";
import Schedule from "@/models/schedule";
import { category } from "@/utils/constants";
import { NextResponse } from "next/server";

export async function GET(request: any, { params }: { params: { from: Date, to: Date }}) {
  await connectMongoDB();
  const schedules = await Schedule.aggregate([
    {
      $match: {
        service: {
          $in: category.REGULAR_SERVICES
        },
        date: {
          $gte: new Date(`${params.from} 00:00`),
          $lte: new Date(`${params.to} 23:59`)
        }
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
            role: "$role",
            date: "$date", 
            volunteer: "$volunteer",
            id: "$_id"
          }
        }
      }
    }
  ])
  return NextResponse.json({data: schedules, from: params.from, to: params.to}, {status: 200});
}
