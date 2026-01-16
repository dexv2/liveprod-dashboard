export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import connectMongoDB from "@/libs/mongodb";
import Event from "@/models/event";
import { NextRequest, NextResponse } from "next/server";
import { createGCalEvent } from "@/utils/gcal";

export async function GET() {
  try {
    await connectMongoDB();
    const events = await Event.find({}).sort({ date: 1 });
    return NextResponse.json({ data: events }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();
    
    // Filter out empty values from assignedVolunteers but keep N/A and TBC
    if (eventData.assignedVolunteers) {
      const filteredVolunteers: any = {};
      Object.entries(eventData.assignedVolunteers).forEach(([key, value]) => {
        if (value && value !== "") {
          filteredVolunteers[key] = value;
        }
      });
      eventData.assignedVolunteers = filteredVolunteers;
    }
    
    await connectMongoDB();
    
    const event = new Event(eventData);
    await event.save();
    
    // Sync to Google Calendar if event is confirmed and has required fields
    if (eventData.status === 'confirmed' && eventData.startTime && eventData.endTime && eventData.venue) {
      try {
        const googleEventId = await createGCalEvent({
          eventName: eventData.eventName,
          date: eventData.date,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          venue: eventData.venue,
          otherDetails: eventData.otherDetails
        });
        
        (event as any).googleCalendarEventId = googleEventId;
        await event.save();
      } catch (gcalError) {
        console.error('Google Calendar sync error:', gcalError);
        // Continue without failing the event creation
      }
    }
    
    return NextResponse.json({ message: "Event created successfully", data: event }, { status: 201 });
  } catch (error: any) {
    console.error('Event creation error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}