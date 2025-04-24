"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function GCTabLInk(props: Readonly<{
  links: string[];
  labels: string[];
  name?: string[];
  isSinglePath?: boolean;
  path?: string
}>) {
  const { links, labels, isSinglePath = false } = props;
  const params = useParams<{role1: string, service: string}>();
  let numPaths = 1;

  const getBackgroundByNumber = (pathNum: number) => {
    if (pathNum === numPaths) {
      return "bg-slate-800";
    } else {
      return "bg-slate-500";
    }
  }

  const getBackgroundByName = (name?: string) => {
    if (name === params?.service) {
      return "bg-slate-700";
    } else {
      return "bg-slate-400";
    }
  }

  return (
    <div className="flex gap-px">
      {links.map((link, index) => (
        <Link
          key={index}
          href={link}
          className={`text-white py-1 w-28 text-center first:rounded-s-xl last:rounded-e-xl ${isSinglePath ? getBackgroundByName(props?.name?.[index]) : getBackgroundByNumber(index + 1)}`}
        >
          {labels[index]}
        </Link>
      ))}
    </div>
  )
}
