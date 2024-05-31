"use client";

import { putScheduleAssign, putScheduleRemoveAssignee } from '@/utils/apis/put';
import { useRouter } from 'next/navigation';
import { useState } from 'react'
import LoadingComponent from './Loading';
import { CiSearch } from "react-icons/ci";
import { IoPersonRemove, IoPersonCircleOutline } from "react-icons/io5";
import { PiLegoSmiley, PiLegoSmileyDuotone } from 'react-icons/pi';
import { formatDate } from '@/utils/helpers';

interface Volunteer {
  _id: string
  name: string
  available: boolean
  message: string
  prevSchedId: string
  role: string
}

interface Schedule {
  _id: string
  volunteer: string
  role: string
  service: string
  date: string
}

export default function Select({ volunteers, schedule }: {volunteers: Volunteer[], schedule: Schedule}) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const sortedVolunteers = volunteers
    .sort((person) => person.role ? -1 : 1)
    .map((person) => ({
        ...person,
        role: person.role === schedule.role ? "Assigned Volunteer" : person.role
    }));

  const filteredPeople =
    query === ''
      ? sortedVolunteers
      : sortedVolunteers.filter((person) => {
          return person.name.toLowerCase().includes(query.toLowerCase());
        });

  const closeModal = () => {
    router.back();
  }

  const setScheduleToVolunteer = async (volunteerId: string) => {
    setIsLoading(true);
    await putScheduleAssign(schedule._id, volunteerId);
    closeModal();
  }

  const removeAssignee = async () => {
    setIsLoading(true);
    await putScheduleRemoveAssignee(schedule._id);
    closeModal();
  }

  const overrideSchedule = async (volunteerId: string, prevSchedId: string) => {
    setIsLoading(true);
    await putScheduleAssign(schedule._id, volunteerId);
    await putScheduleRemoveAssignee(prevSchedId);
    closeModal();
  }

  const validateAssigneeSchedule = (volunteer: Volunteer) => {
    if (volunteer.available) {
      setScheduleToVolunteer(volunteer._id);
    } else {
      const override = confirm(volunteer.message);

      if (!override) return;
      overrideSchedule(volunteer._id, volunteer.prevSchedId)
    }
  }

  if (isLoading) return <LoadingComponent />
  return (
    <div className="w-full px-3">
      <div className="flex justify-center text-small gap-1 pb-3 uppercase text-slate-600">
        <div>{formatDate(schedule.date)}</div>
        <PiLegoSmiley size={24} />
        <div>{schedule.service}</div>
        <PiLegoSmileyDuotone size={24} />
        <div>{schedule.role}</div>
      </div>
      <div className="flex justify-between gap-2">
        <label htmlFor="search" className="relative text-gray-400 focus-within:text-gray-600 block w-full">
          <CiSearch size={24} className="pointer-events-none absolute top-1/2 transform -translate-y-1/2 left-3" />
          <input placeholder="Search volunteer name..." type="search" className="border border-slate-400 bg-slate-50 rounded-xl pl-10 pr-2 focus:outline-none w-full h-10" onChange={(event) => setQuery(event.target.value)} />
        </label>
        { schedule?.volunteer &&
          <button
            className="bg-slate-200 py-1 px-2 rounded-xl text-black h-10"
            onClick={() => {removeAssignee()}}
          >
            <IoPersonRemove size={24} className="text-rose-600" />
          </button>
        }
      </div>
      <div className="bg-slate-200 h-px mt-6" />
      <div className="">
        <div className="overflow-scroll h-80 py-1">
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
                  <p className="uppercase text-xs text-sky-600">{volunteer.role}</p>
                </div>
              }
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-200 h-px" />
    </div>
  )
}
