"use client";

import { formatDayShort, newDate } from "@/utils/helpers";
import moment from "moment";
import { useState, useEffect } from "react";
import { Calendar, View, Views, momentLocalizer, ToolbarProps } from "react-big-calendar";

const localizer = momentLocalizer(moment);

function CustomToolbar(toolbar: ToolbarProps) {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const label = () => {
    const date = moment(toolbar.date);
    if (toolbar.view === 'month') {
      return (
        <span className="font-semibold text-lg">
          {date.format('MMMM YYYY')}
        </span>
      );
    }
    if (toolbar.view === 'week') {
      const startOfWeek = moment(date).startOf('week');
      const endOfWeek = moment(date).endOf('week');
      return (
        <span className="font-semibold text-lg">
          {startOfWeek.format('MMMM D')} - {endOfWeek.format('MMMM D, YYYY')}
        </span>
      );
    }
    return (
      <span className="font-semibold text-lg">
        {date.format('MMMM DD, YYYY')}
      </span>
    );
  };

  const showNavigation = toolbar.view === 'month' || toolbar.view === 'week';

  return (
    <div className="rbc-toolbar flex flex-col gap-3 mb-4">
      <span className="rbc-btn-group">
        <button type="button" onClick={() => toolbar.onView('agenda')}>Today</button>
        {/* <button type="button" onClick={() => toolbar.onView('week')}>Week</button> */}
        <button type="button" onClick={() => toolbar.onView('month')}>Month</button>
      </span>
      {showNavigation && (
        <div className="flex flex-col gap-2 w-full">
          <div className="text-center">
            {label()}
          </div>
          <div className="flex justify-between w-full">
            <button type="button" className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100" onClick={goToBack}>Back</button>
            <button type="button" className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100" onClick={goToNext}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CpCalendarSchedule({ events, length }: { events: any, length: number }) {
  const [view, setView] = useState<View>(Views.AGENDA);
  const [date, setDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [expandedCell, setExpandedCell] = useState<string | null>(null);

  useEffect(() => {
    setDate(newDate());
    setMounted(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const calendarHeight = view === Views.WEEK ? 1000 : 700;

  if (!mounted) {
    return <div style={{ height: calendarHeight }} className="flex items-center justify-center">Loading...</div>;
  }

  const getWeekDates = () => {
    const startOfWeek = moment(date).startOf('week');
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(moment(startOfWeek).add(i, 'days').toDate());
    }
    return dates;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event: any) => {
      const eventDate = moment(event.start).format('YYYY-MM-DD');
      const checkDate = moment(date).format('YYYY-MM-DD');
      return eventDate === checkDate;
    });
  };

  if (view === Views.AGENDA) {
    const today = moment().startOf('day');
    const futureEvents = events.filter((event: any) => {
      return moment(event.start).isSameOrAfter(today);
    });

    const groupedEvents = futureEvents.reduce((acc: any, event: any) => {
      const dateKey = moment(event.start).format('YYYY-MM-DD');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {});

    const sortedDates = Object.keys(groupedEvents).sort();

    return (
      <div>
        <CustomToolbar 
          date={date}
          view={view}
          views={[Views.AGENDA, Views.MONTH, Views.WEEK]}
          onNavigate={() => {}}
          onView={(newView) => {
            if (newView === Views.AGENDA) {
              setDate(newDate());
            }
            setView(newView);
          }}
          label=""
          localizer={localizer}
        />
        <p className="text-center text-gray-600 mb-4">
          Your schedules as of today, {moment().format('MMMM D, YYYY')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {sortedDates.length > 0 ? (
            sortedDates.map((dateKey) => (
              <div key={dateKey} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-sm mb-3 text-center leading-tight">
                  {moment(dateKey).format('dddd, MMMM D, YYYY')}
                </h3>
                <div className="space-y-2">
                  {groupedEvents[dateKey].map((event: any, i: number) => (
                    <div key={i} className={`${formatDayShort(dateKey) === "SAT" ? "border-sky-700 bg-sky-50" : "border-green-700 bg-green-50" } border-l-4 pl-3 py-2 rounded`}>
                      <div className="font-medium text-sm">{event.title}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {moment(event.start).format('h:mm A')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">No upcoming events scheduled</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isMobile && view === Views.WEEK) {
    const weekDates = getWeekDates();
    const today = moment().startOf('day');
    const currentWeekDay = weekDates.find(d => moment(d).isSame(today, 'day')) || weekDates[0];
    const displayDate = selectedDate || currentWeekDay;
    const dayEvents = getEventsForDate(displayDate);

    return (
      <div className="mobile-week-view">
        <CustomToolbar 
          date={date}
          view={view}
          views={[Views.AGENDA, Views.MONTH, Views.WEEK]}
          onNavigate={(action) => {
            if (action === 'PREV') {
              setDate(moment(date).subtract(1, 'week').toDate());
            } else if (action === 'NEXT') {
              setDate(moment(date).add(1, 'week').toDate());
            }
          }}
          onView={(newView) => {
            if (newView === Views.AGENDA) {
              setDate(newDate());
            }
            setView(newView);
          }}
          label=""
          localizer={localizer}
        />
        
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekDates.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDate(d)}
              className={`px-2 py-2 rounded border text-center ${
                moment(d).format('YYYY-MM-DD') === moment(displayDate).format('YYYY-MM-DD')
                  ? 'bg-sky-700 text-white border-sky-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-xs">{moment(d).format('ddd')}</div>
              <div className="font-semibold">{moment(d).format('D')}</div>
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded p-4">
          <h3 className="font-semibold text-lg mb-4">
            {moment(displayDate).format('dddd, MMMM D, YYYY')}
          </h3>
          {dayEvents.length > 0 ? (
            <div className="space-y-3">
              {dayEvents.map((event: any, i: number) => (
                <div key={i} className="border-l-4 border-sky-700 pl-3 py-2">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-gray-600">
                    {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No events scheduled</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-schedule-wrapper relative">
      <style jsx global>{`
        @media (max-width: 768px) {
          .calendar-schedule-wrapper .rbc-time-content {
            overflow-x: auto;
          }
          .calendar-schedule-wrapper .rbc-time-column {
            min-width: 50px;
          }
          .calendar-schedule-wrapper .rbc-day-slot {
            min-width: 80px;
          }
          .calendar-schedule-wrapper .rbc-month-view .rbc-date-cell {
            cursor: pointer;
          }
        }
        .calendar-schedule-wrapper .rbc-agenda-view table.rbc-agenda-table thead > tr > th:first-child {
          text-align: center;
        }
        .calendar-schedule-wrapper .rbc-agenda-view table.rbc-agenda-table tbody > tr > td:first-child {
          text-align: center;
          vertical-align: middle;
        }
        .calendar-schedule-wrapper .rbc-month-view .rbc-event {
          font-size: 0.75rem;
          padding: 1px 3px;
          line-height: 1.2;
        }
        .calendar-schedule-wrapper .rbc-month-view .rbc-row-segment {
          padding: 0 1px 1px 1px;
        }
        .calendar-schedule-wrapper .rbc-month-view .rbc-day-bg {
          min-height: 100px;
        }
      `}</style>
      {isMobile && expandedCell && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedCell(null)}
        >
          <div 
            className="bg-white rounded-lg p-4 max-w-md w-full max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                {moment(expandedCell).format('MMMM D, YYYY')}
              </h3>
              <button 
                onClick={() => setExpandedCell(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {getEventsForDate(new Date(expandedCell)).map((event: any, i: number) => (
                <div key={i} className="border-l-4 border-sky-700 pl-3 py-2 bg-sky-50 rounded">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-gray-600">
                    {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <Calendar
        localizer={localizer}
        events={events}
        views={[Views.AGENDA, Views.MONTH, Views.WEEK]}
        defaultView={view}
        view={view}
        popup
        onView={(_view) => {
          if (_view === Views.AGENDA) {
            setDate(newDate())
          }
          setView(_view)
        }}
        date={date}
        onNavigate={(date) => {
          if (view === 'month' || view === 'week') {
            setDate(new Date(date))
          }
        }}
        min={new Date(2024, 0, 1, 6, 0, 0)}
        max={new Date(2024, 0, 1, 20, 0, 0)}
        step={60}
        timeslots={1}
        length={length}
        style={{ height: calendarHeight }}
        components={{
          toolbar: CustomToolbar,
          month: {
            event: ({ event }: { event: any }) => (
              <span>
                {moment(event.start).format('h:mm A')} | {event.title}
              </span>
            ),
            dateHeader: ({ date, label }: { date: Date; label: string }) => {
              const dateKey = moment(date).format('YYYY-MM-DD');
              const dayEvents = getEventsForDate(date);
              
              return (
                <div 
                  onClick={() => {
                    if (isMobile && dayEvents.length > 0) {
                      setExpandedCell(dateKey);
                    }
                  }}
                  className={isMobile ? 'cursor-pointer' : ''}
                >
                  {label}
                </div>
              );
            }
          }
        }}
        formats={{
          agendaTimeRangeFormat: ({ start }: { start: Date }) => {
            return moment(start).format('h:mm A');
          }
        }}
        messages={{
          event: 'Role'
        }}
      />
    </div>
  );
}
