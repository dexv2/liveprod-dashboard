import CCVolunteerProfile from "@/components/client/CCVolunteerProfile";
import { getVolunteerById } from "@/utils/apis/get";
import { checkAuth } from "@/utils/helpers";
import { redirect } from "next/navigation";

export default async function SCVolunteerProfile({ id }: { id: string }) {
  try {
    const isAuthenticated = await checkAuth();

    const res = await getVolunteerById(id);
    const volunteer = res.data;

    return (
      <CCVolunteerProfile volunteer={volunteer} isAuthenticated={isAuthenticated} />
    )
  } catch (error) {
    redirect("/");
  }
}
