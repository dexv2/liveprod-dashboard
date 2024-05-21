import SchedulesByRole from "@/components/SchedulesByRole";
import { category } from "@/utils/constants";
import { getLinkedList, linkedListGoToData } from "@/utils/helpers";
import Link from "next/link";
import { Fragment } from "react";

export default async function FirstRoleDisplay({ params }: {params: { role1: string }}) {
  let roledetails = getLinkedList(category.ROLES);
  if (roledetails) {
    roledetails = linkedListGoToData(roledetails, decodeURI(params.role1));
  }

  return (
    <Fragment>
      <Link className="text-white p-2 bg-slate-500 rounded-md" href="/schedule/role/foh/foh%20assistant">Split View</Link>
      <div className="flex items-center justify-evenly">
        <Link href={`/schedule/role/${roledetails?.prev?.data}`}>{"<< Prev"}</Link>
        <SchedulesByRole role={decodeURI(params.role1)} />
        <Link href={`/schedule/role/${roledetails?.next?.data}`}>{"Next >>"}</Link>
      </div>
    </Fragment>
  );
}
