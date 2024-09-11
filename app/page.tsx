import { auth } from "@/auth";
import CCSlideshow from "@/components/client/CCSlideshow";
import Image from "next/image";
import { Fragment } from "react";
import { PiLegoSmiley, PiLegoSmileyDuotone } from "react-icons/pi"

export default async function Home() {
  const session = await auth();
  const user = session?.user?.username || "guest";

  return (
    <Fragment>
      <div className="flex flex-col gap-16">
        <div className="flex gap-3 text-white opacity-60 justify-center">
          <PiLegoSmileyDuotone size={27} />
            <div className="flex flex-col justify-center text-lg">
              <div>
                {/* Hello, <span className="capitalize">{user}</span>! Navigate to see other pages */}
                Hello, <span className="capitalize">{user}</span>! Meet the Audio family! ♫⋆｡♪ ₊˚♬
              </div>
            </div>
          <PiLegoSmiley size={27} />
        </div>
        <CCSlideshow />
      </div>
      <div className="flex justify-center items-center absolute bottom-0 right-0 opacity-70">
        <Image unoptimized src="/audio-wave.gif" alt="loading" width={250} height={20} />
      </div>
    </Fragment>
  );
}
