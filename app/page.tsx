import { auth } from "@/auth";
import Image from "next/image";
import { Fragment } from "react";
import { PiLegoSmiley, PiLegoSmileyDuotone } from "react-icons/pi"

export default async function Home() {
  const session = await auth();
  const user = session?.user?.username || "guest";

  return (
    <Fragment>
      <div className="flex flex-col gap-20">
        <div className="flex gap-1 text-slate-700">
          <PiLegoSmileyDuotone size={27} />
            <div className="flex flex-col justify-center text-lg">
              <div>
                Hello, <span className="capitalize font-semibold">{user}</span>! Navigate to see other pages
              </div>
            </div>
          <PiLegoSmiley size={27} />
        </div>
        <div className="flex flex-col justify-center h-96 items-center text-slate-700">
          <div className="flex flex-col gap-5">
            <em className="text-xl">{`"I can do all things through Christ who strengthens me."`}</em>
            <div className="flex justify-end">
              - Philippians 4:13
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center items-center absolute bottom-0 right-0">
        <Image unoptimized src="/quby-headphone.gif" alt="loading" width={120} height={120} />
      </div>
    </Fragment>
  );
}
