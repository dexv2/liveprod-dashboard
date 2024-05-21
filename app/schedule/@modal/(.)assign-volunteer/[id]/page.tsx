import AssignVolunteer from "@/components/AssignVolunteer";
import { AssignVolunteerModal as Modal } from "./modal";
import { NextPageContext } from "next";

// AssignVolunteer.getInitialProps = async (ctx: NextPageContext) => {
//   return {test: "test"};
// }

export default function Page({ params }: { params: { id: string }}) {
  return (
    <Modal>
      <AssignVolunteer scheduleId={params.id} />
    </Modal>
  );
}
