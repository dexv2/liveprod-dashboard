"use client";

import { useEffect, useRef, useState } from 'react';
import GCArrowPrev from '../global/GCArrowPrev';
import GCArrowNext from '../global/GCArrowNext';

export default function CCScheduleNavigation({ increment }: { increment: number }) {
  const [isSticky, setIsSticky] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!navRef.current) return;

    const handleScroll = () => {
      if (!navRef.current) return;
      const rect = navRef.current.getBoundingClientRect();
      setIsSticky(rect.top <= 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div ref={navRef} className={`my-1 ${isSticky ? 'h-12' : ''}`}>
        <div className={`py-2 transition-all duration-300 ease-in-out ${isSticky ? 'fixed flex flex-col justify-center top-0 left-0 right-0 z-50 bg-slate-800 bg-opacity-70 shadow-md h-12' : ''}`}>
          <div className={`flex justify-between px-2 transition-all duration-300 ${isSticky ? "px-8 text-slate-200" : ""}`}>
            <GCArrowPrev label="Prev Week" type="link" queryParams={`?increment=${increment-1}&service=regular`} isSticky={isSticky} />
            <GCArrowNext label="Next Week" type="link" queryParams={`?increment=${increment+1}&service=regular`} isSticky={isSticky} />
          </div>
        </div>
      </div>
    </>
  );
}
