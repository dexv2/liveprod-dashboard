import connectMongoDB from "@/libs/mongodb"
import Admin from "@/models/admin"
import { NextResponse } from "next/server";

interface RequestData {
  username?: string
  tier?: number
}

export async function PUT(request: any, { params }: any) {
  const requestData: RequestData = await request.json();

  try {
    await connectMongoDB();
    await Admin.findByIdAndUpdate(params.id, { tier: requestData.tier });

    return NextResponse.json({message: `Admin info updated`}, {status: 200});
  } catch (error) {
    return NextResponse.json({ message: "An error occurred while updating admin.", data: null }, { status: 500 });
  }
}
