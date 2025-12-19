import GCModal from "@/components/global/GCModal";

export function AddVolunteerModal(props: Readonly<{
  children: React.ReactNode;
}>) {
  return <GCModal title="Add Volunteer" childClass="max-h-[450px]">
    {props.children}
  </GCModal>
}
