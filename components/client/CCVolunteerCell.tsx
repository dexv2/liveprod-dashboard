"use client";

import { useRouter } from "next/navigation";

export default function CCVolunteerCell({ service, isAuthenticated }: { service: any, isAuthenticated: boolean }) {
  const router = useRouter();

  const handleClick = () => {
    if (!isAuthenticated) return;
    router.push(`/schedule/assign-volunteer/${service?.id}`);
  };

  return (
    <td onClick={handleClick} className={`${isAuthenticated ? "hover:bg-slate-200 cursor-pointer" : ""} border border-slate-500 bg-slate-100 min-w-20`}>
      <div className="overflow-hidden h-6">
        {service?.volunteer?.[0]?.name}
      </div>
    </td>
  );
}
