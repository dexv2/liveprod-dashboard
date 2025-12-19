import { AssignVolunteerModal } from "./modal";
import SCAssignVolunteer from "@/components/server/SCAssignVolunteer";

export default function AssignVolunteer({ params }: { params: { id: string }}) {
  return (
    <AssignVolunteerModal>
        <SCAssignVolunteer id={params.id} />
    </AssignVolunteerModal>
  );
}
