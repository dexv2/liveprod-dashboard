import CCLogin from "@/components/client/CCLogin";
import { checkAuth } from "@/utils/helpersServer";
import { redirect } from "next/navigation";

export default async function SCLogin({errorAttempt}: {errorAttempt: number}) {
  const isAuthenticated = await checkAuth();
  if (isAuthenticated) redirect("/");

  return (
    <CCLogin error={errorAttempt} />
  );
}
