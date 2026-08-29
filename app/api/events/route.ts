import connectMongoDB from "@/libs/mongodb";
import { auth } from "@/auth";
import Event from "@/models/event";
import { NextRequest, NextResponse } from "next/server";
import { createGCalEvent } from "@/utils/gcal";
import { AssignmentInputError, reconcileEventAssignments, validateEventAssignments } from "@/services/assignments/assignmentService";
import { AssignmentAuthenticationError, requireAssignmentAdmin } from "@/utils/assignmentAuth";

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
    delete eventData.scheduledBy;
    delete eventData.adminId;
    
    await connectMongoDB();
    const scheduledBy = await requireAssignmentAdmin(await auth());
    eventData.assignedVolunteers = await validateEventAssignments(eventData.assignedVolunteers);
    
    const event = new Event(eventData);
    await event.save();

    await reconcileEventAssignments(event._id.toString(), scheduledBy);
    
    // Sync to Google Calendar if event is confirmed and has required fields
    if (eventData.status === 'confirmed' && eventData.venue) {
      try {
        const googleEventId = await createGCalEvent({
          eventName: eventData.eventName,
          date: eventData.date,
          startTime: eventData.startTime || '00:00',
          endTime: eventData.endTime || '23:59',
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
    if (error instanceof AssignmentAuthenticationError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof AssignmentInputError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Event creation error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
