"use client";

import { newDate } from "@/utils/helpers";
import moment from "moment";
import { useState } from "react";
import { Calendar, View, Views, momentLocalizer } from "react-big-calendar";

const localizer = momentLocalizer(moment);

export default function CpCalendarSchedule({ events, length }: { events: any, length: number }) {
  const [view, setView] = useState<View>(Views.AGENDA);
  const [date, setDate] = useState(newDate());

  return (
    <div>
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
          if (view !== Views.AGENDA) {
            setDate(new Date(date))
          }
        }}
        step={60}
        length={length}
        style={{ height: 700 }}
      />
    </div>
  );
}
