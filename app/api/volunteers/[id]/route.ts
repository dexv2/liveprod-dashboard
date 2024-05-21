import connectMongoDB from "@/libs/mongodb";
import Volunteer from "@/models/volunteer";
import { NextResponse } from "next/server";

interface RequestData {
  name: string
  segment: string
  tier: string
}

export async function PUT(request: any, { params }: any) {
  const requestData: RequestData = await request.json();
  await connectMongoDB();
  try {
    await Volunteer.findByIdAndUpdate(params.id, requestData);
    return NextResponse.json({message: `Volunteer info updated`}, {status: 200});
  } catch (error: any) {
    return NextResponse.json({message: error.message}, {status: 500});
  }
}

export async function GET(request: any, { params }: any) {
  await connectMongoDB();
  const volunteer = await Volunteer.findById(params.id).populate("schedules", "date role service");
  return NextResponse.json({data: volunteer}, {status: 200});
}
