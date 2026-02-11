import connectMongoDB from "@/libs/mongodb"
import { changePasswordSchema } from '@/libs/zod';
import Admin from "@/models/admin"
import Schedule from "@/models/schedule";
import { callTextbee } from "@/utils/apis/textbee";
import { saltAndHashPassword } from '@/utils/password';
import { NextResponse } from "next/server";

interface RequestData {
  username?: string
  tier?: number
  permissions?: string[]
  superAdmin?: boolean
  password?: string
  isPasswordChanged?: boolean
}

export async function PUT(request: any, { params }: any) {
  const requestData: RequestData = await request.json();
  const updatedFields: RequestData = {};

  if (typeof requestData?.username === "string") {
    updatedFields.username = requestData.username;
  }
  if (typeof requestData?.password === "string") {
    try {
      const { password } = await changePasswordSchema.parseAsync({ password: requestData.password });
      const hashedPassword = await saltAndHashPassword(password);
      updatedFields.password = hashedPassword;
      updatedFields.isPasswordChanged = true;
    } catch (error: any) {
      // Return validation error before reaching the main try-catch
      return NextResponse.json({ 
        message: error?.errors?.[0]?.message || "Invalid password format",
        error: error?.errors
      }, { status: 400 });
    }
  }
  if (Array.isArray(requestData?.permissions)) {
    updatedFields.permissions = requestData.permissions;
  }
  if (typeof requestData?.superAdmin === "boolean") {
    updatedFields.superAdmin = requestData.superAdmin;
  }
  if (typeof requestData?.tier === "number") {
    updatedFields.tier = requestData.tier;
  }
  if (typeof requestData?.isPasswordChanged === "boolean") {
    updatedFields.isPasswordChanged = requestData.isPasswordChanged;
  }

  try {
    await connectMongoDB();
    await Admin.findByIdAndUpdate(params.id, updatedFields);

    return NextResponse.json({message: `Admin info updated`}, {status: 200});
  } catch (error) {
    return NextResponse.json({ message: "An error occurred while updating admin", data: null, error: true }, { status: 500 });
  }
}

export async function POST() {
  await connectMongoDB();

  // Get the date 2 days from now (Asia/Manila)
  const now = new Date();
  const manilaNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const targetDate = new Date(manilaNow);
  targetDate.setDate(manilaNow.getDate() + 2);

  // Find schedules for that date
  const schedules = await Schedule.find({ date: targetDate }).populate("volunteer");

  for (const sched of schedules) {
    const volunteer = sched.volunteer;
    if (!volunteer || !volunteer.phone) continue;

    // Compose message
    const day = targetDate.toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Manila" });
    const msg = `Hi ${volunteer.firstName}, gentle reminder: you are scheduled as ${sched.role} on ${day}, ${targetDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}.`;

    // Call Textbee API
    await callTextbee({
      to: volunteer.phone,
      message: msg,
    });
  }

  return NextResponse.json({ message: "Notifications sent" });
}