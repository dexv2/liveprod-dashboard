import { AddEventModal } from "./modal";
import SCAddEvent from "@/components/server/SCAddEvent";

export default function AddEvent({ params }: { params: { id: string }}) {
  return (
    <AddEventModal id={params.id}>
        <SCAddEvent id={params.id} />
    </AddEventModal>
  );
}
