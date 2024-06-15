import connectMongoDB from "@/libs/mongodb"
import Admin from "@/models/admin"
import { isPasswordMatched } from "@/utils/password";
import { NextResponse } from "next/server";

export async function POST(request: any) {
  try {
    const { username, password } = await request.json();
    await connectMongoDB();
    const adminDb = await Admin.findOne({ username });
    const validateAdmin = async () => {
      if (!adminDb) return null;

      const match = await isPasswordMatched(password, adminDb.password);
      if (!match) return null;

      return adminDb;
    }

    const admin = await validateAdmin();

    return NextResponse.json({ data: admin }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "An error occurred while logging in.", data: null }, { status: 500 });
  }
}
