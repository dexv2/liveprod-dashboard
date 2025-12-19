import GCModal from "@/components/global/GCModal";

export function AssignVolunteerModal(props: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GCModal title="Select Volunteer" childClass="max-h-[550px] max-w-[450px]">
      {props.children}
    </GCModal>
  );
}
