"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BsArrowRightCircle } from 'react-icons/bs';

export default function GCArrowNext({ label, type, queryParams, disabled, handleNextPage, isSticky }: { label: string, type: string, queryParams?: string, disabled?: boolean, handleNextPage?: () => void, isSticky?: boolean }) {
  const pathname = usePathname();
  const isWhite = !pathname.includes('schedule');

  if (type === 'link') {
    return (
      <Link href={`${pathname}${queryParams}`}>
        <div className={`${isWhite || isSticky ? 'text-slate-200' : 'text-slate-600'} hover:underline flex gap-1 md:gap-2 items-center h-fit`}>
          <p className="text-sm md:text-base">{label}</p>
          <BsArrowRightCircle size={18} className="md:w-[22px] md:h-[22px]" />
        </div>
      </Link>
    );
  }
  if (type === 'button') {
    return (
      <button disabled={disabled} onClick={handleNextPage}>
        <div className={`${isWhite ? 'text-slate-200' : 'text-slate-600'} hover:underline flex gap-1 md:gap-2 items-center`}>
          <p className="text-sm md:text-base">{label}</p>
          <BsArrowRightCircle size={18} className="md:w-[22px] md:h-[22px]" />
        </div>
      </button>
    );
  }
  return null;
}
