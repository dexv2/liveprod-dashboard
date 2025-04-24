"use client";

import { postCreateMonthSchedule } from "@/utils/apis/post";
import { useRouter } from "next/navigation";

export default function CCAddRow({toggleLoading}: {toggleLoading: () => void}) {
  const router = useRouter();

  const createMonthSchedule = async () => {
    toggleLoading();
    await postCreateMonthSchedule();
    router.refresh();
  }

  return (
  <button
    onClick={createMonthSchedule}
    className="text-white px-2 py-1 bg-slate-700 rounded-md mt-2"
  >
    Add More Dates
  </button>
  )
}
