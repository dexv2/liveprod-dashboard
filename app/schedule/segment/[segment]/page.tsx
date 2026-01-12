import GCLoading from "@/components/global/GCLoading";
import SCScheduleBySegment from "@/components/server/SCScheduleBySegment";
import { Suspense } from "react";

export default async function ScheduleBySegment({searchParams}: {searchParams: {increment: string, service: string}}) {
  const increment = parseInt(searchParams?.increment || "0");
  const service = searchParams?.service || "regular";

  return (
    <Suspense fallback={<GCLoading />}>
      <SCScheduleBySegment increment={increment} service={service} />
    </Suspense>
  )
}
