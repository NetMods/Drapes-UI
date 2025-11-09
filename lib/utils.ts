import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';


export function roundToDecimalPlaces(value: number, decimalPlaces: number) {
  const multiplier = Math.pow(10, decimalPlaces);
  return Math.round(value * multiplier) / multiplier;
}


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
