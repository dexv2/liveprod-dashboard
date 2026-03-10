"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { VIEW_ANALYTICS } from '@/utils/constants';

export default function CCAdminAnalytics() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isMetabaseOnline, setIsMetabaseOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const metabaseUrl = process.env.NEXT_PUBLIC_METABASE_URL || 'http://10.200.100.135:3000';

  const hasViewAnalyticsPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(VIEW_ANALYTICS);
  }, [session]);

  useEffect(() => {
    if (!hasViewAnalyticsPermission) {
      router.push('/');
    }
  }, [hasViewAnalyticsPermission, router]);
  
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${metabaseUrl}/api/health`, { 
          method: 'HEAD',
          mode: 'no-cors'
        });
        setIsMetabaseOnline(true);
      } catch (error) {
        setIsMetabaseOnline(false);
      }
      setLoading(false);
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, [metabaseUrl]);
  
  if (loading) {
    return (
      <div className="px-8 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-white">Checking Metabase connection...</div>
        </div>
      </div>
    );
  }
  
  if (!isMetabaseOnline) {
    return (
      <div className="px-8 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Metabase Server Unavailable</h2>
          <p className="text-red-600 mb-4">
            Cannot connect to Metabase server at {metabaseUrl}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Volunteer Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Volunteer Status Distribution</h2>
          <div className="h-64">
            <iframe
              src={`${metabaseUrl}/embed/question/QUESTION_ID_1#bordered=true&titled=false`}
              frameBorder="0"
              width="100%"
              height="100%"
              allowTransparency
            />
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Gender Distribution</h2>
          <div className="h-64">
            <iframe
              src={`${metabaseUrl}/embed/question/QUESTION_ID_2#bordered=true&titled=false`}
              frameBorder="0"
              width="100%"
              height="100%"
              allowTransparency
            />
          </div>
        </div>

        {/* Segment Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Volunteers by Segment</h2>
          <div className="h-64">
            <iframe
              src={`${metabaseUrl}/embed/question/QUESTION_ID_3#bordered=true&titled=false`}
              frameBorder="0"
              width="100%"
              height="100%"
              allowTransparency
            />
          </div>
        </div>

        {/* Schedule Trends */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Schedule Trends (Last 6 Months)</h2>
          <div className="h-64">
            <iframe
              src={`${metabaseUrl}/embed/question/QUESTION_ID_4#bordered=true&titled=false`}
              frameBorder="0"
              width="100%"
              height="100%"
              allowTransparency
            />
          </div>
        </div>

        {/* Top Roles */}
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Top 10 Roles by Schedule Count</h2>
          <div className="h-64">
            <iframe
              src={`${metabaseUrl}/embed/question/QUESTION_ID_5#bordered=true&titled=false`}
              frameBorder="0"
              width="100%"
              height="100%"
              allowTransparency
            />
          </div>
        </div>
      </div>
    </div>
  );
}