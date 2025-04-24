"use client";

import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";

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

  useLayoutEffect(() => {
    if (pathname === "/") {
      document.body.classList.add("background-gradient");
    } else {
      document.body.classList.remove("background-gradient");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // testing
  }, [pathname])

  const pageTitle = useMemo(() => {
    if (pathname.startsWith("/schedule/segment/")) return "Upcoming Schedule";
    if (pathname.startsWith("/schedule/role/")) return "Schedule Masterlist";
    if (pathname.startsWith("/schedule/assign-volunteer")) return "Assign Volunteer";
    if (pathname.startsWith("/login")) return "Login Page";
    if (pathname.startsWith("/volunteer/all")) return "Volunteers List";
    if (pathname.startsWith("/volunteer/profile")) return "Volunteer Profile";
    if (pathname.startsWith("/volunteer/add")) return "Add Volunteer";
    return "Dashboard";
  }, [pathname]);

  return (
    <nav className={`${pathname === "/" ? "bg-opacity-0": "bg-opacity-100"} flex justify-between items-center bg-slate-900 px-5 py-5 rounded-ss-md rounded-e-md transition-opacity delay-1000 relative`}>
      <Link href={"/"}>
        <div className="flex gap-1 items-center">
          <Image src="/ccf-logo.png" width={45} height={45} alt="logo" />
          <h1 className="text-white text-lg uppercase font-semibold">Live&nbsp;Prod</h1>
        </div>
      </Link>
      <div className="flex justify-between">
        { isAuthenticated && <Link className="text-white p-2" href={"/schedule/role/foh"}>Schedules</Link> }
        <Link className="text-white p-2" href={"/schedule/segment/audio/sunday"}>Upcoming</Link>
        <Link className="text-white p-2" href={"/volunteer/all"}>Volunteers</Link>
        { !isAuthenticated ?
          <button onClick={() => signIn()} className="text-white p-2">Login</button>
          :
          <button onClick={() => signOut({redirect: true, callbackUrl: "/login"})} className="text-white p-2">Logout</button>
        }
      </div>
      { pathname !== "/" &&
        <div className="absolute left-0 bottom-0 bg-slate-900 translate-y-full py-1.5 pl-10 pr-44 opacity-75 rounded-es-md rounded-ee-md [clip-path:polygon(100%_0,_76%_92%,_75%_94%,_74%_96%,_0_100%,_0_0)] border-t border-t-white">
          <h1 className="text-xl capitalize text-white">
            {pageTitle}
          </h1>
        </div>
      }
    </nav>
  )
}
