import GCModal from "@/components/global/GCModal";

export function AddEventModal(props: Readonly<{
  children: React.ReactNode;
  id: string;
}>) {
  return (
    <GCModal title={props.id === "new" ? "Add New Event" : "Edit Event"} childClass="max-w-[750px]">
      {props.children}
    </GCModal>
  );
}
