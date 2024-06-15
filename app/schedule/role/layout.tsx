"use client";

import CCAddRow from "@/components/client/CCAddRow";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Fragment } from "react";

export default function RootLayout(props: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  let numRoles = 1;

  if (params?.role3) {
    numRoles = 3;
  } else if (params?.role2) {
    numRoles = 2;
  }

  const getBackground = (roleNum: number) => {
    if (roleNum === numRoles) {
      return "bg-slate-700";
    } else {
      return "bg-slate-500";
    }
  }

  return (
    <Fragment>
      <div className="flex w-fit gap-px">
        <Link className={`text-white p-2 rounded-ss-md ${getBackground(1)}`} href="/schedule/role/foh">Single View</Link>
        <Link className={`text-white p-2 ${getBackground(2)}`} href="/schedule/role/foh/foh%20assistant">Split View</Link>
        <Link className={`text-white p-2 rounded-se-md ${getBackground(3)}`} href="/schedule/role/foh/foh%20assistant/broadcast%20mix">Triple View</Link>
      </div>
      {props.children}
      <CCAddRow />
    </Fragment>
  )
}
