import GCLoading from "@/components/global/GCLoading";
import SCScheduleBySegment from "@/components/server/SCScheduleBySegment";
import { Suspense } from "react";

export default async function ScheduleBySegment({searchParams, params}: {searchParams: {increment: string}, params: {service: string}}) {
  const increment = parseInt(searchParams?.increment || "0");

  return (
    <Suspense fallback={<GCLoading />}>
      <SCScheduleBySegment increment={increment} service={params.service} />
    </Suspense>
  )
}
