"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RiArrowDropDownLine } from 'react-icons/ri';
import { VIEW_ASSIGNMENTS, VIEW_TRAINING, VIEW_OBSERVER_TRACKER, VIEW_ANNOUNCEMENTS, VIEW_ANALYTICS } from '@/utils/constants';
import { useDevice } from '@/context/DeviceProvider';

export default function GCNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [newPath, setNewPath] = useState("/");
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const { isTablet } = useDevice();

  const isAuthenticated = mounted ? session?.user?.username : false;
  const isAdmin = mounted ? (session?.user as any)?.isAdmin : false;
  const isSuperAdmin = mounted ? (session?.user as any)?.superAdmin : false;

  const hasViewAssignmentsPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(VIEW_ASSIGNMENTS);
  }, [session]);

  const hasViewTrainingPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(VIEW_TRAINING);
  }, [session]);

  const hasViewObserverTrackerPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(VIEW_OBSERVER_TRACKER);
  }, [session]);

  const hasViewAnnouncementsPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(VIEW_ANNOUNCEMENTS);
  }, [session]);

  const hasViewAnalyticsPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(VIEW_ANALYTICS);
  }, [session]);

  useEffect(() => {
    setMounted(true);
    const url = `${pathname}`
    const prevPath = newPath;
    setNewPath(url);

    if (prevPath.includes("/assign-volunteer/") || prevPath.startsWith("/volunteer/add") || prevPath.startsWith("/add-event")) {
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
      true
      // /^\/$|^\/(?:assign-volunteer|add-event|login|change-password|schedule)/.test(pathname)
    );
  }, [pathname])

  const tabLink = (label: string, href: string, highlightLink?: string) => {
    const isActive = pathname === href || pathname.startsWith(String(highlightLink));
    return (
      <Link className={`p-2 ${isActive ? 'text-emerald-200' : 'text-white'}`} href={href}>
        {label}
      </Link>
    )
  }

  const subTabLink = (label: string, href: string, highlightLink?: string) => {
    const isActive = pathname === href || pathname.startsWith(String(highlightLink));
    return (
      <Link className={`block px-4 py-2 hover:bg-slate-700 ${isActive ? 'text-emerald-200' : 'text-white'}`} href={href}>
        {label}
      </Link>
    )
  }

  return (
    // <nav className={`${/^\/$|^\/(?:assign-volunteer|add-event|login|schedule)/.test(pathname) ? "bg-opacity-0 mb-4": "bg-opacity-100 mb-8"} flex justify-between items-center bg-slate-950 px-3 md:px-5 py-3 md:py-5 rounded-ss-md rounded-e-md transition-opacity delay-1000 relative`}>
    <nav className="bg-opacity-0 mb-4 flex justify-between items-center bg-slate-950 px-3 md:px-5 py-3 md:py-5 rounded-ss-md rounded-e-md transition-opacity delay-1000 relative">
      <Link href={"/"}>
        <div className="flex flex-col gap-1">
          <div className="flex gap-1 items-center">
            <Image src="/ccf-logo.png" width={35} height={35} className="md:w-[45px]
             md:h-[45px]" alt="logo" />
            {isTablet ? (
              <div className='flex flex-col justify-between'>
                {/* <p className="text-white text-sm md:text-lg uppercase font-semibold leading-none">Live&nbsp;Prod</p> */}
                <p className="text-white text-sm md:text-lg uppercase font-semibold leading-none">Volunteer&nbsp;Schedule</p>
              </div>
            ) : (
              <p className="text-white text-sm md:text-lg uppercase font-semibold leading-none">Volunteer&nbsp;Schedule</p>
            )}
          </div>
          <p className="text-white text-xs md:text-xs italic max-w-md">
            &ldquo;May the God who gives endurance and encouragement give you the same attitude of mind toward each other that Christ Jesus had, so that with one mind and one voice you may glorify the God and Father of our Lord Jesus Christ.&rdquo; - Romans 15:5-6 NIV
          </p>
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
        {tabLink("Upcoming", "/schedule/segment/audio", "/schedule/segment")}
        {hasViewAssignmentsPermission && tabLink("Assignments", "/schedule/role/foh", "/schedule/role")}
        {tabLink("Calendar", "/schedule/calendar")}
        {!isAdmin ? tabLink("My Schedule", "/volunteer/all") : (
            <div className="relative">
              <button 
                className={`${/^\/(admin|volunteer|super-admin)(\/|$)/.test(pathname) ? 'text-emerald-200' : 'text-white'} p-2 cursor-pointer`}
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
                  {subTabLink("Volunteers List", "/volunteer/all")}
                  {hasViewTrainingPermission && subTabLink("Training", "/volunteer/training")}
                  {hasViewObserverTrackerPermission && subTabLink("Observer Tracker", "/volunteer/observer-tracker")}
                  {hasViewAnalyticsPermission && subTabLink("Analytics", "/admin/analytics")}
                  {hasViewAnnouncementsPermission && subTabLink("Announcements", "/admin/announcements")}
                  {isSuperAdmin && subTabLink("Super Admin", "/super-admin")}
                </div>
              )}
            </div>
          )
        }
        
        { !isAuthenticated ?
          <button onClick={() => signIn()} className={`${pathname.startsWith('/login') ? 'text-emerald-200' : 'text-white'} p-2`}>Login</button>
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
          {hasViewAssignmentsPermission && <Link className="block text-white px-4 py-3 hover:bg-slate-700 border-b border-slate-600" href={"/schedule/role/foh"} onClick={() => setShowDropdown(false)}>Assignments</Link>}
          {hasViewTrainingPermission && <Link className="block text-white px-4 py-3 hover:bg-slate-700 border-b border-slate-600" href={"/volunteer/training"} onClick={() => setShowDropdown(false)}>Training</Link>}
          {hasViewObserverTrackerPermission && <Link className="block text-white px-4 py-3 hover:bg-slate-700 border-b border-slate-600" href={"/volunteer/observer-tracker"} onClick={() => setShowDropdown(false)}>Observer Tracker</Link>}
          {hasViewAnalyticsPermission && <Link className="block text-white px-4 py-3 hover:bg-slate-700 border-b border-slate-600" href={"/admin/analytics"} onClick={() => setShowDropdown(false)}>Analytics</Link>}
          {hasViewAnnouncementsPermission && <Link className="block text-white px-4 py-3 hover:bg-slate-700 border-b border-slate-600" href={"/admin/announcements"} onClick={() => setShowDropdown(false)}>Announcements</Link>}
          {isSuperAdmin && <Link className="block text-white px-4 py-3 hover:bg-slate-700 border-b border-slate-600" href={"/super-admin"} onClick={() => setShowDropdown(false)}>Super Admin</Link>}
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
    </nav>
  )
}
