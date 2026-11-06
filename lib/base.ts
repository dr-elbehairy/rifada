// المسار الأساسي عند النشر تحت مسار فرعي (مثل GitHub Pages: /rifada)
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const asset = (p: string) => `${BASE}${p}`;
