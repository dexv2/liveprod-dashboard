"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSession } from 'next-auth/react';
import { ASSIGN_VOLUNTEER_SCHEDULE } from '@/utils/constants';

export default function CCVolunteerCell({ service, isSaturday = false }: { service: any, isSaturday?: boolean }) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasAssignPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(ASSIGN_VOLUNTEER_SCHEDULE);
  }, [session]);

  const handleClick = () => {
    if (!mounted || !hasAssignPermission || !service?.id) return;
    const page = pathname !== '/' ? '/schedule' : '';
    router.push(`${page}/assign-volunteer/${service?.id}`, { scroll: false });
  };

  return (
    <td onClick={handleClick} className={`${hasAssignPermission && !!service?.id ? "hover:bg-slate-300 cursor-pointer" : ""} ${isSaturday ? "border-x-zinc-500" : "border-x-slate-300"} border-x min-w-12 lg:min-w-20 px-0.5 lg:px-1`}>
      <div className="flex flex-col justify-center overflow-hidden h-[1.2rem] lg:h-[1.4rem] text-center text-[10px] font-medium sm:font-normal md:text-sm lg:text-sm xl:text-sm">
        {!!service?.id ? service?.volunteer?.firstName : 'N/A'}
      </div>
    </td>
  );
}
