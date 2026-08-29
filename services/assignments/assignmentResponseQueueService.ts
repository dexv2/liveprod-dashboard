import Assignment, { ASSIGNMENT_STATUSES } from "@/models/assignment";
import Event from "@/models/event";
import Schedule from "@/models/schedule";
import Volunteer from "@/models/volunteer";

const QUEUE_STATUSES = ["PENDING", "CONFIRMED", "DECLINED", "CHANGE_REQUESTED"] as const;
type QueueStatus = typeof QUEUE_STATUSES[number];
type QueueSourceType = "SCHEDULE" | "EVENT";

export interface AssignmentResponseQueueFilters {
  status?: QueueStatus | "CANCELLED";
  sourceType?: QueueSourceType;
  from?: Date;
  to?: Date;
  includeCancelled?: boolean;
}

export interface AssignmentResponseQueueItem {
  assignmentId: string;
  sourceType: QueueSourceType;
  volunteer: { id: string; name: string };
  role: string;
  status: QueueStatus | "CANCELLED";
  scheduledAt: string;
  respondedAt?: string;
  source: {
    available: boolean;
    title: string;
    date?: string;
    service?: string;
    callTime?: string;
  };
  notification: {
    status: "SENT" | "FAILED" | "SKIPPED_NO_LINK" | "SKIPPED_DISABLED" | "NOT_ATTEMPTED";
  };
}

export const assignmentResponseQueueDependencies: any = { Assignment, Event, Schedule, Volunteer };

export const ASSIGNMENT_RESPONSE_QUEUE_POLICY = {
  defaultPastDays: 7,
  defaultFutureDays: 60,
  maximumCandidates: 500,
  pollingSeconds: 15,
  ordering: ["CHANGE_REQUESTED", "DECLINED", "PENDING", "CONFIRMED", "CANCELLED"]
};

const priority = new Map(ASSIGNMENT_RESPONSE_QUEUE_POLICY.ordering.map((status, index) => [status, index]));

function defaultRange(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila", year: "numeric", month: "numeric", day: "numeric"
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value);
  const manilaDayStart = (offsetDays: number) => new Date(
    Date.UTC(value("year"), value("month") - 1, value("day") + offsetDays) - 8 * 60 * 60 * 1000
  );
  return {
    from: manilaDayStart(-ASSIGNMENT_RESPONSE_QUEUE_POLICY.defaultPastDays),
    to: new Date(manilaDayStart(ASSIGNMENT_RESPONSE_QUEUE_POLICY.defaultFutureDays + 1).getTime() - 1)
  };
}

function notificationStatus(value: unknown): AssignmentResponseQueueItem["notification"]["status"] {
  return ["SENT", "FAILED", "SKIPPED_NO_LINK", "SKIPPED_DISABLED"].includes(String(value))
    ? value as AssignmentResponseQueueItem["notification"]["status"]
    : "NOT_ATTEMPTED";
}

function id(value: any) {
  return value?._id?.toString?.() || value?.toString?.() || "";
}

export function parseAssignmentResponseQueueFilters(params: URLSearchParams, now = new Date()): AssignmentResponseQueueFilters {
  const range = defaultRange(now);
  const status = params.get("status") || undefined;
  const sourceType = params.get("sourceType") || undefined;
  if (status && !ASSIGNMENT_STATUSES.includes(status as any)) throw new Error("INVALID_STATUS");
  if (sourceType && !["SCHEDULE", "EVENT"].includes(sourceType)) throw new Error("INVALID_SOURCE_TYPE");
  const from = params.get("from") ? new Date(`${params.get("from")}T00:00:00+08:00`) : range.from;
  const to = params.get("to") ? new Date(`${params.get("to")}T23:59:59.999+08:00`) : range.to;
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) throw new Error("INVALID_DATE_RANGE");
  return {
    status: status as AssignmentResponseQueueFilters["status"],
    sourceType: sourceType as QueueSourceType | undefined,
    from,
    to,
    includeCancelled: status === "CANCELLED"
  };
}

export async function getAssignmentResponseQueue(
  scheduledBy: string,
  filters: AssignmentResponseQueueFilters = {},
  now = new Date()
) {
  const range = defaultRange(now);
  const from = filters.from || range.from;
  const to = filters.to || range.to;
  const statuses = filters.status
    ? [filters.status]
    : filters.includeCancelled ? [...QUEUE_STATUSES, "CANCELLED"] : [...QUEUE_STATUSES];
  const query: any = { scheduledBy, status: { $in: statuses } };
  if (filters.sourceType) query.sourceType = filters.sourceType;
  const assignments = await assignmentResponseQueueDependencies.Assignment.find(query)
    .select("_id sourceType schedule event volunteer role status scheduledAt respondedAt lastNotificationStatus")
    .sort({ scheduledAt: -1 })
    .limit(ASSIGNMENT_RESPONSE_QUEUE_POLICY.maximumCandidates)
    .lean();

  const volunteerIds = Array.from(new Set<string>(assignments.map((assignment: any) => id(assignment.volunteer)).filter(Boolean)));
  const scheduleIds = Array.from(new Set<string>(assignments.filter((assignment: any) => assignment.sourceType === "SCHEDULE").map((assignment: any) => id(assignment.schedule)).filter(Boolean)));
  const eventIds = Array.from(new Set<string>(assignments.filter((assignment: any) => assignment.sourceType === "EVENT").map((assignment: any) => id(assignment.event)).filter(Boolean)));
  const [volunteers, schedules, events] = await Promise.all([
    assignmentResponseQueueDependencies.Volunteer.find({ _id: { $in: volunteerIds } }).select("name").lean(),
    assignmentResponseQueueDependencies.Schedule.find({ _id: { $in: scheduleIds } }).select("date service role").lean(),
    assignmentResponseQueueDependencies.Event.find({ _id: { $in: eventIds } }).select("eventName date callTime").lean()
  ]);
  const volunteerById = new Map<string, any>(volunteers.map((item: any) => [id(item), item]));
  const scheduleById = new Map<string, any>(schedules.map((item: any) => [id(item), item]));
  const eventById = new Map<string, any>(events.map((item: any) => [id(item), item]));

  const items: AssignmentResponseQueueItem[] = assignments.map((assignment: any) => {
    const volunteer = volunteerById.get(id(assignment.volunteer));
    const source = assignment.sourceType === "SCHEDULE"
      ? scheduleById.get(id(assignment.schedule))
      : eventById.get(id(assignment.event));
    return {
      assignmentId: id(assignment),
      sourceType: assignment.sourceType,
      volunteer: { id: id(assignment.volunteer), name: volunteer?.name || "Deleted volunteer" },
      role: assignment.role,
      status: assignment.status,
      scheduledAt: new Date(assignment.scheduledAt).toISOString(),
      ...(assignment.respondedAt ? { respondedAt: new Date(assignment.respondedAt).toISOString() } : {}),
      source: source ? {
        available: true,
        title: assignment.sourceType === "SCHEDULE" ? `${source.service} service` : source.eventName,
        date: new Date(source.date).toISOString(),
        ...(assignment.sourceType === "SCHEDULE" ? { service: source.service } : {}),
        ...(assignment.sourceType === "EVENT" && source.callTime ? { callTime: source.callTime } : {})
      } : { available: false, title: "Source no longer available" },
      notification: { status: notificationStatus(assignment.lastNotificationStatus) }
    };
  }).filter((item: AssignmentResponseQueueItem) => !item.source.date || (new Date(item.source.date) >= from && new Date(item.source.date) <= to));

  items.sort((left, right) => {
    const statusOrder = (priority.get(left.status) ?? 99) - (priority.get(right.status) ?? 99);
    if (statusOrder) return statusOrder;
    const leftDate = left.source.date ? new Date(left.source.date).getTime() : Number.MAX_SAFE_INTEGER;
    const rightDate = right.source.date ? new Date(right.source.date).getTime() : Number.MAX_SAFE_INTEGER;
    if (leftDate !== rightDate) return leftDate - rightDate;
    return (right.respondedAt || right.scheduledAt).localeCompare(left.respondedAt || left.scheduledAt);
  });
  const summary = { pending: 0, confirmed: 0, declined: 0, changeRequested: 0 };
  for (const item of items) {
    if (item.status === "PENDING") summary.pending += 1;
    if (item.status === "CONFIRMED") summary.confirmed += 1;
    if (item.status === "DECLINED") summary.declined += 1;
    if (item.status === "CHANGE_REQUESTED") summary.changeRequested += 1;
  }
  return { items, summary, range: { from: from.toISOString(), to: to.toISOString() } };
}
