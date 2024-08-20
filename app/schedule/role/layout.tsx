"use client";

import CCAddRow from "@/components/client/CCAddRow";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { HiMiniArrowsRightLeft } from "react-icons/hi2";
import { Tooltip } from "react-tooltip";

export default function RootLayout(props: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams<{role1: string, role2: string, role3: string}>();
  const router = useRouter();
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

  const switchRole1And2 = () => {
    if (numRoles === 3) {
      router.push(`/schedule/role/${params.role2}/${params.role1}/${params.role3}`);
    } else {
      router.push(`/schedule/role/${params.role2}/${params.role1}`);
    }
  }

  const switchRole2And3 = () => {
    router.push(`/schedule/role/${params.role1}/${params.role3}/${params.role2}`);
  }

  return (
    <div className="mt-10">
      <div className="-mb-9">
        <div className="flex justify-evenly text-slate-700">
          <HiMiniArrowsRightLeft size={20} className={`${numRoles > 1 ? "hidden" : ""} opacity-0`} />
          <HiMiniArrowsRightLeft id="role1And2" onClick={switchRole1And2} size={20} className={`${numRoles < 2 ? "hidden" : ""} cursor-pointer focus:outline-none`} />
          <HiMiniArrowsRightLeft id="role2And3" onClick={switchRole2And3} size={20} className={`${numRoles < 3 ? "hidden" : ""} cursor-pointer focus:outline-none`} />
        </div>
      </div>
      <div className="flex w-fit gap-px">
        <Link className={`text-white p-2 rounded-ss-md ${getBackground(1)}`} href="/schedule/role/foh">Single View</Link>
        <Link className={`text-white p-2 ${getBackground(2)}`} href="/schedule/role/foh/foh%20assistant">Split View</Link>
        <Link className={`text-white p-2 rounded-se-md ${getBackground(3)}`} href="/schedule/role/foh/foh%20assistant/broadcast%20mix">Triple View</Link>
      </div>
      {props.children}
      <CCAddRow />
      <Tooltip variant="dark" anchorSelect="#role1And2" place="top">Switch <span className="uppercase">{decodeURI(params.role1)}</span> and <span className="uppercase">{decodeURI(params.role2)}</span></Tooltip>
      <Tooltip variant="dark" anchorSelect="#role2And3" place="top">Switch <span className="uppercase">{decodeURI(params.role2)}</span> and <span className="uppercase">{decodeURI(params.role3)}</span></Tooltip>
    </div>
  )
}
