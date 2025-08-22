import {
  getCountryCallingCode,
  parsePhoneNumberFromString,
  AsYouType,
  getCountries,
} from "libphonenumber-js";

export type CountryOption = {
  code: string;
  name: string;
  dial: string;
};

export const DEFAULT_COUNTRY = "US";

let regionNames: Intl.DisplayNames | null = null;
try {
  regionNames = new Intl.DisplayNames([navigator?.language || "en"], {
    type: "region",
  });
} catch {
  regionNames = null;
}

let _cache: CountryOption[] | null = null;

export function getAllCountries(): CountryOption[] {
  if (_cache) return _cache;

  const isoList = getCountries();
  const out: CountryOption[] = [];

  for (const code of isoList) {
    try {
      const dial = `+${getCountryCallingCode(code as any)}`;
      if (!/^\+\d+$/.test(dial)) continue;

      const name =
        (regionNames && (regionNames as any).of
          ? (regionNames as any).of(code)
          : code) || code;

      out.push({ code, name, dial });
    } catch {
    }
  }

  out.sort((a, b) => a.name.localeCompare(b.name));
  _cache = out;
  return out;
}

export function getCountryByCode(code?: string): CountryOption {
  const list = getAllCountries();
  return (
    list.find((c) => c.code === (code || DEFAULT_COUNTRY)) ||
    list.find((c) => c.code === DEFAULT_COUNTRY)!
  );
}

export function toE164(iso: string, localDigits: string): string {
  const cleaned = localDigits.replace(/\D/g, "");
  const parsed = parsePhoneNumberFromString(cleaned, iso as any);
  if (parsed?.isValid()) return parsed.number;

  const dial = `+${getCountryCallingCode(iso as any)}`;
  return `${dial}${cleaned}`;
}

export function isValidE164(iso: string, value: string): boolean {
  const parsed = parsePhoneNumberFromString(value, iso as any);
  if (parsed) return parsed.isValid();
  return /^\+[1-9]\d{6,14}$/.test(value);
}

export function formatAsYouType(iso: string, input: string): string {
  const typer = new AsYouType(iso as any);
  return typer.input(input);
}