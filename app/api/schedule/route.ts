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
  requestData.date = new Date(requestData.date).toLocaleDateString("en-US", {timeZone: "Asia/Manila"});
  await connectMongoDB();
  try {
    await Schedule.create({...requestData, dateServiceRole: requestData.date.concat(requestData.service, requestData.role)});
    return NextResponse.json({message: `${requestData.date} ${requestData.service} schedule added for ${requestData.role} addedd.`}, {status: 201});
  } catch (error: any) {
    return NextResponse.json({message: error.message}, {status: 500});
  }
}

export async function GET() {
  await connectMongoDB();
  const schedules = await Schedule.find();
  return NextResponse.json({data: schedules}, {status: 200});
}
