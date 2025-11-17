import { SOURCE_URL } from '@/utils/apis/source';
import { redirect } from "next/navigation";

async function getVolunteerByVolunteerId(volunteerId: string) {
  try {
    const response = await fetch(`${SOURCE_URL}/api/volunteers/by-id/${volunteerId}`, {
      cache: "no-store"
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    return null;
  }
}

export default async function VolunteerByIdPage({ params }: { params: { volunteerId: string } }) {
  const result = await getVolunteerByVolunteerId(params.volunteerId);
  
  if (!result || !result.data) {
    console.log('Volunteer not found:', params.volunteerId);
    redirect("/volunteer/all");
  }
  
  console.log('Redirecting to profile:', result.data._id);
  // Redirect to the regular profile page using the MongoDB _id
  redirect(`/volunteer/profile/${result.data._id}`);
}