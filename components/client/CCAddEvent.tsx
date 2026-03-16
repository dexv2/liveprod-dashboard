"use client";

import GCInputTextWithLabel from "@/components/global/GCInputTextWithLabel";
import GCSelect from "@/components/global/GCSelect";
import { postAddEvent } from '@/utils/apis/post';
import { putUpdateEvent } from '@/utils/apis/put';
import { formatDateISO } from '@/utils/helpers';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import GCLoading from '../global/GCLoading';
import { category, VENUES } from '@/utils/constants';

interface Event {
  _id?: string;
  status: string;
  date: string;
  day: string;
  eventName: string;
  venue: string;
  callTime: string;
  startTime: string;
  endTime: string;
  praiseAndWorship: string;
  otherDetails: string;
  volunteersNeeded: {
    foh: boolean;
    assistantFoh: boolean;
    bcMix: boolean;
    assistantBcMix: boolean;
    monMix: boolean;
    rfTech: boolean;
  };
  assignedVolunteers?: {
    foh?: string;
    assistantFoh?: string;
    bcMix?: string;
    assistantBcMix?: string;
    monMix?: string;
    rfTech?: string;
  };
}

interface Volunteer {
  _id: string;
  name: string;
  roles: string[];
}

export default function CCAddEvent({ volunteers, event: propEvent }: { volunteers: Volunteer[], event: Event | null }) {
  const [event, setEvent] = useState<Event>({
    status: "confirmed",
    date: "",
    day: "",
    eventName: "",
    venue: "",
    callTime: "",
    startTime: "",
    endTime: "",
    praiseAndWorship: "TBC",
    otherDetails: "",
    volunteersNeeded: {
      foh: false,
      assistantFoh: false,
      bcMix: false,
      assistantBcMix: false,
      monMix: false,
      rfTech: false
    }
  });
  const [selectedVolunteers, setSelectedVolunteers] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (propEvent) {
      setEvent(propEvent);
      setSelectedVolunteers(propEvent.assignedVolunteers || {});
    }
  }, [propEvent]);

  const handleDateChange = (date: string) => {
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    setEvent({ ...event, date, day: dayName });
  };

  const getVolunteersForRole = (role: string) => {
    const roleMap: { [key: string]: string[] } = {
      foh: ['foh', 'foh assistant', 'foh trainee', 'foh assistant trainee', 'foh observer'],
      assistantFoh: ['foh assistant', 'foh assistant trainee'],
      bcMix: ['broadcast mix', 'broadcast mix assistant', 'broadcast mix trainee', 'broadcast mix assistant trainee', 'broadcast mix observer'],
      assistantBcMix: ['broadcast mix assistant', 'broadcast mix assistant trainee'],
      monMix: ['monitor mix', 'monitor mix trainee', 'monitor mix observer'],
      rfTech: ['rf tech']
    };
    
    const relevantRoles = roleMap[role] || [];
    return volunteers
      .filter(volunteer => 
        volunteer.roles.some(volunteerRole =>
          relevantRoles.includes(volunteerRole.toLowerCase()))
      ).sort((a, b) => a.name.localeCompare(b.name));
  };

  const handleVolunteerSelection = (role: string, volunteerId: string) => {
    setSelectedVolunteers(prev => ({
      ...prev,
      [role]: volunteerId
    }));
  };

  const closeModal = () => {
    router.back();
  }

  const getEventData = () => {
    return {
      ...event,
      assignedVolunteers: selectedVolunteers
    };
  }

  const handleSubmit = async () => {
    const eventData = getEventData();
    if (!eventData.date || !eventData.day) {
      return toast.error("Please select a date for the event");
    } else if (!eventData.eventName) {
      return toast.error("Please enter an event name");
    } else if (!eventData.status) {
      return toast.error("Please select a status for the event");
    }

    setIsLoading(true);
    await postAddEvent(eventData);
    setIsLoading(false);
    toast.success("Event added successfully!");
    closeModal();
  };

  const updateEvent = async (eventId: string) => {
    const eventData = getEventData();
    await putUpdateEvent(eventId, eventData);
    closeModal();
  }

  return (
    <div className="p-4 bg-slate-50 border-b">
      {isLoading && <GCLoading />}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <GCSelect 
          label="Status" 
          value={event.status} 
          onChange={(e) => setEvent({...event, status: e.target.value})}
          options={["confirmed", "tentative", "cancelled"]}
        />
        <GCInputTextWithLabel 
          required
          label="Date" 
          type="date"
          value={formatDateISO(event.date)}
          onChange={(e) => handleDateChange(e.target.value)}
        />
        <GCInputTextWithLabel 
          required
          label="Event Name" 
          value={event.eventName} 
          onChange={(e) => setEvent({...event, eventName: e.target.value})}
        />
        <GCSelect 
          required
          label="Venue" 
          value={event.venue} 
          onChange={(e) => setEvent({...event, venue: e.target.value})}
          options={VENUES}
        />
        <GCInputTextWithLabel
          required
          label="Call Time"
          type="time"
          value={event.callTime || ""}
          onChange={(e) => setEvent({...event, callTime: e.target.value})}
        />
        <GCInputTextWithLabel
          required
          label="Start Time"
          type="time"
          value={event.startTime || ""}
          onChange={(e) => setEvent({...event, startTime: e.target.value})}
        />
        <GCInputTextWithLabel
          required
          label="End Time"
          type="time"
          value={event.endTime || ""}
          onChange={(e) => setEvent({...event, endTime: e.target.value})}
        />
        <GCSelect 
          label="Praise and Worship" 
          value={event.praiseAndWorship} 
          onChange={(e) => setEvent({...event, praiseAndWorship: e.target.value})}
          options={category.CONFIRMATION}
        />
      </div>
      
      <div className="mb-4">
        <GCInputTextWithLabel 
          label="Other Details" 
          value={event.otherDetails} 
          onChange={(e) => setEvent({...event, otherDetails: e.target.value})}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Assign Volunteers:</label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'foh', label: 'FOH' },
            { key: 'assistantFoh', label: 'Assistant FOH' },
            { key: 'bcMix', label: 'BC Mix' },
            { key: 'assistantBcMix', label: 'Assistant BC Mix' },
            { key: 'monMix', label: 'Mon Mix' },
            { key: 'rfTech', label: 'RF Tech' }
          ].map(({ key, label }) => {
            const availableVolunteers = getVolunteersForRole(key);
            return (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-sm font-medium">{label}:</label>
                <select 
                  className="p-2 border border-gray-300 rounded"
                  value={selectedVolunteers[key] || ''}
                  onChange={(e) => {
                    const volunteerId = e.target.value;
                    handleVolunteerSelection(key, volunteerId);
                    setEvent({
                      ...event,
                      volunteersNeeded: {
                        ...event.volunteersNeeded,
                        [key]: volunteerId !== "N/A" && !!volunteerId
                      }
                    });
                  }}
                >
                  <option value="">-</option>
                  <option value="N/A">N/A</option>
                  <option value="TBC">TBC</option>
                  {availableVolunteers.map(volunteer => (
                    <option key={volunteer._id} value={volunteer._id}>
                      {volunteer.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      <div className=''>
        {event?._id ? (
          <button 
            onClick={() => updateEvent(event._id as string)}
            className='text-white px-4 py-1.5 bg-slate-700 rounded-md'
          >
            Save Changes
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className='text-white px-4 py-1.5 bg-slate-700 rounded-md'
          >
            Add Event
          </button>
        )}
      </div>
    </div>
  );
}
