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
          $gte: new Date(`${params.from}T00:00:00.000+08:00`),
          $lte: new Date(`${params.to}T23:59:00.000+08:00`)
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
  ])
  return NextResponse.json({data: schedules, saturday: params.from, sunday: params.to}, {status: 200});
}
