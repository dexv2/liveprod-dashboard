"use client";

import { category } from "@/utils/constants";
import { useParams, useRouter } from "next/navigation";

export default function CCRoleDropdown({role} : {role: string}) {
  const router = useRouter();
  const params = useParams<{role1: string, role2: string, role3: string}>();

  const handleChange = (e: any) => {
    const newRole = encodeURI(e.target.value);
    if (encodeURI(role) === params.role1 && !params?.role2) {
      router.push(`/schedule/role/${newRole}`);
    } else if (encodeURI(role) === params.role1 && !!params?.role2) {
      router.push(`/schedule/role/${newRole}/${params.role2}`);
    } else if (encodeURI(role) === params.role2) {
      router.push(`/schedule/role/${params.role1}/${newRole}`);
    } else if (encodeURI(role) === params.role3) {
      router.push(`/schedule/role/${params.role1}/${params.role2}/${newRole}`);
    }
  }

  return (
    <th colSpan={6}>
      <select defaultValue={role} onChange={handleChange} className="bg-transparent text-slate-200 py-2 uppercase appearance-none text-center cursor-pointer focus:outline-none">
        { category.ROLES.map((r) => (
            <option key={r} value={r} className={Object.values(params).includes(encodeURI(r)) ? "hidden" : ""}>{r}</option>
          ))
        }
      </select>  
    </th>
  )
}
