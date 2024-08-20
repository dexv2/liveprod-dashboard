import { auth } from "@/auth";

export async function checkAuth() {
  const session = await auth();
  const authenticated = !!session?.user;
  return authenticated;
}
