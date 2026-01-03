import connectMongoDB from "@/libs/mongodb";
import Event from "@/models/event";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectMongoDB();
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    const events = await Event.find({ date: { $gte: now } }).sort({ date: 1 });
    return NextResponse.json({ data: events }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
