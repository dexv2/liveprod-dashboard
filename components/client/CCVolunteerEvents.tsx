"use client";

import { useState, useEffect, useCallback } from "react";

interface Event {
  _id: string;
  eventName: string;
  date: string;
  venue: string;
  status: string;
  callTime?: string;
  startTime?: string;
  endTime?: string;
  assignedVolunteers?: {
    foh?: string;
    assistantFoh?: string;
    bcMix?: string;
    assistantBcMix?: string;
    monMix?: string;
    rfTech?: string;
  };
}

export default function CCVolunteerEvents({ volunteerId }: { volunteerId: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(3);

  const fetchVolunteerEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/events');
      const result = await response.json();
      
      const volunteerEvents = (result.data || []).filter((event: Event) => {
        if (!event.assignedVolunteers) return false;
        return Object.values(event.assignedVolunteers).includes(volunteerId);
      });
      
      setEvents(volunteerEvents);
    } catch (error) {
      console.error('Error fetching volunteer events:', error);
    } finally {
      setLoading(false);
    }
  }, [volunteerId]);

  useEffect(() => {
    fetchVolunteerEvents();
  }, [fetchVolunteerEvents]);

  const getVolunteerRole = (event: Event) => {
    if (!event.assignedVolunteers) return 'Unknown';
    
    const roleMap: { [key: string]: string } = {
      foh: 'FOH',
      assistantFoh: 'Assistant FOH',
      bcMix: 'BC Mix',
      assistantBcMix: 'Assistant BC Mix',
      monMix: 'Mon Mix',
      rfTech: 'RF Tech'
    };
    
    for (const [role, assignedId] of Object.entries(event.assignedVolunteers)) {
      if (assignedId === volunteerId) {
        return roleMap[role] || role;
      }
    }
    return 'Unknown';
  };

  if (loading) {
    return <div className="text-center py-8">Loading events...</div>;
  }

  const sortedEvents = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPages = Math.ceil(sortedEvents.length / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentEvents = sortedEvents.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(0);
  };

  return (
    <div className="flex flex-col gap-4">
      {events.length > 0 ? (
        <>
          {currentEvents.map((event) => (
            <div key={event._id} className="border border-gray-200 rounded p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold">{event.eventName}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                  <span className={`inline-block text-xs px-2 py-1 rounded mt-1 ${
                    event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    event.status === 'tentative' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {event.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm"><span className="font-medium">Role:</span> {getVolunteerRole(event)}</p>
                  <p className="text-sm mt-1"><span className="font-medium">Venue:</span> {event.venue}</p>
                </div>
                <div>
                  <p className="text-sm"><span className="font-medium">Call Time:</span> {event.callTime || 'N/A'}</p>
                  <p className="text-sm mt-1"><span className="font-medium">Start Time:</span> {event.startTime || 'N/A'}</p>
                  <p className="text-sm mt-1"><span className="font-medium">End Time:</span> {event.endTime || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Rows per page:</label>
              <select 
                value={rowsPerPage} 
                onChange={handleRowsPerPageChange}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevPage} 
                disabled={currentPage === 0}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <span className="text-sm text-gray-600">
                {currentPage + 1} / {totalPages}
              </span>
              <button 
                onClick={handleNextPage} 
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-500 text-center py-8">No events assigned.</p>
      )}
    </div>
  );
}
