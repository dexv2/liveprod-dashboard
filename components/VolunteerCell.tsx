"use client";

import { useRouter } from "next/navigation";

export default function VolunteerCell(props: { service: any }) {
  const router = useRouter();

  const openModal = () => {
    router.push(`/schedule/assign-volunteer/${props.service?.id}`);
  };

  return (
    <td onClick={openModal} className="border border-slate-500 bg-slate-100 hover:bg-slate-200 cursor-pointer min-w-20">
      <div className="overflow-hidden h-6">
        {props.service?.volunteer?.[0]?.name}
      </div>
    </td>
  );
}
