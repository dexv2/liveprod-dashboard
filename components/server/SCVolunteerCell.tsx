import { checkAuth } from "@/utils/helpers";
import VolunteerCell from "@/components/client/CCVolunteerCell";

export default async function SCVolunteerCell(props: { service: any }) {
  const isAuthenticated = await checkAuth();

  return <VolunteerCell service={props.service} isAuthenticated={isAuthenticated} />;
}
