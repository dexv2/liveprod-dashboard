"use client";

import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RiArrowDropDownLine } from 'react-icons/ri';

export default function Navbar({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [newPath, setNewPath] = useState("/");
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isAuthenticated = mounted ? session?.user?.username : false;
  const isAdmin = mounted ? (session?.user as any)?.isAdmin : false;

  useEffect(() => {
    setMounted(true);
    const url = `${pathname}`
    const prevPath = newPath;
    setNewPath(url);

    if (prevPath.startsWith("/assign-volunteer/") || prevPath.startsWith("/volunteer/add") || prevPath.startsWith("/login") || prevPath.startsWith("/add-event")) {
      router.refresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    /**
     * Toggles the 'background-gradient' CSS class on the document body based on the current pathname.
     * The gradient is applied when the user is on the home page ("/"), assign-volunteer page, or login page.
     */
    document.body.classList.toggle(
      "background-gradient",
      /^\/$|^\/(?:assign-volunteer|add-event|login)/.test(pathname)
    );
  }, [pathname])

  const pageTitle = useMemo(() => {
    if (pathname.startsWith("/schedule/segment/")) return "Upcoming Schedule";
    if (pathname.startsWith("/schedule/role/")) return "Masterlist";
    if (pathname.startsWith("/schedule/assign-volunteer")) return "Masterlist";
    if (pathname.startsWith("/schedule/calendar")) return "Live Production Calendar";
    if (pathname.startsWith("/login")) return "Login Page";
    if (pathname.startsWith("/volunteer/all")) return "Volunteers List";
    if (pathname.startsWith("/volunteer/profile")) return "Volunteer Profile";
    if (pathname.startsWith("/volunteer/add")) return "Add Volunteer";
    if (pathname.startsWith("/volunteer/training")) return "Training";
    if (pathname.startsWith("/volunteer/observer-tracker")) return "Observer Tracker";
    if (pathname.startsWith("/admin/analytics")) return "Analytics";
    return "Dashboard";
  }, [pathname]);

  return (
    <nav className={`${/^\/$|^\/(?:assign-volunteer|add-event|login)/.test(pathname) ? "bg-opacity-0 mb-4": "bg-opacity-100 mb-8"} flex justify-between items-center bg-slate-950 px-3 md:px-5 py-3 md:py-5 rounded-ss-md rounded-e-md transition-opacity delay-1000 relative`}>
      <Link href={"/"}>
        <div className="flex gap-1 items-center">
          <Image src="/ccf-logo.png" width={35} height={35} className="md:w-[45px] md:h-[45px]" alt="logo" />
          <h1 className="text-white text-sm md:text-lg uppercase font-semibold">Live&nbsp;Prod</h1>
        </div>
      </Link>
      {/* Mobile menu button */}
      <button 
        className="md:hidden text-white p-2"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Desktop menu */}
      <div className="hidden md:flex justify-between">
        <Link className="text-white p-2" href={"/schedule/segment/audio"}>Upcoming</Link>
        {isAdmin && <Link className="text-white p-2" href={"/schedule/role/foh"}>Assignments</Link>}
        <Link className="text-white p-2" href={"/schedule/calendar"}>Calendar</Link>
        {!isAdmin ? (
            <Link className="text-white p-2" href={"/volunteer/all"}>
              My Schedule
            </Link>
          ) : (
            <div className="relative">
              <button 
                className="text-white p-2 cursor-pointer"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <div className='flex items-center'>
                  <div>Admin</div>
                  <RiArrowDropDownLine size={22} />
                </div>
                
              </button>
              {showDropdown && (
                <div 
                  className="absolute top-full left-0 bg-slate-800 rounded shadow-lg z-10 min-w-max"
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <Link className="block text-white px-4 py-2 hover:bg-slate-700" href={"/volunteer/all"}>Volunteers List</Link>
                  {isAdmin && <Link className="block text-white px-4 py-2 hover:bg-slate-700" href={"/volunteer/training"}>Training</Link>}
                  {isAdmin && <Link className="block text-white px-4 py-2 hover:bg-slate-700" href={"/volunteer/observer-tracker"}>Observer Tracker</Link>}
                  {isAdmin && <Link className="block text-white px-4 py-2 hover:bg-slate-700" href={"/admin/analytics"}>Analytics</Link>}
                  {isAdmin && <Link className="block text-white px-4 py-2 hover:bg-slate-700" href={"/admin/announcements"}>Announcements</Link>}
                </div>
              )}
            </div>
          )
        }
        
        { !isAuthenticated ?
          <button onClick={() => signIn()} className="text-white p-2">Login</button>
          :
          <div className="flex items-center gap-2">
            <button onClick={() => signOut({redirect: true, callbackUrl: "/login"})} className="text-white p-2">Logout</button>
            <span className="text-white text-xs md:text-sm capitalize">({session?.user?.username})</span>
          </div>
        }
      </div>

      {/* Mobile menu */}
      {showDropdown && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-slate-800 rounded-b shadow-lg z-10">
          <Link className="block text-white px-4 py-3 hover:bg-slate-700 border-b border-slate-600" href={"/schedule/segment/audio"} onClick={() => setShowDropdown(false)}>Upcoming</Link>
          <Link className="block text-white px-4 py-3 hover:bg-slate-700 border-b border-slate-600" href={"/schedule/calendar"} onClick={() => setShowDropdown(false)}>Calendar</Link>
          <Link className="block text-white px-4 py-3 hover:bg-slate-700 border-b border-slate-600" href={"/volunteer/all"} onClick={() => setShowDropdown(false)}>{`${isAdmin ? "Volunteers List" : "My Schedule"}`}</Link>
          {isAdmin && <Link className="block text-white px-4 py-3 hover:bg-slate-700 border-b border-slate-600" href={"/schedule/role/foh"} onClick={() => setShowDropdown(false)}>Assignments</Link>}
          {isAdmin && <Link className="block text-white px-4 py-3 hover:bg-slate-700 border-b border-slate-600" href={"/volunteer/training"} onClick={() => setShowDropdown(false)}>Training</Link>}
          {isAdmin && <Link className="block text-white px-4 py-3 hover:bg-slate-700 border-b border-slate-600" href={"/volunteer/observer-tracker"} onClick={() => setShowDropdown(false)}>Observer Tracker</Link>}
          {isAdmin && <Link className="block text-white px-4 py-3 hover:bg-slate-700 border-b border-slate-600" href={"/admin/analytics"} onClick={() => setShowDropdown(false)}>Analytics</Link>}
          {isAdmin && <Link className="block text-white px-4 py-3 hover:bg-slate-700 border-b border-slate-600" href={"/admin/announcements"} onClick={() => setShowDropdown(false)}>Announcements</Link>}
          { !isAuthenticated ?
            <button onClick={() => { signIn(); setShowDropdown(false); }} className="block w-full text-left text-white px-4 py-3 hover:bg-slate-700">Login</button>
            :
            <div className="px-4 py-3">
              <button onClick={() => { signOut({redirect: true, callbackUrl: "/login"}); setShowDropdown(false); }} className="block w-full text-left text-white hover:bg-slate-700 px-2 py-2 rounded">Logout</button>
              <span className="text-white text-xs capitalize mt-2 block">({session?.user?.username})</span>
            </div>
          }
        </div>
      )}
      { !/^\/$|^\/(?:assign-volunteer|add-event|login)/.test(pathname) && <div className="hidden md:block absolute left-0 bottom-0 bg-slate-950 translate-y-full py-1.5 pl-10 pr-44 opacity-90 rounded-es-md rounded-ee-md [clip-path:polygon(100%_0,_76%_92%,_75%_94%,_74%_96%,_0_100%,_0_0)] border-t border-t-white">
        <h1 className="text-lg lg:text-xl capitalize text-white">
          {pageTitle}
        </h1>
      </div>}
    </nav>
  )
}
