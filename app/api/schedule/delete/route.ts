import connectMongoDB from "@/libs/mongodb";
import Schedule from "@/models/schedule";
import { NextResponse } from "next/server";

export async function DELETE() {
  await connectMongoDB();
  
  try {
    const result = await Schedule.deleteMany({ service: "sns2" });
    return NextResponse.json({
      message: `Successfully deleted ${result.deletedCount} schedule(s) with service "sns2"`,
      deletedCount: result.deletedCount
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      message: "Failed to delete schedules",
      error: error.message
    }, { status: 500 });
  }
}
