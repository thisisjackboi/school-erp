"use client";

import * as React from "react";
import {
  CountryCode,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import {
  AE,
  AU,
  BD,
  CA,
  DE,
  FR,
  GB,
  IN,
  LK,
  NP,
  PK,
  QA,
  SA,
  SG,
  US,
} from "country-flag-icons/react/3x2";

import { cn } from "@/lib/utils";
import { LIMITS } from "@/lib/input-restrictions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PREFERRED_COUNTRIES: CountryCode[] = [
  "IN",
  "US",
  "GB",
  "CA",
  "AU",
  "AE",
  "SA",
  "NP",
  "BD",
  "PK",
  "LK",
  "SG",
  "DE",
  "FR",
  "QA",
];

// Maximum length of the NATIONAL number (without dial code) per country.
// Used to hard-cap input so users can't type more digits than a valid number.
// Countries not listed fall back to a safe global cap.
const NATIONAL_MAX: Record<string, number> = {
  IN: 10,
  US: 10,
  CA: 10,
  GB: 10,
  AU: 9,
  AE: 9,
  SA: 9,
  NP: 10,
  BD: 10,
  PK: 10,
  LK: 9,
  SG: 8,
  DE: 11,
  FR: 9,
  QA: 8,
};

const NATIONAL_DEFAULT_MAX = 12;

function nationalMaxFor(code: CountryCode): number {
  return NATIONAL_MAX[code] ?? NATIONAL_DEFAULT_MAX;
}

// Flag glyphs for the curated list. Keys are ISO country codes.
const FLAGS: Record<string, (props: Record<string, unknown>) => React.ReactElement> = {
  IN,
  US,
  GB,
  CA,
  AU,
  AE,
  SA,
  NP,
  BD,
  PK,
  LK,
  SG,
  DE,
  FR,
  QA,
};

function Flag({ code }: { code: string }) {
  const Glyph = FLAGS[code];
  if (!Glyph) return null;
  // "size-[12px]" is used (not h-/w-*) so the select's [&_svg:not([class*='size-'])]:size-4
  // override doesn't inflate the flag.
  return <Glyph className="size-[12px] shrink-0 rounded-[2px] shadow-sm" title={code} />;
}

// Mirrors the shared Input styling so fields look identical everywhere,
// including the grey "disabled" treatment used across the ERP.
const PHONE_INPUT_CLASSES =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  id?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  className?: string;
}

export const PhoneInput = React.forwardRef<HTMLDivElement, PhoneInputProps>(
  (
    {
      value,
      onChange,
      disabled = false,
      invalid = false,
      placeholder = "Enter phone number",
      id,
      onBlur,
      className,
    },
    ref
  ) => {
    const [country, setCountry] = React.useState<CountryCode>("IN");
    const [national, setNational] = React.useState("");
    const lastEmittedRef = React.useRef<string | null>(null);

    // Re-derive country + national digits only when the external value is set
    // from outside (e.g. loading a record or clearing the form). Values that WE
    // emitted and echoed back are ignored so a manual selection is never clobbered.
    React.useEffect(() => {
      const v = (value || "").trim();
      if (v === lastEmittedRef.current) return;
      lastEmittedRef.current = null;

      if (v.startsWith("+")) {
        const parsed = parsePhoneNumberFromString(v);
        if (parsed?.country) {
          setCountry(parsed.country);
          setNational(parsed.nationalNumber);
          return;
        }
        // Incomplete international value (e.g. a bare "+1") — keep current country.
        return;
      }
      if (/^\d+$/.test(v)) {
        // Legacy bare digits (pre-E.164 rows): treat as India.
        setCountry("IN");
        setNational(v);
        return;
      }
      setCountry("IN");
      setNational("");
    }, [value]);

    // Ensure the auto-detected country is always selectable, even when it is
    // outside the curated list (e.g. a number loaded with a foreign dial code).
    const options: CountryCode[] = PREFERRED_COUNTRIES.includes(country)
      ? PREFERRED_COUNTRIES
      : [country, ...PREFERRED_COUNTRIES];

    const emit = (nextCountry: CountryCode, nextNational: string) => {
      const dial = String(getCountryCallingCode(nextCountry));
      const maxNational = Math.min(
        nationalMaxFor(nextCountry),
        LIMITS.PHONE_INTL_MAX - dial.length
      );
      const digits = nextNational.replace(/\D/g, "").slice(0, maxNational);
      const next = `+${dial}${digits}`;
      lastEmittedRef.current = next;
      onChange(next);
    };

    const changeCountry = (next: string) => {
      const nextCountry = next as CountryCode;
      setCountry(nextCountry);
      emit(nextCountry, national);
    };

    const changeNational = (raw: string) => {
      const maxNational = Math.min(
        nationalMaxFor(country),
        LIMITS.PHONE_INTL_MAX - String(getCountryCallingCode(country)).length
      );
      const digits = raw.replace(/\D/g, "").slice(0, maxNational);
      setNational(digits);
      emit(country, digits);
    };

    return (
      <div ref={ref} className={cn("flex items-stretch gap-1", className)}>
        <Select
          value={country}
          disabled={disabled}
          onValueChange={changeCountry}
        >
          <SelectTrigger
            className="h-9 w-auto gap-1 rounded-md px-2 data-[size=default]:h-9"
            aria-label="Country code"
          >
            <SelectValue className="flex items-center gap-1.5 text-xs font-semibold" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            align="start"
            className="max-h-64 border bg-white shadow-lg dark:bg-slate-900"
          >
            {options.map((code) => (
              <SelectItem
                key={code}
                value={code}
                className="gap-2 text-xs"
              >
                <Flag code={code} />
                <span>+{getCountryCallingCode(code)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          id={id}
          type="tel"
          inputMode="tel"
          value={national}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          placeholder={placeholder}
          onChange={(event) => changeNational(event.target.value)}
          onBlur={onBlur}
          className={cn(
            PHONE_INPUT_CLASSES,
            "min-w-0",
            invalid && "border-red-500 ring-1 ring-red-500/40 focus-visible:ring-red-500",
            className
          )}
        />
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";