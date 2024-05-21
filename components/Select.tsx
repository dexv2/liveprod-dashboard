"use client";

import { putScheduleAssign, putScheduleRemoveAssignee } from '@/utils/apis/put';
import { useRouter } from 'next/navigation';
import { useState } from 'react'

interface Volunteer {
  _id: string
  name: string
  available: boolean
  message: string
}

interface Schedule {
  _id: string
  volunteer: string
}

export default function Select({ volunteers, schedule }: {volunteers: Volunteer[], schedule: Schedule}) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const filteredPeople =
    query === ''
      ? volunteers
      : volunteers.filter((person) => {
          return person.name.toLowerCase().includes(query.toLowerCase());
        });

  const closeModal = () => {
    router.back();
  }

  const setScheduleToVolunteer = async (volunteerId: string) => {
    await putScheduleAssign(schedule._id, volunteerId);
    closeModal();
  }

  const removeAssignee = async () => {
    await putScheduleRemoveAssignee(schedule._id);
    closeModal();
  }

  const validateAssigneeSchedule = (volunteer: Volunteer) => {
    if (volunteer.available) {
      setScheduleToVolunteer(volunteer._id)
    } else {
      alert(volunteer.message)
    }
  }

  return (
    <div className="flex justify-between align-start gap-5">
      <div>
        <input className="border border-slate-300 rounded-md p-1 focus:outline-none w-full" onChange={(event) => setQuery(event.target.value)} />
        <div className="max-h-52 overflow-scroll">
          {filteredPeople.map((volunteer) => (
            <div
              key={volunteer._id}
              className={`cursor-pointer hover:bg-slate-200 ${!volunteer.available && "text-rose-600"}`}
              onClick={() => validateAssigneeSchedule(volunteer)}
            >
              {volunteer.name}
            </div>
          ))}
        </div>
      </div>
      { schedule?.volunteer &&
        <div>
          <button
            className="bg-slate-300 py-1 px-2 rounded-md text-black h-fit"
            onClick={() => {removeAssignee()}}
          >
            Remove Assignee
          </button>
        </div>
      }
    </div>
  )
}
