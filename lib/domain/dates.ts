const q360DatePattern =
  /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/;

export function parseQ360Date(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  const q360Match = trimmedValue.match(q360DatePattern);
  if (q360Match) {
    const [
      ,
      year,
      month,
      day,
      hour = "0",
      minute = "0",
      second = "0",
      milliseconds = "0",
    ] = q360Match;

    const parsedDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      Number(milliseconds.padEnd(3, "0")),
    );

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const fallbackDate = new Date(trimmedValue);
  return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
}
