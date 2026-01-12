"use client";

import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";

export default function GCTabLInk(props: Readonly<{
  queryParams: string[];
  labels: string[];
  name?: string[];
  isSinglePath?: boolean;
  path?: string
}>) {
  const { queryParams, labels, isSinglePath = false } = props;
  const params = useParams<{role1: string, service: string, segment: string}>();
  const pathname = usePathname();
  const service = useSearchParams()?.get('service') || 'regular';
  let numPaths = 1;

  const getBackgroundByNumber = (pathNum: number) => {
    if (pathNum === numPaths) {
      return "bg-slate-800";
    } else {
      return "bg-slate-500";
    }
  }

  const getBackgroundByName = (name?: string) => {
    // Check both service and the last part of the URL path
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isActive = name === params?.service || name === service || currentPath.includes(`${pathname}/${name}`);

    if (isActive) {
      return "bg-slate-800";
    } else {
      return "bg-slate-500 bg-opacity-50";
    }
  }

  return (
    <div className="flex gap-px border rounded-xl border-slate-500">
      {queryParams.map((queryParam, index) => (
        <Link
          key={index}
          href={`${pathname}${queryParam}`}
          className={`flex justify-center items-center py-1 w-36 text-center first:rounded-s-xl last:rounded-e-xl ${isSinglePath ? getBackgroundByName(props?.name?.[index]) : getBackgroundByNumber(index + 1)}`}
        >
          <p className='text-white'>{labels[index]}</p>
        </Link>
      ))}
    </div>
  )
}
