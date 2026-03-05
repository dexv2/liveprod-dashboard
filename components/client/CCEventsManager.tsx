"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { putUpdateEvent } from '@/utils/apis/put';
import GCArrowPrev from '../global/GCArrowPrev';
import GCArrowNext from '../global/GCArrowNext';
import { useDevice } from '../../context/DeviceProvider';
import { formatTimeTo12Hour } from '@/utils/helpers';
import { useSession } from 'next-auth/react';
import { UPDATE_EVENT } from '@/utils/constants';
import { RiDeleteBinLine } from 'react-icons/ri';
import { GrEdit } from 'react-icons/gr';
import { deleteEventData } from '@/utils/apis/delete';
import GCLoading from '../global/GCLoading';

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

export default function CCEventsManager({ events, volunteers }: { events: Event[], volunteers: Volunteer[] }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isMobile } = useDevice();
  const EXPECTED_EVENTS_PER_PAGE = isMobile ? 2 : 4;
  const isWhite = !pathname.includes('schedule');
  const totalEvents = events?.length || 0;
  const eventsPerPage = totalEvents > EXPECTED_EVENTS_PER_PAGE ? EXPECTED_EVENTS_PER_PAGE : totalEvents;
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const hasUpdateEventsPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(UPDATE_EVENT);
  }, [session]);

  const totalPages = Math.ceil(totalEvents / eventsPerPage);
  const startIndex = currentPage * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const currentEvents = events?.slice(startIndex, endIndex) || [];
  
  // Always show 7 columns - add empty placeholders if needed
  const displayEvents: (Event | null)[] = [...currentEvents];
  while (displayEvents.length < eventsPerPage) {
    displayEvents.push(null);
  }

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const handleStatusUpdate = async (eventId: string, newStatus: string) => {
    try {
      await putUpdateEvent(eventId, { status: newStatus });
      router.refresh();
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

  const addNewEvent = () => {
    router.push('/add-event/new');
  }

  const editEvent = (eventId: string) => {
    router.push(`/add-event/${eventId}`);
  }

  const deleteEvent = async (eventId: string, name: string) => {
    if (confirm(`Are you sure you want to delete the "${name}" event? This action cannot be undone.`)) {
      setLoading(true);
      await deleteEventData(eventId);
      setLoading(false);
      router.refresh();
    }
  }

  return (
    <div className="w-full">
      {loading && <GCLoading />}
      {totalEvents > eventsPerPage && (
        <div className="flex justify-between items-center p-4">
          <GCArrowPrev
            label="Prev"
            type="button"
            handlePrevPage={handlePrevPage}
            disabled={currentPage === 0}
          />
          <span className={`text-sm ${isWhite ? 'text-white' : 'text-slate-600'}`}>
            Page {currentPage + 1} of {totalPages} ({totalEvents} total events)
          </span>
          <GCArrowNext
            label="Next"
            type="button"
            handleNextPage={handleNextPage}
            disabled={currentPage === totalPages - 1}
          />
        </div>
      )}

      <div className="bg-slate-800 rounded-t-lg border border-slate-800 flex justify-between items-center px-6">
        <h2 className="text-white text-lg font-semibold py-3">Events</h2>
        {!hasUpdateEventsPermission && totalEvents > 0 ? (
          <span className="text-white text-sm">
            Showing {Math.min(currentEvents.length, eventsPerPage)} of {totalEvents} events
          </span>
        ) : hasUpdateEventsPermission ? (
          <button onClick={addNewEvent} className='text-white px-3 py-1 bg-slate-600 bg-opacity-80 rounded-md'>
            Add New Event
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="table-fixed w-full text-sm border border-slate-300 bg-slate-200">
          <tbody>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Status</td>
              {displayEvents.map((event, index) => (
                <td key={event?._id || `empty-${index}`} className="bg-slate-200 border border-slate-300 p-2 text-center w-32">
                  {event ? (
                    hasUpdateEventsPermission ? (
                      <select 
                        className={`p-1 border border-gray-300 rounded text-sm ${
                          event.status === 'confirmed' ? 'text-green-600' : 
                          event.status === 'tentative' ? 'text-yellow-600' : 'text-red-600'
                        }`}
                        value={event.status}
                        onChange={(e) => handleStatusUpdate(event._id!, e.target.value)}
                      >
                        <option value="confirmed" className="text-green-600">CONFIRMED</option>
                        <option value="tentative" className="text-yellow-600">TENTATIVE</option>
                        <option value="cancelled" className="text-red-600">CANCELLED</option>
                      </select>
                    ) : (
                      <span className={
                        event.status === 'confirmed' ? 'text-green-600' : 
                        event.status === 'tentative' ? 'text-yellow-600' : 'text-red-600'
                      }>
                        {event.status.toUpperCase()}
                      </span>
                    )
                  ) : null}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Date</td>
              {displayEvents.map((event, index) => (
                <td key={event?._id || `empty-${index}`} className=" bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words">
                  {event ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Day</td>
              {displayEvents.map((event, index) => (
                <td key={event?._id || `empty-${index}`} className=" bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words">
                  {event?.day || ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Event Name</td>
              {displayEvents.map((event, index) => (
                <td key={event?._id || `empty-${index}`} className="bg-slate-200 border border-slate-300 p-2 text-center font-bold text-lg w-32 break-words">
                  {event?.eventName || ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Venue</td>
              {displayEvents.map((event, index) => (
                <td key={event?._id || `empty-${index}`} className="bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words">
                  {event?.venue || ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Call Time</td>
              {displayEvents.map((event, index) => (
                <td key={event?._id || `empty-${index}`} className="bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words">
                  {event?.callTime ? formatTimeTo12Hour(event.callTime) : ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Start Time</td>
              {displayEvents.map((event, index) => (
                <td key={event?._id || `empty-${index}`} className="bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words">
                  {event?.startTime ? formatTimeTo12Hour(event.startTime) : ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">End Time</td>
              {displayEvents.map((event, index) => (
                <td key={event?._id || `empty-${index}`} className="bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words">
                  {event?.endTime ? formatTimeTo12Hour(event.endTime) : ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Praise & Worship</td>
              {displayEvents.map((event, index) => (
                <td key={event?._id || `empty-${index}`} className="bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words">
                  {event?.praiseAndWorship}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Other Details</td>
              {displayEvents.map((event, index) => (
                <td key={event?._id || `empty-${index}`} className="bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words">
                  {event?.otherDetails ? event?.otherDetails : !!event ? '-' : ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24 align-top">Volunteers Needed</td>
              {displayEvents.map((event, index) => (
                <td key={event?._id || `empty-${index}`} className="bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words align-top min-h-[200px]">
                  { !event?.volunteersNeeded ? '' : 
                    <div className="text-xs space-y-1">
                      {Object.entries(event.volunteersNeeded)
                        .filter(([_, needed]) => needed)
                        .map(([role, _]) => {
                          const roleLabels: { [key: string]: string } = {
                            foh: 'FOH',
                            assistantFoh: 'Assistant FOH',
                            bcMix: 'BC Mix',
                            assistantBcMix: 'Assistant BC Mix',
                            monMix: 'Mon Mix',
                            rfTech: 'RF Tech'
                          };
                          const assignedVolunteer = event.assignedVolunteers?.[role as keyof typeof event.assignedVolunteers];
                          const volunteerName = assignedVolunteer 
                            ? (assignedVolunteer === 'N/A' || assignedVolunteer === 'TBC') 
                              ? assignedVolunteer 
                              : volunteers.find(v => v._id === assignedVolunteer)?.name || 'Unknown'
                            : 'N/A';
                          
                          return (
                            <div key={role} className="border-b border-gray-200 pb-1 last:border-b-0">
                              <div className="font-semibold">{roleLabels[role]}</div>
                              <div className="text-gray-600">{volunteerName}</div>
                            </div>
                          );
                        })}
                      {Object.values(event.volunteersNeeded).every(needed => !needed) && (
                        <div>None</div>
                      )}
                    </div>
                  }
                </td>
              ))}
            </tr>
            {hasUpdateEventsPermission && (
              <tr>
                <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Actions</td>
                {displayEvents.map((event, index) => (
                  <td key={event?._id || `empty-${index}`} className="bg-slate-200 border border-slate-300 p-2 text-center w-32">
                    { !event?._id ? '' : 
                      <div className='flex gap-1 justify-center'>
                        <button 
                          onClick={() => deleteEvent(event?._id as string, event?.eventName || 'this', )}
                          className="border border-rose-600 text-rose-600 px-4 py-1 rounded text-xs"
                        >
                          <RiDeleteBinLine size={15} />
                        </button>
                        <button 
                          onClick={() => editEvent(event?._id || 'new')}
                          className="bg-sky-600 text-white px-4 py-1 rounded text-xs hover:bg-sky-700"
                        >
                          <GrEdit size={15} />
                        </button>
                      </div>
                    }
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
