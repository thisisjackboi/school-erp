// Robust date/time helpers for API values.
//
// The backend returns full ISO strings like `2026-09-16T00:00:00.000Z` for
// `@db.Date` columns, but time-only fields (exam-schedule start/end times,
// timetable periods) are stored as `1970-01-01T{time}Z` via the `new Date(0)`
// trick. Empty/`null`/numeric payloads also occur. All of these caused naive
// `new Date(value)` + `toLocaleDateString()` rendering to show `1 Jan 1970` or
// raw `1970-01-01T09:00:00.000Z` strings. These helpers normalize every shape.

export function parseApiDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value === 0) return null;
    let ts = value;
    if (ts < 1e11) ts *= 1000; // epoch seconds -> ms
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    const str = value.trim();
    if (!str) return null;

    // Bare date-only strings are intended as LOCAL calendar days; parsing them
    // as UTC midnight can shift them a day (or into 1969/1970) in some zones.
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return isNaN(dt.getTime()) ? null : dt;
    }

    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

export function formatDisplayDate(value: unknown, fallback = "N/A"): string {
  const d = parseApiDate(value);
  if (!d) return fallback;
  return d.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDisplayDateTime(
  value: unknown,
  fallback = "N/A",
): string {
  const d = parseApiDate(value);
  if (!d) return fallback;
  return d.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a time-of-day value. Accepts `HH:mm`, `HH:mm:ss`, ISO datetimes
 * (incl. the backend's `1970-01-01T09:00:00.000Z` time-only encoding), or a
 * `Date`. Never renders the bogus 1970 date part.
 */
export function formatTimeOfDay(value: unknown, fallback = ""): string {
  if (value === null || value === undefined || value === "") return fallback;

  if (typeof value === "string") {
    const str = value.trim();
    const m = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (m) {
      const h = Number(m[1]);
      const period = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${m[2]} ${period}`;
    }
  }

  const d = parseApiDate(value);
  if (!d) return fallback;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function toDateInputValue(value: unknown, fallback = ""): string {
  const d = parseApiDate(value);
  if (!d) return fallback;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toTimeInputValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const m = value.trim().match(/^(\d{1,2}):(\d{2})/);
    if (m) return `${String(Number(m[1])).padStart(2, "0")}:${m[2]}`;
  }

  const d = parseApiDate(value);
  if (!d) return fallback;
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}