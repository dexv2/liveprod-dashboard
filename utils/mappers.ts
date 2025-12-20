// Small explicit mappers to convert Mongoose documents / aggregation results
// into plain JSON-friendly DTOs for passing from Server Components to
// Client Components. This replaces ad-hoc JSON.stringify usage with typed
// mappers that select only the fields the clients need.

export function toVolunteerDTO(v: any) {
  if (!v) return null;
  return {
    _id: v._id ? String(v._id) : undefined,
    name: v.name || undefined,
    firstName: v.firstName || undefined,
    lastName: v.lastName || undefined,
    nickName: v.nickName || undefined,
    status: v.status || undefined,
    segment: v.segment || undefined,
    roles: Array.isArray(v.roles) ? v.roles : [],
    gender: v.gender || undefined,
    phone: v.phone || undefined,
    trainings: v.trainings || v.trainingsAttended || [],
    trainingsAttended: v.trainingsAttended || v.trainings || [],
    volunteerId: v.volunteerId || undefined,
    schedules: Array.isArray(v.schedules) ? v.schedules.map(toScheduleBriefDTO) : []
  };
}

export function toVolunteerListDTO(v: any) {
  if (!v) return null;
  return {
    _id: v._id ? String(v._id) : undefined,
    name: v.name || `${v.firstName || ''} ${v.lastName || ''}`.trim(),
    firstName: v.firstName || undefined,
    lastName: v.lastName || undefined,
    nickName: v.nickName || undefined,
    status: v.status || undefined,
    segment: v.segment || undefined,
    gender: v.gender || undefined,
    roles: Array.isArray(v.roles) ? v.roles : [],
    active: !!v.active,
    volunteerId: v.volunteerId || undefined
  };
}

export function toScheduleBriefDTO(s: any) {
  if (!s) return null;
  return {
    _id: s._id ? String(s._id) : undefined,
    role: s.role || undefined,
    date: s.date ? new Date(s.date).toISOString() : undefined,
    service: s.service || undefined,
    volunteer: s.volunteer ? (Array.isArray(s.volunteer) ? s.volunteer.map((v: any) => toVolunteerListDTO(v)) : toVolunteerListDTO(s.volunteer)) : undefined
  };
}

export function mapServiceObject(serviceObj: any) {
  if (!serviceObj) return {};
  const out: any = {};
  for (const key of Object.keys(serviceObj)) {
    const arr = serviceObj[key];
    out[key] = Array.isArray(arr) ? arr.map((item: any) => {
      // item may be { date, volunteer, id } or similar
      const date = item.date ? new Date(item.date).toISOString() : undefined;
      const volunteers = item.volunteer ? (Array.isArray(item.volunteer) ? item.volunteer.map((v: any) => toVolunteerListDTO(v)) : [toVolunteerListDTO(item.volunteer)]) : [];
      return {
        _id: item._id ? String(item._id) : (item.id ? String(item.id) : undefined),
        id: item.id ? String(item.id) : (item._id ? String(item._id) : undefined),
        date,
        role: item.role || undefined,
        service: item.service || undefined,
        volunteer: volunteers
      };
    }) : [];
  }
  return out;
}

export function toCalendarEventDTO(entry: any) {
  if (!entry) return null;
  // If entry has a start/end Date, convert to ISO strings
  return {
    id: entry.id ? String(entry.id) : undefined,
    title: entry.title || entry.name || 'Event',
    start: entry.start ? new Date(entry.start).toISOString() : undefined,
    end: entry.end ? new Date(entry.end).toISOString() : undefined,
    resource: entry.resource || entry,
    color: entry.color || undefined,
    className: entry.className || undefined
  };
}

export function toMergedScheduleDTO(schedule: any) {
  if (!schedule) return schedule;
  return {
    saturday: schedule.saturday,
    sunday: schedule.sunday,
    data: Array.isArray(schedule.data) ? schedule.data.map((d: any) => ({
      _id: d._id ? String(d._id) : (d.id ? String(d.id) : undefined),
      id: d.id ? String(d.id) : (d._id ? String(d._id) : undefined),
      role: d.role || undefined,
      date: d.date ? new Date(d.date).toISOString() : undefined,
      volunteer: d.volunteer ? (Array.isArray(d.volunteer) ? d.volunteer.map((v: any) => toVolunteerListDTO(v)) : [toVolunteerListDTO(d.volunteer)]) : []
    })) : []
  };
}

export function toServiceArray(arr: any[]) {
  return Array.isArray(arr) ? arr.map((a: any) => ({
    _id: a._id ? String(a._id) : (a.id ? String(a.id) : undefined),
    id: a.id ? String(a.id) : (a._id ? String(a._id) : undefined),
    date: a.date ? new Date(a.date).toISOString() : undefined,
    volunteer: a.volunteer ? (Array.isArray(a.volunteer) ? a.volunteer.map((v: any) => toVolunteerListDTO(v)) : [toVolunteerListDTO(a.volunteer)]) : []
  })) : [];

}

export default {};
