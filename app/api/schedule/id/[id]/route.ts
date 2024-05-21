import connectMongoDB from "@/libs/mongodb";
import Schedule from "@/models/schedule";
import { NextResponse } from "next/server";

export async function GET(request: any, { params }: any) {
  await connectMongoDB();
  const schedule = await Schedule.findById(params.id);
  return NextResponse.json({data: schedule}, {status: 200});
}
