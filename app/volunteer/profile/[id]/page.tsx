import GCLoading from "@/components/global/GCLoading";
import SCVolunteerProfile from "@/components/server/SCVolunteerProfile";
import { Suspense } from "react";

export default function VolunteerProfile({ params }: { params: { id: string }}) {
  return (
    <Suspense fallback={<GCLoading />}>
      <SCVolunteerProfile id={params.id} />
    </Suspense>
  )
}
