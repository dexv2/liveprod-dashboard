import connectMongoDB from "@/libs/mongodb";
import Volunteer from "@/models/volunteer";
import { NextResponse } from "next/server";
import "@/models/schedule";

export const dynamic = "force-dynamic";
export async function GET() {
  await connectMongoDB();
  const volunteers = await Volunteer.find().populate("schedules", "date role service");
  return NextResponse.json({data: volunteers}, {status: 200});
}
