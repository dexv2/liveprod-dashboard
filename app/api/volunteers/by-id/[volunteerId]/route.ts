import connectMongoDB from "@/libs/mongodb";
import Volunteer from "@/models/volunteer";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { volunteerId: string } }) {
  try {
    await connectMongoDB();
    const volunteerDocument = await Volunteer.findOne({ volunteerId: params.volunteerId });
    
    if (!volunteerDocument) {
      return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
    }
    const volunteer = volunteerDocument.toObject();
    if (volunteer.telegram) delete volunteer.telegram;
    
    return NextResponse.json({ data: volunteer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
