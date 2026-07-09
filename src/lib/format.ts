const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFa(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => faDigits[Number(d)]);
}

export function money(amount: number): string {
  return toFa(amount.toLocaleString("en-US")) + " تومان";
}

const faMonths = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
const gMonths = ["ژانویه","فوریه","مارس","آوریل","مه","ژوئن","ژوئیه","اوت","سپتامبر","اکتبر","نوامبر","دسامبر"];
const weekdays = ["یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"];

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const dateStr = `${weekdays[d.getDay()]} ${toFa(d.getDate())} ${gMonths[d.getMonth()]}`;
  const time = `${toFa(String(d.getHours()).padStart(2, "0"))}:${toFa(String(d.getMinutes()).padStart(2, "0"))}`;
  return `${dateStr} — ساعت ${time}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${weekdays[d.getDay()]} ${toFa(d.getDate())} ${gMonths[d.getMonth()]}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${toFa(String(d.getHours()).padStart(2, "0"))}:${toFa(String(d.getMinutes()).padStart(2, "0"))}`;
}

export function mmss(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${toFa(String(m).padStart(2, "0"))}:${toFa(String(s).padStart(2, "0"))}`;
}

// re-export unused var placeholder
export const _fa = faMonths;
