import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const extractShortcodeFromUrl = (url: string): string | undefined => {
  try {
    const parsedUrl = new URL(url);
    const hash = parsedUrl.hash;

    if (hash) {
      const shortcode = hash.substring(1);
      const shortcodeRegex = /^[0-9a-zA-Z]{3,}$/;
      return shortcodeRegex.test(shortcode) ? shortcode : undefined;
    }

    return undefined;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return undefined;
  }
};
