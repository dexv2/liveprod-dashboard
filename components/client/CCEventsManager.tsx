"use client";

import { useState, useEffect } from "react";
import { BsArrowLeftCircle, BsArrowRightCircle } from 'react-icons/bs';
import { getAllEvents, getAllVolunteers } from '@/utils/apis/get';
import { useRouter } from 'next/navigation';
import { putUpdateEvent } from '@/utils/apis/put';

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
  praiseAndWorship: boolean;
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

export default function CCEventsManager({ isAuthenticated, events, volunteers }: { isAuthenticated: boolean, events: Event[], volunteers: Volunteer[] }) {
  const [currentPage, setCurrentPage] = useState(0);
  const eventsPerPage = 7;
  const router = useRouter();

  const totalPages = Math.ceil(events?.length || 0 / eventsPerPage);
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

  return (
    <div className="w-full">
      <div className="bg-slate-800 rounded-t-lg border border-slate-800 flex justify-between items-center px-6">
        <h2 className="text-white text-lg font-semibold py-3">Events</h2>
        {!isAuthenticated && events.length > 0 ? (
          <span className="text-white text-sm">
            Showing {Math.min(currentEvents.length, eventsPerPage)} of {events.length} events
          </span>
        ) : isAuthenticated ? (
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
                    isAuthenticated ? (
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
                <td key={event?._id || `empty-${index}`} className=" bg-slate-200 border border-slate-300 p-2 text-center font-bold text-lg w-32 break-words">
                  {event?.eventName || ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Venue</td>
              {currentEvents.map((event) => (
                <td key={event._id} className="bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words">
                  {event.venue}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Call Time</td>
              {currentEvents.map((event) => (
                <td key={event._id} className="bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words">
                  {event.callTime}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Start Time</td>
              {currentEvents.map((event) => (
                <td key={event._id} className="bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words">
                  {event.startTime}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">End Time</td>
              {currentEvents.map((event) => (
                <td key={event._id} className="bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words">
                  {event.endTime}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Praise & Worship</td>
              {currentEvents.map((event) => (
                <td key={event._id} className="bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words">
                  {event.praiseAndWorship ? 'Yes' : 'No'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Other Details</td>
              {currentEvents.map((event) => (
                <td key={event._id} className="bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words">
                  {event.otherDetails || '-'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Volunteers Needed</td>
              {currentEvents.map((event) => (
                <td key={event._id} className="bg-slate-200 border border-slate-300 p-2 text-center w-32 break-words">
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
                </td>
              ))}
            </tr>
            {isAuthenticated && (
              <tr>
                <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Actions</td>
                {currentEvents.map((event) => (
                  <td key={event._id} className="bg-slate-200 border border-slate-300 p-2 text-center w-32">
                    <button 
                      onClick={() => editEvent(event?._id || 'new')}
                      className="bg-sky-600 text-white px-4 py-1 rounded text-xs hover:bg-sky-700"
                    >
                      Edit
                    </button>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {events?.length > eventsPerPage && (
        <div className="flex justify-between items-center p-4 border-t">
          <button 
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="px-4 py-2 text-slate-200 rounded disabled:cursor-not-allowed"
          >
            <div className='flex gap-1 md:gap-2 items-center'>
              <BsArrowLeftCircle size={18} className="md:w-[22px] md:h-[22px]" />
              <p className="text-sm md:text-base">Prev</p>
            </div>
          </button>
          <span className="text-sm text-white">
            Page {currentPage + 1} of {totalPages} ({events.length} total events)
          </span>
          <button 
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="px-4 py-2 text-slate-200 rounded disabled:cursor-not-allowed"
          >
            <div className='flex gap-1 md:gap-2 items-center'>
              <p className="text-sm md:text-base">Next</p>
              <BsArrowRightCircle size={18} className="md:w-[22px] md:h-[22px]" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
