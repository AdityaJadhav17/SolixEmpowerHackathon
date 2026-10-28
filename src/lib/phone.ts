export const FALLBACK_TEL = "tel:+18006999075"; // OHP Customer Service

// First US 10-digit number in the text; ignores extensions and TTY numbers after it.
const US_PHONE =
  /(?<!\d)(?:\+?1[\s.-]*)?\(?(\d{3})\)?[\s.-]*(\d{3})[\s.-]*(\d{4})(?!\d)/;

export function phoneHref(phone: string): string {
  const m = phone.match(US_PHONE);
  return m ? `tel:+1${m[1]}${m[2]}${m[3]}` : FALLBACK_TEL;
}
