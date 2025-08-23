"use client";

import { putScheduleAssign, putScheduleRemoveAssignee, putUpdateVolunteer } from '@/utils/apis/put';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react'
import GCLoading from "@/components/global/GCLoading";
import { IoPersonRemove, IoPersonCircleOutline } from "react-icons/io5";
import { PiLegoSmiley, PiLegoSmileyDuotone } from 'react-icons/pi';
import { formatDate } from '@/utils/helpers';
import { Tooltip } from 'react-tooltip';
import GCInputSearch from "@/components/global/GCInputSearch";
import { serviceCode, serviceCodeToTime } from '@/utils/constants';

interface Volunteer {
  _id: string
  name: string
  available: boolean
  message: string
  prevSchedId: string
  role: string
  roles: string[]
}

interface Schedule {
  _id: string
  volunteer: string
  role: string
  service: string
  date: string
}

interface SchedulesGrouped {
  am: string[]
  pm: string[]
  sns: string[]
}

enum Availability {
  SingleService = "singleService",
  AM = "am",
  PM = "pm",
  WholeDay = "wholeDay",
  WholeSNS = "wholeSNS"
}

export default function CCAssignVolunteer(
  {
    volunteers,
    schedule,
    schedulesGrouped
  }:
  {
    volunteers: Volunteer[],
    schedule: Schedule,
    schedulesGrouped: SchedulesGrouped
  }) {
  const [query, setQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [availability, setAvailability] = useState<Availability>(Availability.SingleService);
  const router = useRouter();

  useEffect(() => {
    if (schedule.service === serviceCode.SUNDAY_1) {
      setAvailability(Availability.AM)
    } else if (schedule.service === serviceCode.SUNDAY_3) {
      setAvailability(Availability.PM)
    } else if (schedule.service === serviceCode.SNS_1) {
      setAvailability(Availability.WholeSNS)
    }
  },[schedule.service])

  const sortedVolunteers = volunteers
    .sort((person) => person.role ? -1 : 1)
    .map((person) => {
      return {
        ...person,
        role: person.role === schedule.role ? "Assigned Volunteer" : person.role
    }});

  const filteredPeople =
    query === ''
      ? sortedVolunteers
      : sortedVolunteers.filter((person) => {
          return person.name.toLowerCase().includes(query.toLowerCase());
        });

  const closeModal = () => {
    router.back();
  }

  const assignScheduleAndRoleToVolunteer = async (volunteer: Volunteer) => {
    if (availability === Availability.AM) {
      for (const scheduleId of schedulesGrouped.am) {
        await putScheduleAssign(scheduleId, volunteer._id);
      }
    } else if (availability === Availability.PM) {
      for (const scheduleId of schedulesGrouped.pm) {
        await putScheduleAssign(scheduleId, volunteer._id);
      }
    } else if (availability === Availability.WholeDay) {
      for (const scheduleId of schedulesGrouped.am.concat(schedulesGrouped.pm)) {
        await putScheduleAssign(scheduleId, volunteer._id);
      }
    } else if (availability === Availability.WholeSNS) {
      for (const scheduleId of schedulesGrouped.sns) {
        await putScheduleAssign(scheduleId, volunteer._id);
      }
    } else {
      await putScheduleAssign(schedule._id, volunteer._id);
    }

    if (volunteer.roles?.includes(schedule.role)) return
    await putUpdateVolunteer(volunteer._id, {
      roles: [...volunteer.roles, schedule.role],
    })
  }

  const setScheduleToVolunteer = async (volunteer: Volunteer) => {
    setIsLoading(true);
    await assignScheduleAndRoleToVolunteer(volunteer);
    closeModal();
  }

  const removeAssignee = async () => {
    setIsLoading(true);
    await putScheduleRemoveAssignee(schedule._id);
    closeModal();
  }

  const overrideSchedule = async (volunteer: Volunteer, prevSchedId: string) => {
    setIsLoading(true);
    await assignScheduleAndRoleToVolunteer(volunteer);
    await putScheduleRemoveAssignee(prevSchedId);
    closeModal();
  }

  const validateAssigneeSchedule = (volunteer: Volunteer) => {
    if (volunteer.available) {
      setScheduleToVolunteer(volunteer);
    } else if(volunteer.role === "Assigned Volunteer") {
      return;
    } else {
      const override = confirm(volunteer.message);

      if (!override) return;
      overrideSchedule(volunteer, volunteer.prevSchedId)
    }
  }

  const updateAvailability = (value: Availability) => {
    if (value === availability) {
      return setAvailability(Availability.SingleService)
    }
    setAvailability(value)
  }

  if (isLoading) return <GCLoading />
  return (
    <Fragment>
      <div className="w-full px-3 pt-3 pb-3">
        <div className="flex justify-center text-small gap-1 pb-3 text-slate-600">
          <CAvailability
            currentService={schedule.service}
            targetService={serviceCode.SUNDAY_1}
            current={availability}
            value={Availability.AM}
            label='AM'
            onClick={() => updateAvailability(Availability.AM)}
          />
          <CAvailability
            currentService={schedule.service}
            targetService={serviceCode.SUNDAY_3}
            current={availability}
            value={Availability.PM}
            label='PM'
            onClick={() => updateAvailability(Availability.PM)}
          />
          <CAvailability
            currentService={schedule.service}
            targetService={serviceCode.SUNDAY_1}
            current={availability}
            value={Availability.WholeDay}
            label='AM/PM'
            onClick={() => updateAvailability(Availability.WholeDay)}
          />
          <CAvailability
            currentService={schedule.service}
            targetService={serviceCode.SNS_1}
            current={availability}
            value={Availability.WholeSNS}
            label='Whole SNS'
            onClick={() => updateAvailability(Availability.WholeSNS)}
          />
        </div>
        <div className="flex justify-center text-small gap-1 pb-3 uppercase text-slate-600">
          <div>{formatDate(schedule.date)}</div>
          <PiLegoSmiley size={24} />
          <div>{serviceCodeToTime[schedule.service]}</div>
          <PiLegoSmileyDuotone size={24} />
          <div id='volunteer-role' className='max-w-1/3 whitespace-nowrap overflow-hidden text-ellipsis'>{schedule.role}</div>
        </div>
        <div className="flex justify-between gap-2">
          <GCInputSearch onChange={(event) => setQuery(event.target.value)} autofocus />
          { schedule?.volunteer &&
            <button
              id="remove-assignee"
              className="bg-slate-200 py-1 px-2 rounded-xl text-black h-10"
              onClick={() => {removeAssignee()}}
            >
              <IoPersonRemove size={24} className="text-rose-600" />
            </button>
          }
        </div>
        <div className="bg-slate-200 h-px mt-6" />
        <div className="">
          <div className="overflow-scroll h-72 py-1 no-scrollbar">
            {filteredPeople.map((volunteer) => (
              <div
                key={volunteer._id}
                onClick={() => validateAssigneeSchedule(volunteer)}
                className={`flex justify-between px-2 py-1.5 cursor-pointer hover:bg-slate-200 ${volunteer.available ? "text-slate-700" : "text-rose-600"}`}
              >
                <div className="flex justify-start gap-2">
                  <IoPersonCircleOutline size={24} />
                  <div>{volunteer.name}</div>
                </div>
                { volunteer.role &&
                  <div className="flex flex-col justify-center border border-sky-600 bg-sky-50 px-1 rounded-md">
                    <p className="uppercase text-xs text-sky-600">{volunteer.role.replace(/\d+/g, "")}</p>
                  </div>
                }
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-200 h-px" />
      </div>
      <Tooltip variant="error" anchorSelect="#remove-assignee" place="top-start">Remove assignee</Tooltip>
      <Tooltip anchorSelect="#volunteer-role" className='uppercase'>{schedule.role}</Tooltip>
    </Fragment>
  )
}

function CAvailability({ currentService, targetService, current, value, label, onClick }: { currentService: string, targetService: string, current: Availability, value: Availability, label: string, onClick: () => void }): JSX.Element {
  return <div onClick={onClick} className={`${currentService !== targetService && 'hidden'} ${current === value && 'bg-sky-600 text-white'} cursor-pointer px-2 border border-sky-600 rounded-lg`}>{label}</div>
}
