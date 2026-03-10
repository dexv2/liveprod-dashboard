"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BsArrowLeftCircle } from 'react-icons/bs';

export default function GCArrowPrev({ label, type, queryParams, disabled, handlePrevPage, isSticky }: { label: string, type: string, queryParams?: string, disabled?: boolean, handlePrevPage?: () => void, isSticky?: boolean }) {
  const pathname = usePathname();
  // const isWhite = !pathname.includes('schedule');
  const isWhite = true;

  if (type === 'link') {
    return (
      <Link href={`${pathname}${queryParams}`}>
        <div className={`${isWhite || isSticky ? 'text-slate-200' : 'text-slate-600'} hover:underline flex gap-1 md:gap-2 items-center h-fit`}>
          <BsArrowLeftCircle size={18} className="md:w-[22px] md:h-[22px]" />
          <p className="text-sm md:text-base">{label}</p>
        </div>
      </Link>
    );
  }
  if (type === 'button') {
    return (
      <button disabled={disabled} onClick={handlePrevPage}>
        <div className={`${isWhite ? 'text-slate-200' : 'text-slate-600'} hover:underline flex gap-1 md:gap-2 items-center`}>
          <BsArrowLeftCircle size={18} className="md:w-[22px] md:h-[22px]" />
          <p className="text-sm md:text-base">{label}</p>
        </div>
      </button>
    );
  }
  return null;
}
