import connectMongoDB from "@/libs/mongodb";
import Volunteer from "@/models/volunteer";
import { NextResponse } from "next/server";

interface RequestData {
  firstName: string
  lastName: string
  nickName?: string
  segment: string
  status: string
}

export async function POST(request: any) {
  const requestData: RequestData = await request.json();

  try {
    await connectMongoDB();
    const updateData = {
      name: `${requestData.firstName} ${requestData.lastName}`,
      ...requestData
    }

    await Volunteer.create(updateData);
    return NextResponse.json({message: `${updateData.name} was added as ${updateData.segment} volunteer.`}, {status: 201});
  } catch (error: any) {
    return NextResponse.json({message: error.message}, {status: 500});
  }
}

export async function GET() {
  await connectMongoDB();
  const volunteers = await Volunteer.find().select("-schedules -createdAt -updatedAt");
  return NextResponse.json({data: volunteers}, {status: 200});
}

export async function PUT(request: any) {
  const requestData = await request.json();
  await connectMongoDB();
  try {
    await Volunteer.updateMany({}, {...requestData});
    return NextResponse.json({message: "All volunteers' status updated."}, {status: 200});
  } catch (error: any) {
    return NextResponse.json({message: error.message}, {status: 500});
  }
}
