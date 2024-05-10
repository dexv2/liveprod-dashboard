import { Modal } from "@/components/Modal";

export function AssignVolunteerModal(props: Readonly<{
  children: React.ReactNode;
}>) {
  return <Modal title="Select a Volunteer">
    {props.children}
  </Modal>
}
