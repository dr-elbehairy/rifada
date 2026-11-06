// توليد بيانات السيناريو دقيقةً بدقيقة (مُبذَّر وقابل للتكرار).
// الأرصاد: منحنى يوم موجة حر في الرياض. الحساسات: ساحة المشجعين مكشوفة (+حرارة الأسفلت، +رطوبة مراوح الرذاذ)،
// المدرجات مُبرَّدة. الكثافة: دخول قبل المباراة، خروج بعد صافرة النهاية، وسلوك البوابة 7 حسب السيناريو.
import { EVENT, GATES, GateId, ScenarioId, ZONES, ZoneId } from "./config";
import { heatIndexC, interp, mulberry32 } from "./util";

export interface Minute {
  t: number;
  ncm: { temp: number; rh: number; hi: number };
  zone: Record<ZoneId, { temp: number; rh: number; hi: number }>;
  gate: Record<GateId, number>; // شخص/م²
}
export interface Report { t: number; source: string; kind: "organizer" | "civil_defense" | "ncm"; gate?: GateId; text: string }
export interface ScenarioData { id: ScenarioId; minutes: Minute[]; reports: Report[] }

const NCM_T: [number, number][] = [[870, 45.6], [900, 46.1], [930, 46.5], [960, 46.8], [990, 46.7], [1020, 46.3], [1050, 45.7], [1080, 44.9], [1110, 43.8], [1140, 42.5], [1200, 40.2], [1260, 38.4], [1320, 36.9], [1380, 35.7], [1425, 35.1]];
const NCM_RH: [number, number][] = [[870, 10.5], [960, 10.0], [1080, 11.2], [1200, 13.8], [1320, 16.5], [1425, 18.5]];

const gauss = (t: number, mu: number, sd: number) => Math.exp(-0.5 * ((t - mu) / sd) ** 2);
// صعود سريع وهبوط أبطأ (للخروج)
const skew = (t: number, mu: number, up: number, down: number) => (t < mu ? gauss(t, mu, up) : gauss(t, mu, down));

function gateDensity(g: GateId, t: number, sc: ScenarioId, rnd: () => number): number {
  const ingressPeak: Record<GateId, number> = { G1: 2.15, G3: 1.95, G5: 2.0, G7: 1.6 };
  const egressPeak: Record<GateId, number> = { G1: 2.8, G3: 3.05, G5: 2.65, G7: 3.0 };
  let d = 0.08 + 0.12 * gauss(t, 15 * 60 + 20, 30); // تدفق ساحة المشجعين
  d += ingressPeak[g] * skew(t, 20 * 60 + 25, 35, 18);
  if (g === "G1") d += 0.9 * gauss(t, 20 * 60 + 40, 12); // انتقال المشجعين من الساحة إلى الملعب
  if (g !== "G7") d += egressPeak[g] * skew(t, EVENT.finalWhistle + 11, 6, 13);
  else {
    if (sc === "A") {
      // إنذار مبكر نحو 22:54، استجابة المنظّم 22:59 (فتح المخرج 7ب)، تجاوز قصير لا يبلغ 10 دقائق
      const base = 4.2 * skew(t, EVENT.finalWhistle + 11, 9, 30);
      const relief = t > EVENT.finalWhistle + 9 ? Math.min(1, (t - (EVENT.finalWhistle + 9)) / 6) : 0;
      d += base * (1 - 0.45 * relief);
    } else {
      // لا استجابة: هضبة فوق 4 من 22:59 حتى ~23:12 بذروة 4.9 عند 23:05
      d += 4.95 * skew(t, EVENT.finalWhistle + 15, 9, 9);
      if (t >= EVENT.finalWhistle + 10 && t <= EVENT.finalWhistle + 22) d = Math.max(d, 4.1 + 0.05 * Math.sin(t));
    }
  }
  return Math.max(0.03, d + (rnd() - 0.5) * 0.08);
}

export function buildScenario(sc: ScenarioId): ScenarioData {
  const rnd = mulberry32(sc === "A" ? 20270529 : 20270530);
  const minutes: Minute[] = [];
  for (let t = EVENT.simStart; t <= EVENT.simEnd; t++) {
    const temp = interp(NCM_T, t) + (rnd() - 0.5) * 0.12;
    const rh = interp(NCM_RH, t) + (rnd() - 0.5) * 0.3;
    const ncm = { temp, rh, hi: heatIndexC(temp, rh) };
    const zone = {} as Minute["zone"];
    for (const z of ZONES) {
      if (z.outdoor) {
        // مراوح الرذاذ تعمل تدريجيًا بعد الافتتاح فترفع الرطوبة الموضعية؛ والأسفلت يرفع الحرارة
        const misting = t >= EVENT.fanZoneOpen && t <= EVENT.fanZoneClose ? 2.7 * Math.min(1, (t - EVENT.fanZoneOpen) / 25) : 0;
        const zt = temp + 0.7 + (rnd() - 0.5) * 0.2, zrh = rh + misting + (rnd() - 0.5) * 0.3;
        zone[z.id] = { temp: zt, rh: zrh, hi: heatIndexC(zt, zrh) };
      } else {
        const zt = 29.5 + 1.5 * Math.sin((t - 900) / 140) + (rnd() - 0.5) * 0.3, zrh = 38 + (rnd() - 0.5) * 2;
        zone[z.id] = { temp: zt, rh: zrh, hi: heatIndexC(zt, zrh) };
      }
    }
    const gate = {} as Minute["gate"];
    for (const g of GATES) gate[g.id] = gateDensity(g.id, t, sc, rnd);
    minutes.push({ t, ncm, zone, gate });
  }
  const reports: Report[] = [
    { t: 14 * 60 + 40, source: "المركز الوطني للأرصاد", kind: "ncm", text: "تنبيه: موجة حر على منطقة الرياض؛ درجات حرارة 46 إلى 47° حتى المساء." },
    { t: EVENT.fanZoneOpen, source: "المنظّم", kind: "organizer", text: "افتتاح ساحة المشجعين الخارجية وبدء تغطية وثائق الساحة." },
    { t: EVENT.kickoff, source: "المنظّم", kind: "organizer", text: "انطلاق المباراة في موعدها؛ لا تأجيل." },
    { t: EVENT.finalWhistle, source: "المنظّم", kind: "organizer", text: "صافرة النهاية؛ بدء خطة الإخلاء والخروج." },
  ];
  if (sc === "A") reports.push({ t: EVENT.finalWhistle + 9, source: "المنظّم", kind: "organizer", gate: "G7", text: "استجابة للإنذار المبكر: فتح المخرج الإضافي 7ب وتحويل مسار الخروج." });
  else reports.push({ t: EVENT.finalWhistle + 16, source: "الدفاع المدني", kind: "civil_defense", gate: "G7", text: "بلاغ رسمي: تدافع في ممر البوابة 7 مع إصابات طفيفة؛ فرق الإسعاف في الموقع." });
  reports.sort((a, b) => a.t - b.t);
  return { id: sc, minutes, reports };
}

const cache: Partial<Record<ScenarioId, ScenarioData>> = {};
export const getScenario = (sc: ScenarioId) => (cache[sc] ??= buildScenario(sc));
