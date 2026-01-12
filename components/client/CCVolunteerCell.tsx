"use client";

import { useRouter, usePathname } from "next/navigation";
import { MdOutlineLockPerson } from "react-icons/md";
import { useEffect, useState } from "react";

export default function CCVolunteerCell({ service, isAuthenticated }: { service: any, isAuthenticated: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    if (!mounted || !isAuthenticated || !service?.id) return;
    const page = pathname !== '/' ? '/schedule' : '';
    router.push(`${page}/assign-volunteer/${service?.id}`, { scroll: false });
  };

  return (
    <td onClick={handleClick} className={`${isAuthenticated && !!service?.id ? "hover:bg-slate-300 cursor-pointer" : ""} border-x border-x-slate-300 min-w-12 lg:min-w-20 px-0.5 lg:px-1`}>
      { !!service?.id ?
        <div className="overflow-hidden h-[1.2rem] lg:h-[1.4rem] text-center text-[8px] md:text-xs lg:text-sm">
          {service?.volunteer?.[0]?.firstName}
        </div> :
        <div className="flex justify-center items-center h-[1.2rem] lg:h-[1.4rem]">
          <p className='text-[10px] xl:text-sm'>N/A</p>
          {/* <MdOutlineLockPerson size={16} className="lg:w-[22px] lg:h-[22px]" /> */}
        </div>
      }
    </td>
  );
}
