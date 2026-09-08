export function parseDateOnly(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const d = new Date(`${date}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function minutesToTime(total) {
  const h = Math.floor(total / 60).toString().padStart(2, '0');
  const m = (total % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function getWeekday(dateOnly) {
  return new Date(`${dateOnly}T00:00:00.000Z`).getUTCDay();
}

// Converts a business-local wall-clock date/time into an absolute UTC instant.
// The IANA timezone is stored on the tenant, so DST rules are respected.
export function combineInTimeZone(dateOnly, time, timeZone) {
  const [year, month, day] = dateOnly.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  let guess = Date.UTC(year, month - 1, day, hour, minute);

  for (let i = 0; i < 3; i += 1) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date(guess));
    const values = Object.fromEntries(parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
    const observed = Date.UTC(
      Number(values.year), Number(values.month) - 1, Number(values.day),
      Number(values.hour), Number(values.minute)
    );
    const desired = Date.UTC(year, month - 1, day, hour, minute);
    guess += desired - observed;
  }

  return new Date(guess);
}

export function dateInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function timeInTimeZone(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).format(date);
}

// Kept for backwards compatibility with existing code.
export function combineUtc(dateOnly, time) {
  return new Date(`${dateOnly}T${time}:00.000Z`);
}
