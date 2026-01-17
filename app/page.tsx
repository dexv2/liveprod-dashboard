export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import CCAnnouncementBanner from "@/components/client/CCAnnouncementBanner";
import SCScheduleBySegment from "@/components/server/SCScheduleBySegment";
import { PiLegoSmiley, PiLegoSmileyDuotone } from "react-icons/pi"

export default async function Home({searchParams}: {searchParams: {increment?: string, service?: string}}) {
  const session = await auth();
  const user = session?.user?.username || "guest";
  const increment = parseInt(searchParams?.increment || "0");
  const service = searchParams?.service || "regular";

  return (
    <>
      <CCAnnouncementBanner />
      <div className="flex flex-col gap-6 md:gap-6 px-2 md:px-4">
        <div className="flex gap-2 md:gap-3 text-slate-100 justify-center text-center">
          <PiLegoSmileyDuotone size={20} className="md:w-[27px] md:h-[27px] flex-shrink-0" />
          <div className="flex flex-col justify-center text-sm md:text-lg">
            <div>
              Hello, <span className="capitalize">{user}</span>! Welcome to Live Production Dashboard
            </div>
          </div>
          <PiLegoSmiley size={20} className="md:w-[27px] md:h-[27px] flex-shrink-0" />
        </div>
        <SCScheduleBySegment increment={increment} service={service} />
      </div>
    </>
  );
}