import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatIndianCurrency(amount: number) {
  if (amount >= 10000000) {
    return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹ ${(amount / 100000).toFixed(0)} Lakh`;
  }
  return `₹ ${amount.toLocaleString('en-IN')}`;
}

// Helper to convert Firestore Timestamps to JSON-compatible strings in server components
export function dateToJSON(obj: any): any {
  if (!obj) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(dateToJSON);
  }

  // Handle objects
  if (typeof obj === 'object' && obj !== null) {
    // Handle Timestamp
    if (obj instanceof Timestamp) {
      return obj.toDate().toISOString();
    }
    
    // Recurse through object properties
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = dateToJSON(obj[key]);
      }
    }
    return newObj;
  }

  return obj;
}
