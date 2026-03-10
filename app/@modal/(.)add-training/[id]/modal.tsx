import GCModal from "@/components/global/GCModal";

export function AddTrainingModal(props: Readonly<{
  children: React.ReactNode;
  id: string;
}>) {
  return (
    <GCModal title={props.id === "new" ? "Add New Training" : "Edit Training"} childClass="max-w-4xl">
      {props.children}
    </GCModal>
  );
}
