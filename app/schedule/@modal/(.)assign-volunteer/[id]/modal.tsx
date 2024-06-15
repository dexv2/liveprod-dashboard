import GCModal from "@/components/global/GCModal";

export function AssignVolunteerModal(props: Readonly<{
  children: React.ReactNode;
}>) {
  return <GCModal title="Select Volunteer" maxHeight="max-h-[550px]">
    {props.children}
  </GCModal>
}
