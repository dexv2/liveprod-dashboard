"use client";

import { useRouter } from "next/navigation";
import { MdOutlineLockPerson } from "react-icons/md";

export default function CCVolunteerCell({ service, isAuthenticated }: { service: any, isAuthenticated: boolean }) {
  const router = useRouter();

  const handleClick = () => {
    if (!isAuthenticated || !service?.id) return;
    router.push(`/schedule/assign-volunteer/${service?.id}`);
  };

  return (
    <td onClick={handleClick} className={`${isAuthenticated && !!service?.id ? "hover:bg-slate-300 cursor-pointer" : ""} border-x border-x-slate-300 min-w-20`}>
      { !!service?.id ?
        <div className="overflow-hidden h-6">
          {service?.volunteer?.[0]?.firstName}
        </div> :
        <div className="flex justify-center h-6">
          <MdOutlineLockPerson size={22} />
        </div>
      }
    </td>
  );
}
