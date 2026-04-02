"use client";

export default function CCRoleDropdown({role} : {role: string}) {
  return (
    <div className="bg-transparent text-slate-200 py-2 uppercase appearance-none text-center focus:outline-none font-medium">{role}</div>
  )
}
