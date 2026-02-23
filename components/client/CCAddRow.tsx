"use client";

import { postCreateMonthSchedule } from "@/utils/apis/post";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useSession } from 'next-auth/react';
import { ADD_DATE_ROWS } from '@/utils/constants';

export default function CCAddRow({toggleLoading}: {toggleLoading: () => void}) {
  const router = useRouter();
  const { data: session } = useSession();

  const hasAddDateRowsPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(ADD_DATE_ROWS);
  }, [session]);

  if (!hasAddDateRowsPermission) return null;

  const createMonthSchedule = async () => {
    toggleLoading();
    await postCreateMonthSchedule();
    router.refresh();
  }

  return (
  <button
    onClick={createMonthSchedule}
    className="text-white px-2.5 py-0.5 bg-slate-700 rounded-md whitespace-nowrap"
  >
    Add Date Rows
  </button>
  )
}
