import connectMongoDB from "@/libs/mongodb"
import Admin from "@/models/admin"
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectMongoDB();
    const admins = await Admin.find();
    return NextResponse.json({ data: admins }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "An error occurred while getting admins.", data: null }, { status: 500 });
  }
}
