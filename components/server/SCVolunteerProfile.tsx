import CCVolunteerProfile from "@/components/client/CCVolunteerProfile";
import { getVolunteerById } from "@/utils/apis/get";
import { redirect } from "next/navigation";

export default async function SCVolunteerProfile({ id }: { id: string }) {
  try {
    // Add timestamp to force fresh data fetch
    const res = await getVolunteerById(id);
    const volunteer = res.data;

    // Allow access to volunteer profile even without authentication
    // This enables volunteer ID lookup functionality
    return (
      <CCVolunteerProfile volunteer={volunteer} />
    )
  } catch (error) {
    redirect("/volunteer/all");
  }
}

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
