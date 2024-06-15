import { AssignVolunteerModal } from "./modal";
import { Suspense } from "react";
import GCLoading from "@/components/global/GCLoading";
import SCAssignVolunteer from "@/components/server/SCAssignVolunteer";

export default function AssignVolunteer({ params }: { params: { id: string }}) {
  return (
    <AssignVolunteerModal>
      <Suspense fallback={<GCLoading />}>
        <SCAssignVolunteer id={params.id} />
      </Suspense>
    </AssignVolunteerModal>
  );
}
