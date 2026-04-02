import { getSchedulesByRole } from "@/utils/apis/get";
import CCEnhancedMonthlyCalendar from "../client/CCEnhancedMonthlyCalendar";
import { CalendarEvent } from "@/utils/calendarUtils";
import GCalEvent from "@/models/gcalEvent";
import connectMongoDB from "@/libs/mongodb";

interface SCMonthlyCalendarProps {
  role?: string;
  startDate?: Date;
  endDate?: Date;
  showStatistics?: boolean;
  showLiveProductionEvents?: boolean;
  isAdmin?: boolean;
}

export default async function SCMonthlyCalendar({
  role,
  startDate,
  endDate,
  showStatistics = true,
  showLiveProductionEvents = true,
  isAdmin = false
}: SCMonthlyCalendarProps) {
  try {
    let schedules: any[] = [];
    
    if (role) {
      const roleSchedules = await getSchedulesByRole(role);
      schedules = roleSchedules?.data || [];
    } else {
      const allRoles = [
        'foh', 'foh assistant', 'foh trainee', 'foh assistant trainee', 'foh observer',
        'monitor mix', 'rf tech', 'monitor mix trainee', 'monitor mix observer',
        'broadcast mix', 'broadcast mix assistant', 'broadcast mix trainee', 
        'broadcast mix assistant trainee', 'broadcast mix observer',
        'nxtgen', 'nxtgen trainee', 'nxtgen observer',
        'audio volunteer 1', 'audio volunteer 2'
      ];
      
      const allSchedules = await Promise.all(
        allRoles.map(role => getSchedulesByRole(role))
      );
      
      schedules = allSchedules
        .filter(res => res?.data && Array.isArray(res.data))
        .flatMap(res => res.data)
        .filter(schedule => {
          if (!schedule || !schedule._id) {
            console.warn('Invalid schedule found:', schedule);
            return false;
          }
          if (!schedule.role) {
            console.warn('Schedule missing role:', schedule);
          }
          return true;
        });
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      schedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date);
        return scheduleDate >= startDate && scheduleDate <= endDate;
      });
    }

    // Load Google Calendar events for same range
    const now = new Date();
    const gFrom = startDate || new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const gTo = endDate || new Date(now.getFullYear(), now.getMonth() + 6, 0);

    await connectMongoDB();
    const gcalDocs = await GCalEvent.find({
      start: { $lte: gTo },
      end: { $gte: gFrom },
    }).lean();

    const gcalEvents: CalendarEvent[] = gcalDocs.map((doc: any) => ({
      id: `gcal:${doc.externalId}`,
      title: doc.title || 'Untitled',
      start: new Date(doc.start),
      end: new Date(doc.end),
      resource: {
        role: 'Event',
        volunteer: doc.location || '',
        service: 'gcal',
        serviceName: 'Google Calendar',
        serviceTime: '',
        date: '',
        scheduleId: doc.externalId
      },
      color: '#059669',
      className: 'gcal-event'
    }));

    return (
      <CCEnhancedMonthlyCalendar
        schedules={[...schedules, ...gcalEvents]}
        showStatistics={showStatistics}
        showLiveProductionEvents={showLiveProductionEvents}
        isAdmin={isAdmin}
      />
    );
  } catch (error) {
    console.error('Error loading calendar data:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error Loading Calendar</h3>
        <p className="text-red-600 text-sm mt-1">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
      </div>
    );
  }
}
