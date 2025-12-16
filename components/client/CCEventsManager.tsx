"use client";

import { useState, useEffect } from "react";
import GCInputTextWithLabel from "@/components/global/GCInputTextWithLabel";
import GCSelect from "@/components/global/GCSelect";
import GCTimePicker from "@/components/global/GCTimePicker";

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

export default function CCEventsManager({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState<{[key: string]: string}>({});
  const [currentPage, setCurrentPage] = useState(0);
  const eventsPerPage = 7;
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editSelectedVolunteers, setEditSelectedVolunteers] = useState<{[key: string]: string}>({});
  const [newEvent, setNewEvent] = useState<Event>({
    status: "confirmed",
    date: "",
    day: "",
    eventName: "",
    venue: "",
    callTime: "",
    startTime: "",
    endTime: "",
    praiseAndWorship: false,
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

  useEffect(() => {
    fetchEvents();
    fetchVolunteers();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const result = await response.json();
      setEvents(result.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const response = await fetch('/api/volunteers');
      const result = await response.json();
      setVolunteers(result.data || []);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    }
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
    return volunteers.filter(volunteer => 
      volunteer.roles.some(volunteerRole => 
        relevantRoles.includes(volunteerRole.toLowerCase())
      )
    );
  };

  const handleDateChange = (date: string) => {
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    setNewEvent({ ...newEvent, date, day: dayName });
  };



  const handleVolunteerSelection = (role: string, volunteerId: string) => {
    setSelectedVolunteers(prev => ({
      ...prev,
      [role]: volunteerId
    }));
  };

  const handleSubmit = async () => {
    try {
      const eventData = {
        ...newEvent,
        assignedVolunteers: selectedVolunteers
      };
      
      console.log('Submitting event data:', eventData);
      console.log('Selected volunteers:', selectedVolunteers);
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      
      if (response.ok) {
        fetchEvents();
        setNewEvent({
          status: "tentative",
          date: "",
          day: "",
          eventName: "",
          venue: "",
          callTime: "",
          startTime: "",
          endTime: "",
          praiseAndWorship: false,
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
        setSelectedVolunteers({});
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const totalPages = Math.ceil(events.length / eventsPerPage);
  const startIndex = currentPage * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const currentEvents = events.slice(startIndex, endIndex);
  
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
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-slate-800 border border-slate-800 flex justify-between items-center px-6">
        <h2 className="text-white text-lg font-semibold py-3">Events</h2>
        {!isAuthenticated && events.length > 0 && (
          <span className="text-white text-sm">
            Showing {Math.min(currentEvents.length, eventsPerPage)} of {events.length} events
          </span>
        )}
      </div>
      
      {isAuthenticated && (
        <div className="p-4 bg-slate-50 border-b">
          <h3 className="text-lg font-semibold mb-4">Add New Event</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <GCSelect 
              label="Status" 
              value={newEvent.status} 
              onChange={(e) => setNewEvent({...newEvent, status: e.target.value})}
              options={["confirmed", "tentative", "cancelled"]}
            />
            <GCInputTextWithLabel 
              label="Date" 
              type="date"
              value={newEvent.date} 
              onChange={(e) => handleDateChange(e.target.value)}
            />
            <GCInputTextWithLabel 
              label="Event Name" 
              value={newEvent.eventName} 
              onChange={(e) => setNewEvent({...newEvent, eventName: e.target.value})}
            />
            <GCSelect 
              label="Venue" 
              value={newEvent.venue} 
              onChange={(e) => setNewEvent({...newEvent, venue: e.target.value})}
              options={["Main Hall", "MPH", "7F Gym", "GF Annex", "2F Annex", "Others"]}
            />
            <GCTimePicker 
              label="Call Time" 
              value={newEvent.callTime} 
              onChange={(e) => setNewEvent({...newEvent, callTime: e.target.value})}
            />
            <GCTimePicker 
              label="Start Time" 
              value={newEvent.startTime} 
              onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
            />
            <GCTimePicker 
              label="End Time" 
              value={newEvent.endTime} 
              onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
            />
            <GCSelect 
              label="Praise and Worship" 
              value={newEvent.praiseAndWorship ? "yes" : "no"} 
              onChange={(e) => setNewEvent({...newEvent, praiseAndWorship: e.target.value === "yes"})}
              options={["yes", "no"]}
            />
          </div>
          
          <div className="mb-4">
            <GCInputTextWithLabel 
              label="Other Details" 
              value={newEvent.otherDetails} 
              onChange={(e) => setNewEvent({...newEvent, otherDetails: e.target.value})}
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
                        setNewEvent({
                          ...newEvent,
                          volunteersNeeded: {
                            ...newEvent.volunteersNeeded,
                            [key]: !!volunteerId
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

          <button 
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Event
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table-fixed w-full text-sm border border-slate-300">
          <tbody>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Status</td>
              {displayEvents.map((event, index) => (
                <td key={event?._id || `empty-${index}`} className="border border-slate-300 p-2 text-center w-32">
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
                <td key={event?._id || `empty-${index}`} className="border border-slate-300 p-2 text-center w-32 break-words">
                  {event ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Day</td>
              {displayEvents.map((event, index) => (
                <td key={event?._id || `empty-${index}`} className="border border-slate-300 p-2 text-center w-32 break-words">
                  {event?.day || ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Event Name</td>
              {displayEvents.map((event, index) => (
                <td key={event?._id || `empty-${index}`} className="border border-slate-300 p-2 text-center font-bold text-lg w-32 break-words">
                  {event?.eventName || ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Venue</td>
              {currentEvents.map((event) => (
                <td key={event._id} className="border border-slate-300 p-2 text-center w-32 break-words">
                  {event.venue}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Call Time</td>
              {currentEvents.map((event) => (
                <td key={event._id} className="border border-slate-300 p-2 text-center w-32 break-words">
                  {event.callTime}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Start Time</td>
              {currentEvents.map((event) => (
                <td key={event._id} className="border border-slate-300 p-2 text-center w-32 break-words">
                  {event.startTime}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">End Time</td>
              {currentEvents.map((event) => (
                <td key={event._id} className="border border-slate-300 p-2 text-center w-32 break-words">
                  {event.endTime}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Praise & Worship</td>
              {currentEvents.map((event) => (
                <td key={event._id} className="border border-slate-300 p-2 text-center w-32 break-words">
                  {event.praiseAndWorship ? 'Yes' : 'No'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Other Details</td>
              {currentEvents.map((event) => (
                <td key={event._id} className="border border-slate-300 p-2 text-center w-32 break-words">
                  {event.otherDetails || '-'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bg-slate-300 border border-slate-300 p-2 font-semibold w-24">Volunteers Needed</td>
              {currentEvents.map((event) => (
                <td key={event._id} className="border border-slate-300 p-2 text-center w-32 break-words">
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
                        console.log('Event:', event.eventName, 'Role:', role, 'Assigned:', assignedVolunteer);
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
                  <td key={event._id} className="border border-slate-300 p-2 text-center w-32">
                    <button 
                      onClick={() => {
                        setEditingEvent(event);
                        setEditSelectedVolunteers(event.assignedVolunteers || {});
                      }}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
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
      
      {events.length > eventsPerPage && (
        <div className="flex justify-between items-center p-4 border-t">
          <button 
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="px-4 py-2 bg-gray-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage + 1} of {totalPages} ({events.length} total events)
          </span>
          <button 
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="px-4 py-2 bg-gray-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Event</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <GCSelect 
                label="Status" 
                value={editingEvent.status} 
                onChange={(e) => setEditingEvent({...editingEvent, status: e.target.value})}
                options={["confirmed", "tentative", "cancelled"]}
              />
              <GCInputTextWithLabel 
                label="Date" 
                type="date"
                value={editingEvent.date} 
                onChange={(e) => {
                  const dayName = new Date(e.target.value).toLocaleDateString('en-US', { weekday: 'long' });
                  setEditingEvent({...editingEvent, date: e.target.value, day: dayName});
                }}
              />
              <GCInputTextWithLabel 
                label="Event Name" 
                value={editingEvent.eventName} 
                onChange={(e) => setEditingEvent({...editingEvent, eventName: e.target.value})}
              />
              <GCSelect 
                label="Venue" 
                value={editingEvent.venue} 
                onChange={(e) => setEditingEvent({...editingEvent, venue: e.target.value})}
                options={["Main Hall", "MPH", "7F Gym", "GF Annex", "2F Annex", "Others"]}
              />
              <GCTimePicker 
                label="Call Time" 
                value={editingEvent.callTime} 
                onChange={(e) => setEditingEvent({...editingEvent, callTime: e.target.value})}
              />
              <GCTimePicker 
                label="Start Time" 
                value={editingEvent.startTime} 
                onChange={(e) => setEditingEvent({...editingEvent, startTime: e.target.value})}
              />
              <GCTimePicker 
                label="End Time" 
                value={editingEvent.endTime} 
                onChange={(e) => setEditingEvent({...editingEvent, endTime: e.target.value})}
              />
              <GCSelect 
                label="Praise and Worship" 
                value={editingEvent.praiseAndWorship ? "yes" : "no"} 
                onChange={(e) => setEditingEvent({...editingEvent, praiseAndWorship: e.target.value === "yes"})}
                options={["yes", "no"]}
              />
            </div>
            
            <div className="mb-4">
              <GCInputTextWithLabel 
                label="Other Details" 
                value={editingEvent.otherDetails} 
                onChange={(e) => setEditingEvent({...editingEvent, otherDetails: e.target.value})}
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
                        value={editSelectedVolunteers[key] || ''}
                        onChange={(e) => {
                          const volunteerId = e.target.value;
                          setEditSelectedVolunteers(prev => ({...prev, [key]: volunteerId}));
                          setEditingEvent({
                            ...editingEvent,
                            volunteersNeeded: {
                              ...editingEvent.volunteersNeeded,
                              [key]: !!volunteerId
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

            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/events/${editingEvent._id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...editingEvent,
                        assignedVolunteers: editSelectedVolunteers
                      })
                    });
                    
                    if (response.ok) {
                      fetchEvents();
                      setEditingEvent(null);
                      setEditSelectedVolunteers({});
                    }
                  } catch (error) {
                    console.error('Error updating event:', error);
                  }
                }}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Save Changes
              </button>
              <button 
                onClick={() => {
                  setEditingEvent(null);
                  setEditSelectedVolunteers({});
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}