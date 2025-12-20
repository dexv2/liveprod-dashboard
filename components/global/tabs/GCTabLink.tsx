"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

export default function GCTabLInk(props: Readonly<{
  links: string[];
  labels: string[];
  name?: string[];
  isSinglePath?: boolean;
  path?: string
}>) {
  const { links, labels, isSinglePath = false } = props;
  const params = useParams<{role1: string, service: string, segment: string}>();
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
    const isActive = name === params?.service || name === service || currentPath.includes(`/${name}`);

    if (isActive) {
      return "bg-slate-800";
    } else {
      return "bg-slate-500 bg-opacity-50";
    }
  }

  return (
    <div className="flex gap-px border rounded-xl border-slate-500">
      {links.map((link, index) => (
        <Link
          key={index}
          href={link}
          className={`text-white py-1 w-36 text-center first:rounded-s-xl last:rounded-e-xl ${isSinglePath ? getBackgroundByName(props?.name?.[index]) : getBackgroundByNumber(index + 1)}`}
        >
          {labels[index]}
        </Link>
      ))}
    </div>
  )
}
