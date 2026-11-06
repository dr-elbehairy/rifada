// التسعير الاكتواري لدرع الحشود: الخسارة المتوقعة لكل مؤشر، التحميلات، السعر الموحّد والسعر حسب المنطقة،
// ومحاكاة مونت كارلو لموسم كامل من الفعاليات (نسبة الخسارة، احتمال تجاوز 100%، القيمة المعرّضة للخطر 99.5%).
import { mulberry32 } from "./util";

export interface TriggerAssump { key: "heat" | "crowd" | "cancel"; name: string; p: number; share: number; payout: number }
export interface Loads { expense: number; profit: number; reins: number }

export const DEFAULT_TRIGGERS: TriggerAssump[] = [
  { key: "heat", name: "الإجهاد الحراري", p: 0.04, share: 0.3, payout: 300 },
  { key: "crowd", name: "حادث الحشد", p: 0.005, share: 0.05, payout: 1000 },
  { key: "cancel", name: "الإلغاء أو التأجيل", p: 0.015, share: 1, payout: 75 },
];
export const DEFAULT_LOADS: Loads = { expense: 0.25, profit: 0.1, reins: 0.025 };

export function price(tr: TriggerAssump[], L: Loads) {
  const rows = tr.map((x) => ({ ...x, el: x.p * x.share * x.payout }));
  const el = rows.reduce((s, r) => s + r.el, 0);
  const mult = 1 / (1 - L.expense - L.profit - L.reins);
  const gross = el * mult;
  const heat = tr.find((x) => x.key === "heat")!, other = rows.filter((r) => r.key !== "heat").reduce((s, r) => s + r.el, 0);
  // السعر حسب المنطقة: حامل تذكرة الساحة المكشوفة معرّض للحرارة بالكامل؛ حامل تذكرة المدرج المُبرَّد غير معرّض
  const outdoor = (heat.p * heat.payout + other) * mult, indoor = other * mult;
  return { rows, el, mult, gross, rounded: Math.ceil(gross), outdoor, indoor, breakdown: { el, expense: gross * L.expense, profit: gross * L.profit, reins: gross * L.reins } };
}

export interface MCParams { events: number; sims: number; minAtt: number; maxAtt: number; takeUp: number; premium: number; hotSeasonProb: number; seed: number }
export const DEFAULT_MC: MCParams = { events: 40, sims: 20000, minAtt: 15000, maxAtt: 60000, takeUp: 0.9, premium: 8, hotSeasonProb: 0.3, seed: 2026 };

export function simulateSeason(tr: TriggerAssump[], P: MCParams) {
  const rnd = mulberry32(P.seed);
  const H = tr.find((x) => x.key === "heat")!, C = tr.find((x) => x.key === "crowd")!, X = tr.find((x) => x.key === "cancel")!;
  // ارتباط موجات الحر داخل الموسم: موسم حار باحتمال hotSeasonProb يضاعف احتمال الحرارة، مع حفظ المتوسط
  const hotMult = 2.5, coolMult = (1 - P.hotSeasonProb * hotMult) / (1 - P.hotSeasonProb);
  const lr: number[] = [], loss: number[] = [], maxEvent: number[] = [];
  for (let s = 0; s < P.sims; s++) {
    const hot = rnd() < P.hotSeasonProb, ph = H.p * (hot ? hotMult : Math.max(0, coolMult));
    let L = 0, prem = 0, mx = 0;
    for (let e = 0; e < P.events; e++) {
      const pol = Math.round((P.minAtt + rnd() * (P.maxAtt - P.minAtt)) * P.takeUp);
      prem += pol * P.premium;
      let le = 0;
      if (rnd() < ph) le += pol * (H.share * (0.6 + 0.8 * rnd())) * H.payout;
      if (rnd() < C.p) le += pol * (C.share * (0.4 + 1.2 * rnd())) * C.payout;
      if (rnd() < X.p) le += pol * X.share * X.payout;
      L += le; if (le > mx) mx = le;
    }
    lr.push(L / prem); loss.push(L); maxEvent.push(mx);
  }
  const sorted = [...lr].sort((a, b) => a - b), ls = [...loss].sort((a, b) => a - b), ms = [...maxEvent].sort((a, b) => a - b);
  const q = (arr: number[], p: number) => arr[Math.min(arr.length - 1, Math.floor(p * arr.length))];
  const bins = [0, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, Infinity];
  const labels = ["< 25%", "25–50%", "50–75%", "75–100%", "100–150%", "150–200%", "200–300%", "> 300%"];
  const hist = labels.map((label, i) => ({ label, share: lr.filter((x) => x >= bins[i] && x < bins[i + 1]).length / lr.length }));
  return {
    meanLR: lr.reduce((a, b) => a + b, 0) / lr.length, medianLR: q(sorted, 0.5), pAbove100: lr.filter((x) => x > 1).length / lr.length,
    var995Loss: q(ls, 0.995), meanLoss: ls.reduce((a, b) => a + b, 0) / ls.length, var995Event: q(ms, 0.995), hist,
  };
}
