import { signIn } from "@/auth";
import CCLogin from "@/components/client/CCLogin";
import { checkAuth } from "@/utils/helpersServer";
import { redirect } from "next/navigation";

export default async function SCLogin({errorAttempt}: {errorAttempt: number}) {
  const isAuthenticated = await checkAuth();
  if (isAuthenticated) redirect("/");

  const handleFormAction = async (username: FormDataEntryValue | null, password: FormDataEntryValue | null) => {
    "use server";

    try {
      await signIn("credentials", { username, password, redirectTo: "/" });
    } catch (error: any) {
      if (error.message === "NEXT_REDIRECT") redirect("/");
      redirect(`/login?error=${errorAttempt + 1}`);
    }
  }

  return (
    <CCLogin error={errorAttempt} login={handleFormAction} />
  );
}
