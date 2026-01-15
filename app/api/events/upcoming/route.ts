import connectMongoDB from "@/libs/mongodb";
import Event from "@/models/event";
import { getTodayDate } from '@/utils/helpers';
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectMongoDB();
    const today = getTodayDate();
    const events = await Event.find().sort({ date: 1 });
    // const events = await Event.find({ date: { $gte: today } }).sort({ date: 1 });
    console.log('today:', today);
    console.log('events:', events);
    return NextResponse.json({ data: events }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
