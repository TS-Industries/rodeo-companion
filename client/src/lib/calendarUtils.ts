export interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
}

function toICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildICS(event: CalendarEvent): string {
  const start = toICSDate(event.startDate);
  const end = event.endDate
    ? toICSDate(event.endDate)
    : toICSDate(new Date(event.startDate.getTime() + 60 * 60 * 1000));
  const uid = "rodeo-" + Date.now() + "@rodeocompanion.app";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rodeo Companion//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:" + uid,
    "DTSTART:" + start,
    "DTEND:" + end,
    "SUMMARY:" + event.title,
    event.description ? "DESCRIPTION:" + event.description.replace(/\n/g, "\\n") : "",
    event.location ? "LOCATION:" + event.location : "",
    "DTSTAMP:" + toICSDate(new Date()),
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: " + event.title,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadICS(event: CalendarEvent): void {
  const ics = buildICS(event);
  const filename = event.title.replace(/[^a-z0-9]/gi, "_") + ".ics";
  const dataUri = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
  const a = document.createElement("a");
  a.href = dataUri;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function openGoogleCalendar(event: CalendarEvent): void {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const start = fmt(event.startDate);
  const end = event.endDate
    ? fmt(event.endDate)
    : fmt(new Date(event.startDate.getTime() + 60 * 60 * 1000));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: start + "/" + end,
    ...(event.description ? { details: event.description } : {}),
    ...(event.location ? { location: event.location } : {}),
  });
  window.open(
    "https://calendar.google.com/calendar/render?" + params.toString(),
    "_blank"
  );
}

export function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

export function isMobile(): boolean {
  return isIOS() || isAndroid();
}
