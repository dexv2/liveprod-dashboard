"use client";

import CCCalendarSchedule from "@/components/client/CCCalendarSchedule";
import GCInputTextWithLabel from "@/components/global/GCInputTextWithLabel";
import GCSelect from "@/components/global/GCSelect";
import { putUpdateVolunteer } from "@/utils/apis/put";
import { category, serviceTime } from "@/utils/constants";
import { diff } from "@/utils/dates";
import { newDate } from "@/utils/helpers";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GoDotFill } from "react-icons/go";
import { IoCloseCircle, IoPersonCircleSharp, IoSaveSharp } from "react-icons/io5";

interface Volunteer {
  _id: string
  name: string
  firstName: string
  lastName: string
  nickName?: string
  status: string
  segment: string
  schedules: Schedule[]
  roles: string[]
}

interface Schedule {
  _id: string
  role: string
  date: string
  service: string
}

export default function CCVolunteerProfile({ volunteer, isAuthenticated }: { volunteer: Volunteer, isAuthenticated: boolean }) {
  const router = useRouter();
  const [ firstName, setFirstName ] = useState<string>(volunteer.firstName);
  const [ lastName, setLastName ] = useState<string>(volunteer.lastName);
  const [ nickName, setNickName ] = useState<string>(volunteer?.nickName || "");
  const [ segment, setSegment ] = useState<string>(volunteer.segment);
  const [ status, setStatus ] = useState<string>(volunteer.status);
  const [ role, setRole ] = useState<string | undefined>(undefined);
  const [ roles, setRoles ] = useState<string[]>(volunteer.roles);

  const hasChanges = useMemo(() => (
    firstName !== volunteer.firstName ||
    lastName !== volunteer.lastName ||
    nickName !== (volunteer?.nickName || "") ||
    status !== volunteer.status ||
    segment !== volunteer.segment ||
    JSON.stringify(roles) !== JSON.stringify(volunteer.roles)
  ), [
    firstName,
    lastName,
    nickName,
    segment,
    status,
    roles,
    volunteer.firstName,
    volunteer.lastName,
    volunteer.nickName,
    volunteer.segment,
    volunteer.status,
    volunteer.roles
  ]);

  useEffect(() => {
    if (!role) return;
    const rolesSet = new Set(roles.concat(role));
    setRoles(Array.from(rolesSet));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  const resetValues = () => {
    setFirstName(volunteer.firstName)
    setLastName(volunteer.lastName)
    setNickName(volunteer?.nickName || "")
    setStatus(volunteer.status)
    setSegment(volunteer.segment)
  }

  try {
    const updateVolunteerInfo = async () => {
      await putUpdateVolunteer(volunteer._id, { firstName, lastName, nickName, segment, status, roles });
      router.refresh();
    }
    const from = (date: string, service: string): Date => {
      return new Date(`${new Date(date).toLocaleDateString("en-US", {timeZone: "Asia/Manila"})} ${serviceTime[service]}`);
    }
    const to = (from: Date): Date => {
      return new Date(from.setHours(from.getHours() + 2));
    }
    const schedule: any[] = [];
    let lastSchedule = newDate().getTime();

    for (let i = 0; i < volunteer?.schedules?.length; i++) {
      const sched = volunteer.schedules[i];
      const newSchedule = new Date(from(sched.date, sched.service)).getTime();
      if (newSchedule > lastSchedule) {
        lastSchedule = newSchedule;
      }

      schedule.push({
        id: sched._id,
        title: sched.role.toUpperCase(),
        start: from(sched.date, sched.service),
        end: to(from(sched.date, sched.service))
      });
    }

    const length = diff(newDate(), new Date(lastSchedule), "day");
    const statusColor = (status: string) => {
      if (status === "active") return "text-green-600"
      if (status === "trainee") return "text-emerald-600"
      if (status === "observer") return "text-cyan-600"
      if (status === "on leave") return "text-orange-600"
      if (status === "inactive") return "text-red-600"
      return "text-slate-700"
    }
    const getAlias = () => {
      if (volunteer.nickName) return ` "${volunteer.nickName}" `;
      return ` `;
    }

    return (
      <div className="px-32 text-slate-700">
        <div className="flex justify-between pb-7">
          <h1 className="text-2xl">
            Volunteer Profile
          </h1>
          <div className={`flex gap-2 justify-end ${!hasChanges && "hidden"}`}>
            <button onClick={resetValues} className="border border-slate-400 px-3 rounded-md">
              Cancel
            </button>
            <button className="bg-sky-600 text-white pl-3.5 pr-4 rounded-md">
              <div className="flex gap-1.5 justify-center">
                <div className="flex flex-col justify-center">
                  <IoSaveSharp size={17} />
                </div>
                <div onClick={updateVolunteerInfo} className="flex flex-col justify-center">
                  Save
                </div>
              </div>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-7">
          <div className="w-full rounded-lg border border-slate-100 shadow-md">
            <div className="flex justify-start py-5 pl-6 bg-slate-50">
              <h2 className="font-semibold text-lg">
                Basic Info
              </h2>
            </div>
            <div className="bg-slate-300 h-px" />
            <div className="px-5 pb-5 pt-12">
              <div className="flex justify-start gap-3">
                <IoPersonCircleSharp size={100} />
                <div className="flex flex-col px-2 pb-2 pt-4 justify-start">
                  <h2 className="font-semibold text-lg capitalize">
                    {`${volunteer.firstName}${getAlias()}${volunteer.lastName}`}
                  </h2>
                  <div className={`text-sm capitalize flex items-center ${statusColor(volunteer.status)}`}>
                    <GoDotFill />
                    <p>{volunteer.status}</p>
                  </div>
                </div>
              </div>
              <div className="px-3 pt-8 pb-5 text-sm">
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between gap-5">
                    <GCInputTextWithLabel disabled={!isAuthenticated} onChange={(e) => setFirstName(e.target.value)} label="first name" value={firstName} />
                    <GCInputTextWithLabel disabled={!isAuthenticated} onChange={(e) => setLastName(e.target.value)} label="last name" value={lastName} />
                  </div>
                  <div className="flex justify-between gap-5">
                    <div className="flex flex-col justify-start gap-5 w-full">
                      <div className="flex justify-between gap-5 w-full">
                        <GCSelect disabled={!isAuthenticated} onChange={(e) => setSegment(e.target.value)} label="segment" value={segment} options={category.SEGMENTS} />
                        <GCSelect disabled={!isAuthenticated} onChange={(e) => setStatus(e.target.value)} label="status" value={status} options={category.STATUS} />
                      </div>
                      <div className="flex justify-between gap-5 w-full">
                        <GCInputTextWithLabel disabled={!isAuthenticated} onChange={(e) => setNickName(e.target.value)} label="nickname" value={nickName} />
                        <GCInputTextWithLabel disabled label="id" value={volunteer._id} />
                      </div>
                    </div>
                    <div className="flex flex-col justify-between gap-0 w-full">
                      <GCSelect disabled={!isAuthenticated} onChange={(e) => setRole(e.target.value)} label="roles assigned" value={role} options={category.ROLES} uppercase />
                      <div className="flex flex-col gap-0.5 w-full">
                        <div className="bg-zinc-50 p-3 border border-slate-100 rounded-b-sm min-h-24">
                          <div className="flex flex-wrap justify-start gap-2 break-normal">
                            { roles.map((volunteerRole, i) => (
                                <div key={i} className="uppercase border border-slate-500 py-1.5 px-3 rounded-full">
                                  <div className="flex gap-0">
                                    {/* Non-breakable space is char 160 */}
                                    <div>{volunteerRole.replaceAll(" ", String.fromCharCode(160))}</div>
                                    <div className="relative">
                                      {isAuthenticated && 
                                        <div className="absolute -top-3 left-0 opacity-0 hover:opacity-100">
                                          <IoCloseCircle size={20} className="cursor-pointer" onClick={() => setRoles(roles.filter(r => r != volunteerRole))} />
                                        </div>
                                      }
                                    </div>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full rounded-lg border border-slate-100 shadow-md">
            <div className="flex justify-start py-5 pl-6 bg-slate-50">
              <h2 className="font-semibold text-lg">
                Schedule
              </h2>
            </div>
            <div className="bg-slate-300 h-px" />
            <div className="px-5 pb-5 pt-14">
              <CCCalendarSchedule events={schedule} length={length} />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    redirect("/");
  }
}
