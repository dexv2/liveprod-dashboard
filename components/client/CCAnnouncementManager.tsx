"use client";

import { useState, useEffect, useMemo } from "react";
import GCInputTextWithLabel from "@/components/global/GCInputTextWithLabel";
import { toast } from "react-toastify";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { VIEW_ANNOUNCEMENTS, UPDATE_ANNOUNCEMENTS } from '@/utils/constants';

interface Announcement {
  _id: string;
  title: string;
  message: string;
  theme: 'info' | 'success' | 'warning' | 'error' | 'celebration';
  isActive: boolean;
  createdAt: string;
}

const themes = [
  { value: 'info', label: 'Info (Blue)', color: 'bg-blue-100 text-blue-800' },
  { value: 'success', label: 'Success (Green)', color: 'bg-green-100 text-green-800' },
  { value: 'warning', label: 'Warning (Yellow)', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'error', label: 'Error (Red)', color: 'bg-red-100 text-red-800' },
  { value: 'celebration', label: 'Celebration (Purple)', color: 'bg-purple-100 text-purple-800' }
];

export default function CCAnnouncementManager() {
  const { data: session } = useSession();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState<'info' | 'success' | 'warning' | 'error' | 'celebration'>('info');

  const hasViewAnnouncementsPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(VIEW_ANNOUNCEMENTS);
  }, [session]);

  const hasUpdateAnnouncementsPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(UPDATE_ANNOUNCEMENTS);
  }, [session]);

  useEffect(() => {
    if (!hasViewAnnouncementsPermission) {
      router.push('/');
    }
  }, [hasViewAnnouncementsPermission, router]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements');
      const result = await response.json();
      setAnnouncements(result.data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, theme })
      });

      if (response.ok) {
        toast.success('Announcement created successfully');
        setTitle('');
        setMessage('');
        setTheme('info');
        fetchAnnouncements();
      } else {
        toast.error('Failed to create announcement');
      }
    } catch (error) {
      toast.error('Error creating announcement');
    }
  };

  return (
    <div className="px-8 py-6">
      <h1 className="text-xl font-semibold text-white mb-8">Announcement Manager</h1>
      
      {/* Create Announcement Form */}
      {hasUpdateAnnouncementsPermission && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-semibold mb-4">Create New Announcement</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <GCInputTextWithLabel
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter announcement message"
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Theme</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {themes.map((themeOption) => (
                  <label key={themeOption.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      value={themeOption.value}
                      checked={theme === themeOption.value}
                      onChange={(e) => setTheme(e.target.value as any)}
                      className="mr-2"
                    />
                    <span className={`px-3 py-1 rounded text-sm ${themeOption.color}`}>
                      {themeOption.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Create Announcement
            </button>
          </form>
        </div>
      )}

      {/* Announcements List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Recent Announcements</h2>
        
        {announcements.length === 0 ? (
          <p className="text-gray-500">No announcements found.</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => {
              const themeConfig = themes.find(t => t.value === announcement.theme);
              return (
                <div key={announcement._id} className="border border-gray-200 rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{announcement.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${themeConfig?.color}`}>
                      {themeConfig?.label}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{announcement.message}</p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(announcement.createdAt).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}