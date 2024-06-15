"use client";

import { Session } from "next-auth";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [newPath, setNewPath] = useState("/");

  const isAuthenticated = session?.user?.username;

  useEffect(() => {
    const url = `${pathname}`
    const prevPath = newPath;
    setNewPath(url);
    if (prevPath.startsWith("/schedule/assign-volunteer/") || prevPath.startsWith("/volunteer/add") || prevPath.startsWith("/login")) {
      router.refresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <nav className="flex justify-between items-center bg-slate-900 px-5 py-5 rounded-md">
      <Link href={"/"}>
        <div className="flex gap-1 items-center">
          <Image src="/ccf-logo.png" width={45} height={45} alt="logo" />
          <h1 className="text-white text-lg uppercase font-semibold">Live&nbsp;Prod</h1>
        </div>
      </Link>
      <div className="flex justify-between">
        { isAuthenticated && <Link className="text-white p-2" href={"/schedule/role/foh/foh%20assistant/broadcast%20mix"}>Schedules</Link> }
        <Link className="text-white p-2" href={"/schedule/segment/audio"}>Upcoming</Link>
        <Link className="text-white p-2" href={"/volunteer/all"}>Volunteers</Link>
        { !isAuthenticated && <button onClick={() => signIn()} className="text-white p-2">Login</button> }
      </div>
    </nav>
  )
}
