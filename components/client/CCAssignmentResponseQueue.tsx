"use client";

import type { AssignmentResponseQueueItem } from "@/services/assignments/assignmentResponseQueueService";
import { ASSIGN_VOLUNTEER_SCHEDULE, UPDATE_EVENT } from "@/utils/constants";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type QueueResponse = {
  items: AssignmentResponseQueueItem[];
  summary: { pending: number; confirmed: number; declined: number; changeRequested: number };
};
type View = "attention" | "all" | "PENDING" | "CONFIRMED" | "DECLINED" | "CHANGE_REQUESTED";

const labels = {
  PENDING: { text: "🟡 Awaiting Response", style: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { text: "🟢 Confirmed", style: "bg-green-100 text-green-800" },
  DECLINED: { text: "🔴 Declined", style: "bg-red-100 text-red-800" },
  CHANGE_REQUESTED: { text: "🔵 Change Requested", style: "bg-blue-100 text-blue-800" },
  CANCELLED: { text: "⚫ Cancelled", style: "bg-gray-200 text-gray-700" }
};
const deliveryLabels = {
  SENT: "Telegram sent",
  FAILED: "Telegram delivery failed",
  SKIPPED_NO_LINK: "Telegram not connected",
  SKIPPED_DISABLED: "Telegram disabled",
  NOT_ATTEMPTED: "Notification not attempted"
};

export default function CCAssignmentResponseQueue() {
  const { data: session } = useSession();
  const [queue, setQueue] = useState<QueueResponse>({ items: [], summary: { pending: 0, confirmed: 0, declined: 0, changeRequested: 0 } });
  const [view, setView] = useState<View>("attention");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string>();

  const refresh = useCallback(async (quiet = false) => {
    try {
      const response = await fetch("/api/assignments/responses", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load responses");
      setQueue(await response.json());
    } catch {
      if (!quiet) toast.error("Unable to load assignment responses");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(true), 15000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const items = useMemo(() => queue.items.filter(item => {
    if (view === "all") return true;
    if (view === "attention") return ["CHANGE_REQUESTED", "DECLINED", "PENDING"].includes(item.status);
    return item.status === view;
  }), [queue.items, view]);

  function canNotify(item: AssignmentResponseQueueItem) {
    const user = session?.user as any;
    return Boolean(user?.superAdmin || user?.permissions?.includes(
      item.sourceType === "SCHEDULE" ? ASSIGN_VOLUNTEER_SCHEDULE : UPDATE_EVENT
    ));
  }

  async function sendAgain(item: AssignmentResponseQueueItem) {
    setSending(item.assignmentId);
    try {
      const response = await fetch(`/api/assignments/${item.assignmentId}/notify`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      toast.success(`Notification result: ${result.notification.status}`);
      await refresh(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resend notification");
    } finally { setSending(undefined); }
  }

  const cards = [
    ["Awaiting", queue.summary.pending, "border-yellow-400"],
    ["Confirmed", queue.summary.confirmed, "border-green-400"],
    ["Declined", queue.summary.declined, "border-red-400"],
    ["Change Req.", queue.summary.changeRequested, "border-blue-400"]
  ] as const;

  return <main className="px-2 py-4 md:px-8 md:py-6 max-w-7xl mx-auto">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
      <div><h1 className="text-xl font-semibold text-white">My Assignment Responses</h1><p className="text-sm text-slate-200">Assignments you scheduled in the last 7 days through the next 60 days.</p></div>
      <button onClick={() => void refresh()} className="self-start rounded border border-slate-300 px-4 py-2 text-sm text-white">Refresh</button>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">{cards.map(([label, count, color]) => <div key={label} className={`bg-white rounded-lg border-l-4 ${color} p-4 shadow`}><p className="text-sm text-gray-600">{label}</p><p className="text-2xl font-semibold">{count}</p></div>)}</div>
    <div className="flex gap-2 overflow-x-auto pb-3" aria-label="Response filters">{([
      ["attention", "Needs Attention"], ["all", "All"], ["PENDING", "Pending"], ["CONFIRMED", "Confirmed"], ["DECLINED", "Declined"], ["CHANGE_REQUESTED", "Change Requested"]
    ] as const).map(([value, label]) => <button key={value} onClick={() => setView(value)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${view === value ? "bg-emerald-600 text-white" : "bg-white text-gray-700"}`}>{label}</button>)}</div>
    <section className="bg-white rounded-lg shadow p-3 md:p-5">
      {loading ? <p className="text-gray-500">Loading responses…</p> : items.length === 0 ? <p className="text-gray-500">{view === "attention" ? "No assignments need attention." : view === "DECLINED" ? "No declined assignments." : view === "CHANGE_REQUESTED" ? "No change requests." : view === "PENDING" ? "No assignments awaiting response." : "No assignments found for this view."}</p> : <div className="space-y-3">{items.map(item => {
        const status = labels[item.status];
        return <article key={item.assignmentId} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{item.volunteer.name}</h2><span className={`rounded-full px-2 py-1 text-xs ${status.style}`}>{status.text}</span></div><p className="mt-1 text-sm text-gray-700">{item.source.title} · {item.role}</p><p className="text-sm text-gray-500">{item.source.date ? new Date(item.source.date).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium" }) : "Source deleted"}{item.source.callTime ? ` · Call ${item.source.callTime}` : ""}</p>{item.status === "PENDING" && <p className="mt-1 text-xs text-gray-500">{deliveryLabels[item.notification.status]}</p>}</div>
          {item.status === "PENDING" && canNotify(item) && <button disabled={sending === item.assignmentId} onClick={() => void sendAgain(item)} className="self-start md:self-auto rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">{sending === item.assignmentId ? "Sending…" : "Send Again"}</button>}
        </article>;
      })}</div>}
    </section>
  </main>;
}
