"use client";

import { useState, useEffect } from "react";

interface Event {
  _id: string;
  eventName: string;
  date: string;
  venue: string;
  status: string;
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

  useEffect(() => {
    fetchVolunteerEvents();
  }, [volunteerId]);

  const fetchVolunteerEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const result = await response.json();
      
      // Filter events where this volunteer is assigned
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
  };

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

  return (
    <div className="flex flex-col gap-4">
      {events.length > 0 ? (
        events
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((event) => (
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
                  <h5 className="font-medium mb-1">Role:</h5>
                  <p className="text-sm text-gray-600">{getVolunteerRole(event)}</p>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Venue:</h5>
                  <p className="text-sm text-gray-600">{event.venue}</p>
                </div>
              </div>
            </div>
          ))
      ) : (
        <p className="text-gray-500 text-center py-8">No events assigned.</p>
      )}
    </div>
  );
}