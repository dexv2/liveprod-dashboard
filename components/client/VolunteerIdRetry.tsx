"use client";
import { useState } from "react";

export default function VolunteerIdRetry({ initialId }: { initialId?: string }) {
  const [id, setId] = useState(initialId || "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = id.trim();
    if (!trimmed) return;
    // Navigate to the route that will look up the volunteerId
    window.location.href = `/volunteer/id/${encodeURIComponent(trimmed)}`;
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-md shadow-sm">
      <p className="text-gray-700 mb-4">
        If you mistyped the ID you can try again below. If the ID still isn&apos;t
        found, contact your site administrator for help.
      </p>

      <form onSubmit={onSubmit} className="flex gap-2">
        <label htmlFor="volunteerId" className="sr-only">
          Volunteer ID
        </label>
        <input
          id="volunteerId"
          name="volunteerId"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Enter volunteer ID (e.g. A313273)"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Lookup
        </button>
      </form>
    </div>
  );
}
