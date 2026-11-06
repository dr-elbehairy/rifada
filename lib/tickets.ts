import { GateId, ZoneId } from "./config";

export interface TicketOption { key: string; zone: ZoneId; gate: GateId; seat: string; title: string; note: string; price: number }

export const TICKETS: TicketOption[] = [
  { key: "fz", zone: "FZ", gate: "G1", seat: "ساحة المشجعين — دخول عام", title: "ساحة المشجعين الخارجية", note: "شاشات عملاقة وفعاليات من 15:00؛ مكشوفة", price: 95 },
  { key: "n", zone: "N", gate: "G1", seat: "المدرج الشمالي — بلوك 12، صف 18", title: "المدرج الشمالي", note: "مُظلَّل ومُبرَّد · دخول البوابة 1", price: 180 },
  { key: "e", zone: "E", gate: "G3", seat: "المدرج الشرقي — بلوك 108، صف 9", title: "المدرج الشرقي", note: "مُظلَّل ومُبرَّد · دخول البوابة 3", price: 150 },
  { key: "s7", zone: "S", gate: "G7", seat: "المدرج الجنوبي — بلوك 218، صف 22", title: "المدرج الجنوبي (مخرج البوابة 7)", note: "مُظلَّل ومُبرَّد · خروج عبر ممر البوابة 7", price: 150 },
  { key: "w", zone: "W", gate: "G5", seat: "المدرج الغربي — بلوك 305، صف 4", title: "المدرج الغربي", note: "مُظلَّل ومُبرَّد · دخول البوابة 5", price: 220 },
];
