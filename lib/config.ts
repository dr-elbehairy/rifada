// إعدادات النموذج الأولي: الفعالية، المناطق، البوابات، شروط الوثيقة.
// كل الأرقام هنا معلنة وقابلة للتعديل؛ لا بيانات شخصية حقيقية.

export const EVENT = {
  name: "سيناريو اختباري: نهائي بطولة كرة قدم + ساحة مشجعين خارجية",
  short: "نهائي البطولة — الرياض",
  venue: "ملعب افتراضي بسعة 60,000 + ساحة مشجعين خارجية — الرياض",
  date: "السبت 29 مايو 2027 (يوم موجة حر)",
  simStart: 14 * 60 + 30, // 14:30
  simEnd: 23 * 60 + 45, // 23:45
  fanZoneOpen: 15 * 60, // بداية تغطية ساحة المشجعين
  fanZoneClose: 21 * 60,
  kickoff: 21 * 60,
  finalWhistle: 22 * 60 + 50,
  attendees: 60_000,
  ticketAvg: 150,
};

export type ZoneId = "FZ" | "N" | "E" | "S" | "W";
export type GateId = "G1" | "G3" | "G5" | "G7";

export interface Zone { id: ZoneId; name: string; outdoor: boolean; policies: number; note: string }
export interface Gate { id: GateId; name: string; areaM2: number; policies: number; serves: string }

export const ZONES: Zone[] = [
  { id: "FZ", name: "ساحة المشجعين الخارجية", outdoor: true, policies: 17_465, note: "مكشوفة؛ حساس حرارة ورطوبة في الموقع" },
  { id: "N", name: "المدرج الشمالي", outdoor: false, policies: 10_400, note: "مُظلَّل ومُبرَّد" },
  { id: "E", name: "المدرج الشرقي", outdoor: false, policies: 10_700, note: "مُظلَّل ومُبرَّد" },
  { id: "S", name: "المدرج الجنوبي", outdoor: false, policies: 10_100, note: "مُظلَّل ومُبرَّد" },
  { id: "W", name: "المدرج الغربي", outdoor: false, policies: 9_549, note: "مُظلَّل ومُبرَّد" },
];

export const GATES: Gate[] = [
  { id: "G1", name: "البوابة 1", areaM2: 1_400, policies: 22_000, serves: "ساحة المشجعين + الشمالي" },
  { id: "G3", name: "البوابة 3", areaM2: 1_250, policies: 17_103, serves: "الشرقي + الغربي" },
  { id: "G5", name: "البوابة 5", areaM2: 1_300, policies: 16_200, serves: "الجنوبي + الغربي" },
  { id: "G7", name: "البوابة 7", areaM2: 1_150, policies: 2_911, serves: "ممر الخروج الجنوبي الشرقي" },
];

export const TOTAL_POLICIES = ZONES.reduce((s, z) => s + z.policies, 0); // 58,214

export const TERMS = {
  premium: 8, // ريال — السعر الموحّد للزائر
  heat: { threshold: 45, minutes: 120, payout: 300, ncmTolerance: 3.0 },
  crowd: { threshold: 4, minutes: 10, payout: 1_000, warn: 3.0, reportWindow: 15 },
  cancel: { delayHours: 6, refundPct: 0.5 },
  payoutLatencyMin: 4, // من التأكيد إلى وصول التحويل
  eventLimit: 12_000_000, // الحد الإجمالي للفعالية
  retention: 2_000_000, // احتفاظ المكتتب؛ ما فوقه إعادة تأمين
};

export type ScenarioId = "A" | "B";
export const SCENARIOS: Record<ScenarioId, { name: string; desc: string }> = {
  A: { name: "السيناريو أ: المنظّم يستجيب للإنذار المبكر", desc: "يرتفع الازدحام عند البوابة 7 بعد صافرة النهاية، فيصدر الإنذار المبكر ويفتح المنظّم المخرج الإضافي 7ب؛ لا يستمر التجاوز 10 دقائق ولا يصدر بلاغ رسمي، فلا صرف لمؤشر الحشد." },
  B: { name: "السيناريو ب: حادث حشد مؤكد", desc: "لا يُفتح المخرج الإضافي؛ تبقى الكثافة فوق 4 أشخاص/م² أكثر من 10 دقائق ويصدر بلاغ رسمي من الدفاع المدني، فيتحقق مؤشر الحشد ويُصرف لحاملي تذاكر البوابة 7." },
};

export const fmtT = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.floor(m) % 60).padStart(2, "0")}`;
export const fmtN = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtSAR = (n: number) => `${fmtN(Math.round(n))} ر.س`;
export const fmtM = (n: number) => `${(n / 1e6).toLocaleString("en-US", { maximumFractionDigits: 2 })} م ر.س`;
