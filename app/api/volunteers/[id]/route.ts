import connectMongoDB from "@/libs/mongodb";
import Volunteer from "@/models/volunteer";
import { NextResponse } from "next/server";
import "@/models/schedule";

interface RequestData {
  firstName?: string
  lastName?: string
  nickName?: string
  segment?: string
  status?: string
}

export async function PUT(request: any, { params }: any) {
  const requestData: RequestData = await request.json();

  try {
    await connectMongoDB();
    const volunteer = await Volunteer.findById(params.id);
    volunteer.name = `${requestData?.firstName || volunteer.firstName} ${requestData?.lastName || volunteer.lastName}`;

    Object.assign(volunteer, requestData);
    await volunteer.save();
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

export async function DELETE(request: any, { params }: any) {
  try {
    await connectMongoDB();
    const volunteer = await Volunteer.findByIdAndDelete(params.id);
    return NextResponse.json({message: `${volunteer.name} was removed as volunteer!`, success: true}, {status: 200});
  } catch (error: any) {
    return NextResponse.json({message: error.message, success: false}, {status: 500});
  }
}
