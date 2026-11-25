/**
 * Locale configuration shared by server and client.
 *
 * Safe to import from anywhere — no `server-only`, no React, no side effects.
 * The dictionaries themselves live in `./dictionaries` and are server-only.
 */

export const locales = ["en", "ar"] as const;

export type Locale = (typeof locales)[number];

export type Direction = "ltr" | "rtl";

export const defaultLocale: Locale = "en";

export const direction: Record<Locale, Direction> = {
  en: "ltr",
  ar: "rtl",
};

/**
 * BCP 47 tags used for `Intl` formatting — deliberately not the same as the route
 * segment.
 *
 * `ar-u-nu-arab` pins Arabic to Arabic-Indic digits (٠-٩) through the Unicode
 * extension rather than trusting the host ICU's regional default, which varies
 * between Node builds and browsers and would otherwise be a hydration mismatch.
 */
export const intlLocale: Record<Locale, string> = {
  en: "en-GB",
  ar: "ar-u-nu-arab",
};

/** `openGraph.locale` values. */
export const openGraphLocale: Record<Locale, string> = {
  en: "en_GB",
  ar: "ar_AR",
};

export const localeNames: Record<
  Locale,
  { native: string; english: string; short: string }
> = {
  en: { native: "English", english: "English", short: "EN" },
  ar: { native: "العربية", english: "Arabic", short: "ع" },
};

export const LOCALE_COOKIE = "NEXT_LOCALE";

/** One year. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Search param carrying the active view, so language switches keep your place. */
export const VIEW_PARAM = "view";

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && (locales as readonly string[]).includes(value);
}

/** Strips a leading `/en` or `/ar` from a pathname. Returns "/" for a bare locale. */
export function stripLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

/** Builds the equivalent path in another locale, preserving the rest of the route. */
export function localizePath(pathname: string, locale: Locale): string {
  const rest = stripLocale(pathname);
  return rest === "/" ? `/${locale}` : `/${locale}${rest}`;
}
