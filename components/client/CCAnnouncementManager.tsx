"use client";

import { useState, useEffect, useMemo } from "react";
import GCInputTextWithLabel from "@/components/global/GCInputTextWithLabel";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { VIEW_ANNOUNCEMENTS, UPDATE_ANNOUNCEMENTS } from "@/utils/constants";
import { calculateAnnouncementExpiresAt, getManilaCalendarDate, MANILA_TIME_ZONE } from "@/utils/announcementExpiration";
import type { AnnouncementExpirationMode } from "@/models/announcement";

interface EventOption { _id: string; eventName: string; date: string }
interface Announcement {
  _id: string; title: string; message: string;
  theme: "info" | "success" | "warning" | "error" | "celebration";
  isActive: boolean; isPinned?: boolean; createdAt: string; publishAt?: string;
  expirationMode?: AnnouncementExpirationMode; expirationDays?: number;
  expiresAt?: string; effectiveExpiresAt?: string; relevantDate?: string;
  relatedEvent?: EventOption; computedStatus: "ACTIVE" | "SCHEDULED" | "EXPIRED" | "ARCHIVED";
}

const themes = [
  { value: "info", label: "Info (Blue)", color: "bg-blue-100 text-blue-800" },
  { value: "success", label: "Success (Green)", color: "bg-green-100 text-green-800" },
  { value: "warning", label: "Warning (Yellow)", color: "bg-yellow-100 text-yellow-800" },
  { value: "error", label: "Error (Red)", color: "bg-red-100 text-red-800" },
  { value: "celebration", label: "Celebration (Purple)", color: "bg-purple-100 text-purple-800" }
] as const;

const initialForm = {
  title: "", message: "", theme: "info" as Announcement["theme"], isPinned: false,
  expirationMode: "AFTER_DAYS" as AnnouncementExpirationMode, expirationDays: 7,
  customDate: "", relevantDate: "", relatedEvent: "", publishAt: ""
};

export default function CCAnnouncementManager() {
  const { data: session } = useSession();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const hasViewPermission = useMemo(() => (session?.user.permissions ?? []).includes(VIEW_ANNOUNCEMENTS), [session]);
  const hasUpdatePermission = useMemo(() => (session?.user.permissions ?? []).includes(UPDATE_ANNOUNCEMENTS), [session]);

  useEffect(() => { if (!hasViewPermission) router.push("/"); }, [hasViewPermission, router]);
  useEffect(() => { void fetchAnnouncements(); void fetchEvents(); }, []);

  async function fetchAnnouncements() {
    const response = await fetch("/api/announcements?scope=admin");
    const result = await response.json();
    setAnnouncements(result.data || []);
  }
  async function fetchEvents() {
    try {
      const response = await fetch("/api/events");
      const result = await response.json();
      setEvents(result.data || []);
    } catch (error) { console.error("Error fetching events:", error); }
  }

  const calculatedExpiration = useMemo(() => {
    try {
      const eventDate = events.find(event => event._id === form.relatedEvent)?.date;
      return calculateAnnouncementExpiresAt({
        expirationMode: form.expirationMode, publishAt: form.publishAt || new Date(), expirationDays: form.expirationDays,
        customDate: form.customDate, relevantDate: form.relevantDate || undefined, eventDate
      });
    } catch { return null; }
  }, [events, form]);

  function changeExpirationMode(expirationMode: AnnouncementExpirationMode) {
    setForm(current => ({
      ...current,
      expirationMode,
      expirationDays: expirationMode === "AFTER_DAYS" ? (current.expirationDays || 7) : 7,
      customDate: expirationMode === "CUSTOM" ? current.customDate : "",
      relevantDate: expirationMode === "EVENT_DATE" ? current.relevantDate : "",
      relatedEvent: expirationMode === "EVENT_DATE" ? current.relatedEvent : ""
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return toast.error("Please enter a title and message");
    try {
      const response = await fetch("/api/announcements", {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, _id: editingId || undefined })
      });
      const result = await response.json();
      if (!response.ok) return toast.error(result.error || "Unable to save announcement");
      toast.success(editingId ? "Announcement updated successfully" : "Announcement created successfully");
      setForm(initialForm); setEditingId(null); await fetchAnnouncements();
    } catch { toast.error("Error saving announcement"); }
  }

  function editAnnouncement(item: Announcement) {
    setEditingId(item._id);
    setForm({
      title: item.title, message: item.message, theme: item.theme, isPinned: Boolean(item.isPinned),
      expirationMode: item.expirationMode || "AFTER_DAYS", expirationDays: item.expirationDays || 7,
      customDate: item.expirationMode === "CUSTOM" && item.expiresAt ? getManilaCalendarDate(item.expiresAt) : "",
      relevantDate: item.relevantDate ? getManilaCalendarDate(item.relevantDate) : "",
      relatedEvent: item.relatedEvent?._id || "", publishAt: item.publishAt || item.createdAt
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return <div className="px-8 py-6">
    <h1 className="text-xl font-semibold text-white mb-8">Announcement Manager</h1>
    {hasUpdatePermission && <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-lg font-semibold mb-4">{editingId ? "Edit Announcement" : "Create New Announcement"}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <GCInputTextWithLabel label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <div><label className="block text-sm font-medium mb-1">Message</label><textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="w-full p-2 border border-gray-300 rounded-md" rows={3} /></div>
        <div><label className="block text-sm font-medium mb-1">Theme</label><div className="grid grid-cols-1 md:grid-cols-3 gap-2">{themes.map(option => <label key={option.value} className="flex items-center cursor-pointer"><input type="radio" name="theme" checked={form.theme === option.value} onChange={() => setForm({ ...form, theme: option.value })} className="mr-2" /><span className={`px-3 py-1 rounded text-sm ${option.color}`}>{option.label}</span></label>)}</div></div>
        <div className="border rounded-md p-4 space-y-3">
          <p className="font-medium">Expiration</p>
          {(["EVENT_DATE", "AFTER_DAYS", "CUSTOM", "NEVER"] as AnnouncementExpirationMode[]).map(mode => <label key={mode} className="flex items-center gap-2"><input type="radio" name="expirationMode" checked={form.expirationMode === mode} onChange={() => changeExpirationMode(mode)} /><span>{{ EVENT_DATE: "On event/relevant date (captured when saved)", AFTER_DAYS: "After a number of days", CUSTOM: "Custom date", NEVER: "Never expires" }[mode]}</span></label>)}
          {form.expirationMode === "AFTER_DAYS" && <label className="block text-sm">Days after publication<input type="number" min={1} step={1} value={form.expirationDays} onChange={e => setForm({ ...form, expirationDays: Number(e.target.value) })} className="ml-3 w-24 p-2 border rounded" /></label>}
          {form.expirationMode === "CUSTOM" && <label className="block text-sm">Expiration date <input type="date" value={form.customDate} onChange={e => setForm({ ...form, customDate: e.target.value })} className="ml-3 p-2 border rounded" /></label>}
          {form.expirationMode === "EVENT_DATE" && <div className="grid md:grid-cols-2 gap-3"><label className="text-sm">Related event<select value={form.relatedEvent} onChange={e => setForm({ ...form, relatedEvent: e.target.value, relevantDate: e.target.value ? "" : form.relevantDate })} className="block w-full p-2 border rounded"><option value="">No related event</option>{events.map(event => <option key={event._id} value={event._id}>{event.eventName} — {getManilaCalendarDate(event.date)}</option>)}</select></label><label className="text-sm">Or relevant date<input type="date" disabled={Boolean(form.relatedEvent)} value={form.relevantDate} onChange={e => setForm({ ...form, relevantDate: e.target.value })} className="block w-full p-2 border rounded disabled:bg-gray-100" /></label></div>}
          <p className="text-sm text-gray-600">{form.expirationMode === "NEVER" ? "This announcement will remain active until archived." : calculatedExpiration ? `Expires ${calculatedExpiration.toLocaleString("en-PH", { timeZone: MANILA_TIME_ZONE })} (Manila time)` : "Complete the expiration details to preview the date."}</p>
        </div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.isPinned} onChange={e => setForm({ ...form, isPinned: e.target.checked })} /> Pin announcement (pinning does not prevent expiration)</label>
        <div className="flex gap-2"><button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">{editingId ? "Save Changes" : "Create Announcement"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(initialForm); }} className="px-6 py-2 border rounded">Cancel</button>}</div>
      </form>
    </div>}
    <div className="bg-white p-6 rounded-lg shadow-md"><h2 className="text-lg font-semibold mb-4">All Announcements</h2>{announcements.length === 0 ? <p className="text-gray-500">No announcements found.</p> : <div className="space-y-4">{announcements.map(item => {
      const theme = themes.find(option => option.value === item.theme);
      const statusColor = { ACTIVE: "bg-green-100 text-green-800", SCHEDULED: "bg-blue-100 text-blue-800", EXPIRED: "bg-gray-200 text-gray-700", ARCHIVED: "bg-orange-100 text-orange-800" }[item.computedStatus];
      return <div key={item._id} className="border border-gray-200 rounded p-4"><div className="flex justify-between items-start gap-3"><div><h3 className="font-semibold">{item.isPinned && "📌 "}{item.title}</h3><span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${statusColor}`}>{item.computedStatus}</span></div><span className={`px-2 py-1 rounded text-xs ${theme?.color}`}>{theme?.label}</span></div><p className="text-gray-700 my-2">{item.message}</p><div className="text-xs text-gray-500 space-y-1"><p>Created: {new Date(item.createdAt).toLocaleString("en-PH", { timeZone: MANILA_TIME_ZONE })}</p><p>Expires: {item.expirationMode === "NEVER" ? "Never" : item.effectiveExpiresAt ? new Date(item.effectiveExpiresAt).toLocaleString("en-PH", { timeZone: MANILA_TIME_ZONE }) : "Legacy fallback"}</p>{item.relatedEvent && <p>Event: {item.relatedEvent.eventName}</p>}</div>{hasUpdatePermission && <button onClick={() => editAnnouncement(item)} className="mt-3 text-sm text-blue-600 hover:underline">Edit</button>}</div>;
    })}</div>}</div>
  </div>;
}
