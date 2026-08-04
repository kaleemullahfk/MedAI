"""Helpers for normalizing and validating appointment time slots."""

import re

# Accepts "HH:MM" (24h, from <input type="time">) and "h:mm AM/PM" / "HH:MM AM/PM".
_TIME_24H_RE = re.compile(r"^([01]?\d|2[0-3]):([0-5]\d)$")
_TIME_12H_RE = re.compile(r"^(\d{1,2}):([0-5]\d)\s*([AaPp][Mm])$")


def normalize_time(value: str) -> str:
    """Normalize a time string to ``HH:MM`` (24h).

    Raises ``ValueError`` for anything that is not a valid time.
    """
    text = value.strip()

    m = _TIME_24H_RE.match(text)
    if m:
        return f"{int(m.group(1)):02d}:{m.group(2)}"

    m = _TIME_12H_RE.match(text)
    if m:
        hour = int(m.group(1))
        minute = m.group(2)
        meridiem = m.group(3).lower()
        if hour < 1 or hour > 12:
            raise ValueError(f"Invalid time: {value!r}")
        if meridiem == "am":
            hour = 0 if hour == 12 else hour
        else:  # pm
            hour = hour if hour == 12 else hour + 12
        return f"{hour:02d}:{minute}"

    raise ValueError(f"Invalid time format: {value!r}. Use HH:MM (24h) or h:mm AM/PM.")


def minutes_since_midnight(time_24h: str) -> int:
    hour, minute = time_24h.split(":")
    return int(hour) * 60 + int(minute)


def parse_available_window(window: str) -> tuple[int, int]:
    """Parse a doctor's ``available_time`` like ``"09:00 AM - 05:00 PM"``.

    Returns ``(start_minutes, end_minutes)``. Missing/ambiguous windows are
    treated as fully open (00:00 - 23:59) so booking is not blocked by bad
    data. Raises ValueError only for clearly malformed single boundaries.
    """
    if not window:
        return 0, 24 * 60 - 1

    parts = [p for p in re.split(r"-|–|—", window) if p.strip()]
    if len(parts) != 2:
        return 0, 24 * 60 - 1

    try:
        start = minutes_since_midnight(normalize_time(parts[0].strip()))
        end = minutes_since_midnight(normalize_time(parts[1].strip()))
    except ValueError:
        return 0, 24 * 60 - 1

    if end <= start:
        return 0, 24 * 60 - 1

    return start, end


def slot_in_window(slot_24h: str, available_window: str) -> bool:
    slot = minutes_since_midnight(slot_24h)
    start, end = parse_available_window(available_window)
    return start <= slot <= end
