import Availability from "../models/Availability.js";
import Appointment from "../models/Appointment.js";
import {
  combineInTimeZone,
  dateInTimeZone,
  minutesToTime,
} from "../utils/booking.js";

export async function getAvailableSlots({ tenantId, service, date, timeZone }) {
  const rules = await Availability.find({
    tenantId,
    serviceId: service._id,
    date,
    active: true,
  })
    .sort({ startTime: 1 })
    .lean();

  const dayStart = combineInTimeZone(date, "00:00", timeZone);
  const nextDate = new Date(`${date}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const nextDateOnly = nextDate.toISOString().slice(0, 10);
  const dayEnd = combineInTimeZone(nextDateOnly, "00:00", timeZone);

  const appts = await Appointment.find({
    tenantId,
    status: { $in: ["CONFIRMED", "COMPLETED", "NO_SHOW"] },
    startAt: { $lt: dayEnd },
    endAt: { $gt: dayStart },
  }).lean();

  const result = [];
  for (const rule of rules) {
    const [sh, sm] = rule.startTime.split(":").map(Number);
    const [eh, em] = rule.endTime.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;

    for (
      let t = start;
      t + service.durationMinutes <= end;
      t += service.durationMinutes
    ) {
      const startAt = combineInTimeZone(date, minutesToTime(t), timeZone);
      const endAt = combineInTimeZone(
        date,
        minutesToTime(t + service.durationMinutes),
        timeZone,
      );
      if (startAt <= new Date()) continue;
      const conflict = appts.some(
        (a) => a.startAt < endAt && a.endAt > startAt,
      );
      if (!conflict) {
        result.push({
          time: new Intl.DateTimeFormat("en-US", {
            timeZone,
            hour: "numeric",
            minute: "2-digit",
          }).format(startAt),
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        });
      }
    }
  }

  return [...new Map(result.map((x) => [x.startAt, x])).values()].sort((a, b) =>
    a.startAt.localeCompare(b.startAt),
  );
}

export function assertBusinessDate(startAt, date, timeZone) {
  return dateInTimeZone(new Date(startAt), timeZone) === date;
}
