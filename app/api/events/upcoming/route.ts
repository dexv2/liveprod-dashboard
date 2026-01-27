export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import connectMongoDB from "@/libs/mongodb";
import Event from "@/models/event";
import { getTodayDate } from '@/utils/helpers';
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectMongoDB();
    const today = getTodayDate();
    const events = await Event.find({ date: { $gte: today } }).sort({ date: 1 });
    
    // Test cache-control header
    return NextResponse.json(
      { data: events },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate'
        }
      }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
