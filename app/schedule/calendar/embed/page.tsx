import { Fragment } from "react";

export default function EmbeddedCalendarPage() {
  return (
    <Fragment>
      <div className="p-4 bg-blue-50 border-l-4 border-blue-400 mb-6">
        <h1 className="text-2xl font-bold text-blue-800 mb-2">Embedded Google Calendar</h1>
        <p className="text-blue-700">This view is read-only and publicly accessible.</p>
      </div>
      <div className="flex justify-center">
        <iframe
          src="https://calendar.google.com/calendar/embed?src=ccfmain.audio%40gmail.com&ctz=Asia%2FManila"
          style={{ border: "1px solid #777" }}
          width={800}
          height={600}
          frameBorder={0}
          scrolling="no"
        />
      </div>
    </Fragment>
  );
}
