"use client";

import { useState, useMemo } from "react";
import { Calendar, View, Views, momentLocalizer, Event } from "react-big-calendar";
import moment from "moment";
import { CalendarEvent, formatSchedulesToEvents, createLiveProductionEvents, getEventsForMonth, getRoleStatistics, getVolunteerStatistics } from "@/utils/calendarUtils";
import { newDate } from "@/utils/helpers";
import CCEventDetailsModal from "./CCEventDetailsModal";

const localizer = momentLocalizer(moment);

interface CCEnhancedMonthlyCalendarProps {
  schedules: any[];
  onEventSelect?: (event: CalendarEvent) => void;
  onDateSelect?: (date: Date) => void;
  showStatistics?: boolean;
  showLiveProductionEvents?: boolean;
  isAdmin?: boolean;
}

export default function CCEnhancedMonthlyCalendar({
  schedules,
  onEventSelect,
  onDateSelect,
  showStatistics = true,
  showLiveProductionEvents = true,
  isAdmin = false
}: CCEnhancedMonthlyCalendarProps) {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(newDate());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Convert schedules to calendar events
  const scheduleEvents = useMemo(() => {
    return formatSchedulesToEvents(schedules);
  }, [schedules]);

  // Get Live Production Events
  const liveProductionEvents = useMemo(() => {
    return showLiveProductionEvents ? createLiveProductionEvents() : [];
  }, [showLiveProductionEvents]);

  // Combine all events
  const allEvents = useMemo(() => {
    return [...scheduleEvents, ...liveProductionEvents];
  }, [scheduleEvents, liveProductionEvents]);

  // Get events for current month
  const currentMonthEvents = useMemo(() => {
    return getEventsForMonth(scheduleEvents, date.getFullYear(), date.getMonth());
  }, [scheduleEvents, date]);

  // Get statistics
  const roleStats = useMemo(() => {
    return getRoleStatistics(currentMonthEvents);
  }, [currentMonthEvents]);

  const volunteerStats = useMemo(() => {
    return getVolunteerStatistics(currentMonthEvents);
  }, [currentMonthEvents]);

  // Event style getter
  const eventStyleGetter = (event: Event) => {
    const calendarEvent = event as CalendarEvent;
    return {
      style: {
        backgroundColor: calendarEvent.color || '#3B82F6',
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  // Handle event selection
  const handleSelectEvent = (event: Event) => {
    const calendarEvent = event as CalendarEvent;
    setSelectedEvent(calendarEvent);
    setIsModalOpen(true);
    
    if (onEventSelect) {
      onEventSelect(calendarEvent);
    }
  };

  // Handle date selection
  const handleSelectSlot = (slotInfo: any) => {
    if (onDateSelect) {
      onDateSelect(slotInfo.start);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Custom event component
  const EventComponent = ({ event }: { event: Event }) => {
    const calendarEvent = event as CalendarEvent;
    return (
      <div className="text-xs p-1">
        <div className="font-semibold truncate">
          {calendarEvent.resource.role.toUpperCase()}
        </div>
        <div className="truncate">
          {calendarEvent.resource.volunteer}
        </div>
        <div className="text-xs opacity-75">
          {calendarEvent.resource.serviceName}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Statistics Panel */}
      {showStatistics && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-lg font-semibold mb-4">Monthly Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-medium text-blue-800">Total Events</h4>
              <p className="text-2xl font-bold text-blue-600">{currentMonthEvents.length}</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <h4 className="font-medium text-green-800">Roles Covered</h4>
              <p className="text-2xl font-bold text-green-600">{Object.keys(roleStats).length}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <h4 className="font-medium text-purple-800">Volunteers</h4>
              <p className="text-2xl font-bold text-purple-600">{Object.keys(volunteerStats).length}</p>
            </div>
          </div>
          
          {/* Role Statistics */}
          {Object.keys(roleStats).length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Role Distribution</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(roleStats).map(([role, count]) => (
                  <span key={role} className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {role}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-sm border">
        <Calendar
          localizer={localizer}
          events={allEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          view={view}
          views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
          date={date}
          onNavigate={setDate}
          onView={setView}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          popup
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent
          }}
          messages={{
            next: 'Next',
            previous: 'Previous',
            today: 'Today',
            month: 'Month',
            week: 'Week',
            agenda: 'Agenda',
            date: 'Date',
            time: 'Time',
            event: 'Event',
            noEventsInRange: 'No events in this range',
            showMore: (total: number) => `+${total} more`
          }}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
            <span>FOH Roles</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span>Audio Roles</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>Special Events</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
            <span>Other Roles</span>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      <CCEventDetailsModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isAdmin={isAdmin}
      />
    </div>
  );
}
