import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = "INR"): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency === "INR" ? "INR" : currency,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

const IN_WORDS_ONES = [
  "",
  "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const IN_WORDS_TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
  "Eighty", "Ninety",
];

function inWordsBelowHundred(n: number): string {
  if (n < 20) return IN_WORDS_ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return IN_WORDS_TENS[tens] + (ones ? ` ${IN_WORDS_ONES[ones]}` : "");
}

function inWordsHundred(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return (
    (hundreds ? `${IN_WORDS_ONES[hundreds]} Hundred` : "") +
    (hundreds && rest ? " " : "") +
    (rest ? inWordsBelowHundred(rest) : "")
  );
}

function inWordsIndian(n: number): string {
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (crore) parts.push(`${inWordsHundred(crore)} Crore`);
  if (lakh) parts.push(`${inWordsHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${inWordsHundred(thousand)} Thousand`);
  if (rest || parts.length === 0) parts.push(inWordsHundred(rest));
  return parts.join(" ");
}

export function amountInWords(amount: number): string {
  const whole = Math.floor(amount);
  const paise = Math.round((amount - whole) * 100);
  const main = whole ? inWordsIndian(whole) : "Zero";
  const paisePart =
    paise > 0 ? ` and ${inWordsBelowHundred(paise)} Paise` : "";
  return `Rupees ${main}${paisePart} only`;
}

export function exportToCSV(filename = "export", data: Record<string, any>[]): void {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const val = row[header] ?? "";
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

