import CCVolunteerProfile from "@/components/client/CCVolunteerProfile";
import { getVolunteerById } from "@/utils/apis/get";
import { checkAuth, checkAdminAuth } from "@/utils/helpersServer";
import { redirect } from "next/navigation";

export default async function SCVolunteerProfile({ id }: { id: string }) {
  try {
    const isAuthenticated = await checkAuth();
    const isAdmin = await checkAdminAuth();

    // Add timestamp to force fresh data fetch
    const res = await getVolunteerById(id);
    const volunteer = res.data;

    // Debug logging
    console.log('Volunteer schedules:', volunteer.schedules);
    console.log('Schedule services:', volunteer.schedules?.map((s: any) => s.service));

    // Allow access to volunteer profile even without authentication
    // This enables volunteer ID lookup functionality
    return (
      <CCVolunteerProfile volunteer={volunteer} isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
    )
  } catch (error) {
    redirect("/volunteer/all");
  }
}

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';
