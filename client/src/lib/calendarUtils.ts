/**
 * Calendar integration utilities
 * Supports Apple Calendar (iOS/macOS), Google Calendar, and generic ICS download
 * for Android and other platforms.
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
}

/**
 * Formats a Date to the ICS datetime format: YYYYMMDDTHHMMSSZ
 */
function toICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Generates an ICS file blob for the event and triggers download.
 * Works on all platforms — Android, desktop, etc.
 */
export function downloadICS(event: CalendarEvent): void {
  const start = toICSDate(event.startDate);
  const end = event.endDate ? toICSDate(event.endDate) : toICSDate(new Date(event.startDate.getTime() + 60 * 60 * 1000));
  const uid = `rodeo-${Date.now()}@rodeocompanion.app`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rodeo Companion//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}` : "",
    event.location ? `LOCATION:${event.location}` : "",
    `DTSTAMP:${toICSDate(new Date())}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${event.title}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]/gi, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Opens Google Calendar's "add event" page in a new tab.
 */
export function openGoogleCalendar(event: CalendarEvent): void {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const start = fmt(event.startDate);
  const end = event.endDate ? fmt(event.endDate) : fmt(new Date(event.startDate.getTime() + 60 * 60 * 1000));

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    ...(event.description ? { details: event.description } : {}),
    ...(event.location ? { location: event.location } : {}),
  });

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank");
}

/**
 * Detects the platform and picks the best calendar action:
 * - iOS/macOS: downloads ICS (opens natively in Apple Calendar)
 * - Android: downloads ICS (opens in default calendar app)
 * - Desktop: shows Google Calendar link + ICS download
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

export function isMobile(): boolean {
  return isIOS() || isAndroid();
}
