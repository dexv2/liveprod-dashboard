"use client";

import { useEffect, useState } from "react";

interface TelegramStatus {
  connected: boolean;
  linkedAt?: string;
  notificationsEnabled: boolean;
  pendingLink?: { expiresAt: string };
}

export default function CCTelegramLink({
  volunteerId,
  initialStatus
}: {
  volunteerId: string;
  initialStatus: TelegramStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [link, setLink] = useState<string>();
  const [expiresAt, setExpiresAt] = useState<string | undefined>(initialStatus.pendingLink?.expiresAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const endpoint = `/api/volunteers/${volunteerId}/telegram-link`;

  useEffect(() => {
    let active = true;
    fetch(endpoint, { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(next => { if (active && next) setStatus(next); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [endpoint]);

  useEffect(() => {
    if (!expiresAt || status.connected || new Date(expiresAt).getTime() <= Date.now()) return;
    const poll = window.setInterval(async () => {
      if (new Date(expiresAt).getTime() <= Date.now()) {
        setLink(undefined);
        setExpiresAt(undefined);
        return;
      }
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) return;
        const next = await response.json() as TelegramStatus;
        setStatus(next);
        if (next.connected) {
          setLink(undefined);
          setExpiresAt(undefined);
        }
      } catch {
        // A later poll or manual action can recover from a temporary read failure.
      }
    }, 3000);
    return () => window.clearInterval(poll);
  }, [endpoint, expiresAt, status.connected]);

  async function generateLink() {
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Unable to generate Telegram link");
      setLink(body.link);
      setExpiresAt(body.expiresAt);
      setStatus(body);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to generate Telegram link");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!window.confirm("Disconnect this volunteer's Telegram account?")) return;
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Unable to disconnect Telegram");
      setStatus(body);
      setLink(undefined);
      setExpiresAt(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to disconnect Telegram");
    } finally {
      setBusy(false);
    }
  }

  const waiting = Boolean(link && expiresAt && new Date(expiresAt).getTime() > Date.now());
  const minutes = expiresAt ? Math.max(1, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60000)) : 0;

  return (
    <div className="bg-white w-full rounded-xl border border-slate-100 shadow-md overflow-hidden">
      <div className="py-5 px-6 bg-slate-800 text-white font-semibold text-lg">Telegram</div>
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span aria-hidden>{status.connected ? "🟢" : waiting ? "🟡" : "⚪"}</span>
          <span>{status.connected ? "Connected" : waiting ? "Waiting for connection" : "Not connected"}</span>
        </div>
        {status.connected && status.linkedAt && (
          <p className="text-sm text-slate-500">Linked: {new Date(status.linkedAt).toLocaleString()}</p>
        )}
        {waiting && <p className="text-sm text-slate-500">Link expires in approximately {minutes} minutes.</p>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-2">
          {!status.connected && !waiting && (
            <button disabled={busy} onClick={generateLink} className="bg-sky-700 disabled:opacity-50 text-white px-4 py-2 rounded-md">
              Connect Telegram
            </button>
          )}
          {waiting && link && (
            <>
              <a href={link} target="_blank" rel="noreferrer" className="bg-sky-700 text-white px-4 py-2 rounded-md">Open Telegram</a>
              <button onClick={() => navigator.clipboard.writeText(link)} className="border border-slate-400 px-4 py-2 rounded-md">Copy Link</button>
              <button disabled={busy} onClick={generateLink} className="border border-slate-400 disabled:opacity-50 px-4 py-2 rounded-md">Generate New Link</button>
            </>
          )}
          {status.connected && (
            <>
              <button disabled={busy} onClick={generateLink} className="border border-slate-400 disabled:opacity-50 px-4 py-2 rounded-md">Reconnect</button>
              <button disabled={busy} onClick={disconnect} className="border border-red-500 text-red-700 disabled:opacity-50 px-4 py-2 rounded-md">Disconnect</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
