"use client";

import { usePathname, useRouter } from "next/navigation";

export default function CCVolunteerCell({ service, isAuthenticated }: { service: any, isAuthenticated: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  const darkBorder = pathname.includes("schedule/segment")

  const handleClick = () => {
    if (!isAuthenticated || !service?.id) return;
    router.push(`/schedule/assign-volunteer/${service?.id}`);
  };

  return (
    <td onClick={handleClick} className={`${isAuthenticated && !!service?.id ? "hover:bg-slate-300 cursor-pointer" : ""} ${!!service?.id ? "": "bg-gray-300"} border ${darkBorder ? "border-slate-500" : "border-slate-300"} min-w-20`}>
      <div className="overflow-hidden h-6">
        {service?.volunteer?.[0]?.firstName}
      </div>
    </td>
  );
}
