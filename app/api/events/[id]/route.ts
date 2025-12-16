import connectMongoDB from "@/libs/mongodb";
import Event from "@/models/event";
import { NextRequest, NextResponse } from "next/server";
import { createGCalEvent, updateGCalEvent } from "@/utils/gcal";

export async function PUT(request: NextRequest, { params }: any) {
  try {
    const updateData = await request.json();
    await connectMongoDB();
    
    const event = await Event.findById(params.id);
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    
    // Update all provided fields
    Object.keys(updateData).forEach(key => {
      event[key] = updateData[key];
    });
    
    await event.save();
    
    // Sync to Google Calendar if event is confirmed
    if (event.status === 'confirmed' && event.startTime && event.endTime) {
      try {
        if (event.googleCalendarEventId) {
          // Update existing Google Calendar event
          await updateGCalEvent(event.googleCalendarEventId, {
            eventName: event.eventName,
            date: event.date,
            startTime: event.startTime,
            endTime: event.endTime,
            venue: event.venue,
            otherDetails: event.otherDetails
          });
        } else {
          // Create new Google Calendar event
          const googleEventId = await createGCalEvent({
            eventName: event.eventName,
            date: event.date,
            startTime: event.startTime,
            endTime: event.endTime,
            venue: event.venue,
            otherDetails: event.otherDetails
          });
          
          event.googleCalendarEventId = googleEventId;
          await event.save();
        }
      } catch (gcalError) {
        console.error('Google Calendar sync error:', gcalError);
        // Continue without failing the event update
      }
    }
    
    return NextResponse.json({ message: "Event updated successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}