import connectMongoDB from "@/libs/mongodb";
import Schedule from "@/models/schedule";
import { createSnsMonthPayload, createSundayMonthPayload, newDate } from "@/utils/helpers";
import { NextResponse } from "next/server";
import { add as dateAdd, subtract as dateSub } from "date-arithmetic";

export async function POST() {
  try {
    await connectMongoDB();
    const latestSchedule = await Schedule.findOne().sort({date: -1});

    let nextSchedule: Date;
    if (!latestSchedule) {
      nextSchedule = dateSub(newDate(), 1, "day");
    } else {
      nextSchedule = dateAdd(dateSub(latestSchedule.date, 1, "day"), 1, "month");
    }

    const nextSchedMonth = nextSchedule.getMonth();
    const nextSchedYear = nextSchedule.getFullYear();

    const sns = createSnsMonthPayload(nextSchedYear, nextSchedMonth);
    const sundayService = createSundayMonthPayload(nextSchedYear, nextSchedMonth);

    const allServices = sns.concat(sundayService);
    await Schedule.insertMany(allServices);

    return NextResponse.json({message: "Month schedule added", data: allServices}, {status: 201});
  } catch (error: any) {
    return NextResponse.json({message: error.message}, {status: 500});
  }
}
