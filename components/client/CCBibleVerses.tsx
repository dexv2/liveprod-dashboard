"use client";

import { useEffect, useState } from "react";

interface DailyVerse {
  text: string;
  reference: string;
}

export default function CCBibleVerses() {
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);

  useEffect(() => {
    const fetchDailyVerse = async () => {
      try {
        // Fetch YouVersion's Verse of the Day via their RSS feed
        const response = await fetch('/api/youversion-votd');
        const data = await response.json();
        
        if (data.verse && data.reference) {
          setDailyVerse({
            text: data.verse,
            reference: `${data.reference} NIV`
          });
        }
      } catch (error) {
        console.error('Error fetching daily verse:', error);
      }
    };
    fetchDailyVerse();
  }, []);

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg px-4 py-2 md:px-6 shadow-sm w-full">
        {dailyVerse ? (
          <>
            <p className="text-sm md:text-base text-amber-800 italic mb-2">
              &ldquo;{dailyVerse.text}&rdquo;
            </p>
            <p className="text-xs md:text-sm text-amber-700 font-medium text-right">{dailyVerse.reference}</p>
          </>
        ) : (
          <p className="text-sm md:text-base text-amber-800">Loading daily verse...</p>
        )}
      </div>
    </div>
  );
}
