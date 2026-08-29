import { auth } from "@/auth";
import CCAssignmentResponseQueue from "@/components/client/CCAssignmentResponseQueue";
import { redirect } from "next/navigation";

export default async function AssignmentResponsesPage() {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) redirect("/");
  return <CCAssignmentResponseQueue />;
}
