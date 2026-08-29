import connectMongoDB from "@/libs/mongodb";
import { auth } from "@/auth";
import Event from "@/models/event";
import { NextRequest, NextResponse } from "next/server";
import { createGCalEvent, deleteGCalEvent, updateGCalEvent } from "@/utils/gcal";
import { AssignmentInputError, deleteEvent, reconcileEventAssignments, validateEventAssignments } from "@/services/assignments/assignmentService";
import { AssignmentAuthenticationError, requireAssignmentAdmin } from "@/utils/assignmentAuth";

export async function GET(request: NextRequest, { params }: any) {
  try {
    await connectMongoDB();
    
    const event = await Event.findById(params.id);
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    
    return NextResponse.json({ event }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: any) {
  try {
    const updateData = await request.json();
    delete updateData.scheduledBy;
    delete updateData.adminId;
    await connectMongoDB();
    const scheduledBy = await requireAssignmentAdmin(await auth());
    
    const event = await Event.findById(params.id);
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    if (Object.prototype.hasOwnProperty.call(updateData, "assignedVolunteers")) {
      updateData.assignedVolunteers = await validateEventAssignments(updateData.assignedVolunteers);
    }
    
    // Update all provided fields
    Object.keys(updateData).forEach(key => {
      (event as any)[key] = updateData[key];
    });
    
    await event.save();

    await reconcileEventAssignments(event._id.toString(), scheduledBy);
    
    // Sync to Google Calendar if event is confirmed
    if (event.status === 'confirmed') {
      try {
        if (event.googleCalendarEventId) {
          // Update existing Google Calendar event
          await updateGCalEvent(event.googleCalendarEventId, {
            eventName: event.eventName,
            date: event.date.toISOString().split('T')[0],
            startTime: event.startTime || '00:00',
            endTime: event.endTime || '23:59',
            venue: event.venue || '',
            otherDetails: event.otherDetails || ''
          });
        } else {
          // Create new Google Calendar event
          const googleEventId = await createGCalEvent({
            eventName: event.eventName,
            date: event.date.toISOString().split('T')[0],
            startTime: event.startTime || '00:00',
            endTime: event.endTime || '23:59',
            venue: event.venue || '',
            otherDetails: event.otherDetails || ''
          });
          
          (event as any).googleCalendarEventId = googleEventId;
          await event.save();
        }
      } catch (gcalError) {
        console.error('Google Calendar sync error:', gcalError);
        // Continue without failing the event update
      }
    }
    
    return NextResponse.json({ message: "Event updated successfully" }, { status: 200 });
  } catch (error: any) {
    if (error instanceof AssignmentAuthenticationError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    if (error instanceof AssignmentInputError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: any, { params }: any) {
  try {
    await connectMongoDB();
    const cancelledBy = await requireAssignmentAdmin(await auth());
    const { eventName, googleCalendarEventId: calendarEventId } = await deleteEvent(params.id, cancelledBy);
    let calendarCleanupPending = false;
    if (calendarEventId) {
      try {
        await deleteGCalEvent(calendarEventId);
      } catch (calendarError) {
        calendarCleanupPending = true;
        console.error(`Google Calendar cleanup failed for ${calendarEventId}:`, calendarError);
      }
    }
    return NextResponse.json({
      message: `${eventName} event deleted!`,
      success: true,
      ...(calendarCleanupPending ? { calendarCleanupPending: true } : {})
    }, {status: 200});
  } catch (error: any) {
    if (error instanceof AssignmentAuthenticationError) {
      return NextResponse.json({ message: error.message, success: false }, { status: error.status });
    }
    if (error instanceof AssignmentInputError) {
      return NextResponse.json({ message: error.message, success: false }, { status: error.status });
    }
    return NextResponse.json({message: error.message, success: false}, {status: 500});
  }
}
