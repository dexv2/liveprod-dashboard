import { checkAuth } from "@/utils/helpersServer";
import CCVolunteerCell from "@/components/client/CCVolunteerCell";

export default async function SCVolunteerCell(props: { service: any }) {
  const isAuthenticated = await checkAuth();

  return <CCVolunteerCell service={props.service} isAuthenticated={isAuthenticated} />;
}
