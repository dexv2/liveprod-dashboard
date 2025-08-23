import connectMongoDB from "@/libs/mongodb";
import Schedule from "@/models/schedule";
import { NextResponse } from "next/server";

interface RequestData {
  date: string,
  service: string,
  volunteer?: string,
  role: string
}

export async function POST(request: any) {
  const requestData: RequestData = await request.json();
  await connectMongoDB();
  const schedules = await Schedule.find(requestData);
  return NextResponse.json({data: schedules}, {status: 200});
}

export async function GET(request: any) {
  const requestData: RequestData = await request.json();
  await connectMongoDB();
  const schedules = await Schedule.find(requestData);
  return NextResponse.json({data: schedules}, {status: 200});
}
