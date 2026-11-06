// محرك درع الحشود: أوراكل المؤشرات (قاعدة المصدرين) → تحديد المتأثرين → الصرف → سجل تدقيق متسلسل بالبصمات.
// يُحسب الخط الزمني كاملًا مرة واحدة لكل سيناريو، ثم تُعرض الحالة حتى اللحظة t (بادئة الخط الزمني).
import { EVENT, GATES, GateId, ScenarioId, TERMS, TOTAL_POLICIES, ZONES, ZoneId } from "./config";
import { Minute, getScenario } from "./scenario";
import { sha256 } from "./util";

export type TriggerType = "heat" | "crowd" | "cancel";
export interface Trigger {
  id: string; type: TriggerType; scope: ZoneId | GateId; scopeName: string;
  runStart: number; confirmedAt: number; matchedAt: number; instructedAt: number; settledAt: number;
  sources: { name: string; value: string }[]; policies: number; payoutEach: number; total: number;
}
export interface Alert { t: number; level: "info" | "warn" | "critical" | "ok"; scope: string; text: string }
export interface AuditEntry { seq: number; t: number; kind: string; text: string; data: Record<string, unknown>; prev: string; hash: string }
export interface Timeline { sc: ScenarioId; triggers: Trigger[]; alerts: Alert[]; audit: AuditEntry[] }

const round = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

function computeTimeline(sc: ScenarioId): Timeline {
  const S = getScenario(sc);
  const M = S.minutes;
  const at = (t: number) => M[t - EVENT.simStart];
  const triggers: Trigger[] = [];
  const alerts: Alert[] = [];
  type Raw = { t: number; kind: string; text: string; data: Record<string, unknown> };
  const raw: Raw[] = [];

  raw.push({ t: EVENT.simStart, kind: "POOL", text: `تثبيت محفظة الفعالية: ${TOTAL_POLICIES.toLocaleString("en-US")} وثيقة فعّالة وشروطها`,
    data: { policies: TOTAL_POLICIES, premium: TERMS.premium, heat: TERMS.heat, crowd: TERMS.crowd, eventLimit: TERMS.eventLimit, retention: TERMS.retention } });
  for (const r of S.reports) raw.push({ t: r.t, kind: "REPORT", text: `${r.source}: ${r.text}`, data: { source: r.source, gate: r.gate ?? null } });

  // ---------------- مؤشر الحرارة لكل منطقة
  for (const z of ZONES) {
    const from = z.outdoor ? EVENT.fanZoneOpen : EVENT.fanZoneOpen, to = z.outdoor ? EVENT.fanZoneClose : EVENT.simEnd;
    let run = 0, runStart = -1, done = false, warned60 = false, started = false, approach = false;
    for (let t = from; t <= to && !done; t++) {
      const m = at(t), zh = m.zone[z.id].hi, nh = m.ncm.hi;
      const ncmOk = nh >= TERMS.heat.threshold || Math.abs(nh - zh) <= TERMS.heat.ncmTolerance;
      if (z.outdoor && !approach && zh >= TERMS.heat.threshold - 1.5) { approach = true; alerts.push({ t, level: "info", scope: z.name, text: `الحرارة الظاهرة تقترب من العتبة (${round(zh, 1)}°)` }); }
      if (zh >= TERMS.heat.threshold && ncmOk) {
        if (run === 0) { runStart = t; if (!started) { started = true; alerts.push({ t, level: "warn", scope: z.name, text: `بدء احتساب نافذة الحرارة: حساس الموقع ${round(zh, 1)}° والأرصاد ${round(nh, 1)}° (ضمن الهامش)` }); raw.push({ t, kind: "SIGNAL", text: `${z.name}: بدء نافذة مؤشر الحرارة`, data: { zone: z.id, sensorHI: round(zh), ncmHI: round(nh) } }); } }
        run++;
        if (run === 60 && !warned60) { warned60 = true; alerts.push({ t, level: "warn", scope: z.name, text: "مضت 60 دقيقة متصلة فوق العتبة؛ متبقٍ 60 دقيقة على التحقق" }); }
        if (run >= TERMS.heat.minutes) {
          done = true;
          const tr: Trigger = { id: `HEAT-${z.id}`, type: "heat", scope: z.id, scopeName: z.name, runStart, confirmedAt: t, matchedAt: t + 1, instructedAt: t + 2, settledAt: t + TERMS.payoutLatencyMin,
            sources: [{ name: `حساس الموقع — ${z.name}`, value: `${round(zh, 1)}° حرارة ظاهرة، ${TERMS.heat.minutes} دقيقة متصلة ≥ ${TERMS.heat.threshold}°` },
                      { name: "المركز الوطني للأرصاد — محطة الرياض", value: `${round(nh, 1)}° (فرق ${round(Math.abs(nh - zh), 1)}° ≤ ${TERMS.heat.ncmTolerance}°)` }],
            policies: z.policies, payoutEach: TERMS.heat.payout, total: z.policies * TERMS.heat.payout };
          triggers.push(tr);
          alerts.push({ t, level: "critical", scope: z.name, text: `تحقق مؤشر الإجهاد الحراري (مصدران) — صرف ${TERMS.heat.payout} ريال لـ ${z.policies.toLocaleString("en-US")} وثيقة` });
        }
      } else if (run > 0) {
        if (run >= 15) alerts.push({ t, level: "ok", scope: z.name, text: `انقطعت النافذة بعد ${run} دقيقة؛ يُعاد العدّ` });
        run = 0;
      }
    }
  }

  // ---------------- مؤشر الحشد لكل بوابة
  for (const g of GATES) {
    let run = 0, runStart = -1, warned = false, crossed = false, done = false;
    for (let t = EVENT.simStart + 1; t <= EVENT.simEnd && !done; t++) {
      const d = at(t).gate[g.id], dp = at(t - 1).gate[g.id];
      if (!warned && d >= TERMS.crowd.warn && d - dp > 0.12) {
        warned = true;
        const eta = Math.max(1, Math.round((TERMS.crowd.threshold - d) / Math.max(0.05, d - dp)));
        // الإنذار المبكر يُرسل للمنظّم فقط؛ لا أثر له على الصرف
        alerts.push({ t, level: "warn", scope: g.name, text: `إنذار مبكر: الكثافة ${round(d)} شخص/م² وتتزايد؛ تجاوز العتبة متوقع خلال ~${eta} دقائق` });
        raw.push({ t, kind: "EARLY_WARNING", text: `${g.name}: إنذار مبكر للمنظّم`, data: { gate: g.id, density: round(d), slope: round(d - dp, 3) } });
      }
      if (d >= TERMS.crowd.threshold) {
        if (run === 0) { runStart = t; if (!crossed) { crossed = true; alerts.push({ t, level: "critical", scope: g.name, text: `تجاوز عتبة الكثافة: ${round(d)} شخص/م² — بدء احتساب 10 دقائق وانتظار بلاغ رسمي` }); raw.push({ t, kind: "SIGNAL", text: `${g.name}: تجاوز عتبة الكثافة`, data: { gate: g.id, density: round(d) } }); } }
        run++;
        const report = S.reports.find((r) => r.kind === "civil_defense" && r.gate === g.id && r.t <= t && r.t >= runStart - TERMS.crowd.reportWindow);
        if (run >= TERMS.crowd.minutes && report) {
          done = true;
          const tr: Trigger = { id: `CROWD-${g.id}`, type: "crowd", scope: g.id, scopeName: g.name, runStart, confirmedAt: t, matchedAt: t + 1, instructedAt: t + 2, settledAt: t + TERMS.payoutLatencyMin,
            sources: [{ name: `نموذج الرؤية الحاسوبية — كاميرات ${g.name}`, value: `${round(d)} شخص/م²، ${run} دقيقة متصلة ≥ ${TERMS.crowd.threshold}` },
                      { name: report.source, value: report.text }],
            policies: g.policies, payoutEach: TERMS.crowd.payout, total: g.policies * TERMS.crowd.payout };
          triggers.push(tr);
          alerts.push({ t, level: "critical", scope: g.name, text: `تحقق مؤشر حادث الحشد (مصدران) — صرف ${TERMS.crowd.payout.toLocaleString("en-US")} ريال لـ ${g.policies.toLocaleString("en-US")} وثيقة` });
        }
      } else if (run > 0) {
        alerts.push({ t, level: "ok", scope: g.name, text: `عادت الكثافة دون العتبة بعد ${run} دقائق — لا صرف (الشرط 10 دقائق + بلاغ رسمي)` });
        raw.push({ t, kind: "SIGNAL_CLEARED", text: `${g.name}: زوال التجاوز دون تحقق المؤشر`, data: { gate: g.id, minutesAbove: run } });
        run = 0;
      }
    }
  }
  alerts.push({ t: EVENT.kickoff, level: "info", scope: "الفعالية", text: "مؤشر الإلغاء/التأجيل: انطلقت المباراة في موعدها — لم يتحقق" });

  for (const tr of triggers) {
    raw.push({ t: tr.confirmedAt, kind: "TRIGGER_CONFIRMED", text: `تأكيد ${tr.type === "heat" ? "مؤشر الإجهاد الحراري" : "مؤشر حادث الحشد"} — ${tr.scopeName}`, data: { id: tr.id, sources: tr.sources, runStart: tr.runStart } });
    raw.push({ t: tr.matchedAt, kind: "POLICIES_MATCHED", text: `تحديد ${tr.policies.toLocaleString("en-US")} وثيقة متأثرة (${tr.scopeName})`, data: { id: tr.id, policies: tr.policies } });
    raw.push({ t: tr.settledAt, kind: "PAYOUT_SETTLED", text: `تسوية ${tr.total.toLocaleString("en-US")} ريال إلى المحافظ الرقمية`, data: { id: tr.id, each: tr.payoutEach, total: tr.total } });
  }
  raw.sort((a, b) => a.t - b.t);
  let prev = "0".repeat(64);
  const audit: AuditEntry[] = raw.map((r, i) => {
    const body = JSON.stringify({ seq: i + 1, t: r.t, kind: r.kind, text: r.text, data: r.data, prev });
    const hash = sha256(body);
    const e = { seq: i + 1, ...r, prev, hash };
    prev = hash;
    return e;
  });
  alerts.sort((a, b) => a.t - b.t);
  triggers.sort((a, b) => a.confirmedAt - b.confirmedAt);
  return { sc, triggers, alerts, audit };
}

const cache: Partial<Record<ScenarioId, Timeline>> = {};
export const getTimeline = (sc: ScenarioId) => (cache[sc] ??= computeTimeline(sc));

export interface LiveState {
  t: number; minute: Minute; triggers: Trigger[]; alerts: Alert[]; audit: AuditEntry[];
  settled: number; pending: number; paidPolicies: number; limitUsed: number; retained: number; ceded: number;
  heatRun: Record<ZoneId, number>; crowdRun: Record<GateId, number>;
}

export function liveState(sc: ScenarioId, t: number): LiveState {
  const S = getScenario(sc), TL = getTimeline(sc);
  const tt = Math.min(EVENT.simEnd, Math.max(EVENT.simStart, Math.floor(t)));
  const minute = S.minutes[tt - EVENT.simStart];
  const triggers = TL.triggers.filter((x) => x.confirmedAt <= tt);
  const settled = triggers.filter((x) => x.settledAt <= tt).reduce((s, x) => s + x.total, 0);
  const pending = triggers.filter((x) => x.settledAt > tt).reduce((s, x) => s + x.total, 0);
  const paidPolicies = triggers.filter((x) => x.settledAt <= tt).reduce((s, x) => s + x.policies, 0);
  const used = settled + pending;
  // أطوال النوافذ الجارية
  const heatRun = {} as Record<ZoneId, number>, crowdRun = {} as Record<GateId, number>;
  for (const z of ZONES) {
    let r = 0;
    for (let k = tt; k >= EVENT.fanZoneOpen; k--) {
      const m = S.minutes[k - EVENT.simStart]; const zh = m.zone[z.id].hi, nh = m.ncm.hi;
      if (zh >= TERMS.heat.threshold && (nh >= TERMS.heat.threshold || Math.abs(nh - zh) <= TERMS.heat.ncmTolerance) && (!z.outdoor || k <= EVENT.fanZoneClose)) r++; else break;
    }
    heatRun[z.id] = r;
  }
  for (const g of GATES) {
    let r = 0;
    for (let k = tt; k >= EVENT.simStart; k--) { if (S.minutes[k - EVENT.simStart].gate[g.id] >= TERMS.crowd.threshold) r++; else break; }
    crowdRun[g.id] = r;
  }
  return {
    t: tt, minute, triggers, alerts: TL.alerts.filter((a) => a.t <= tt), audit: TL.audit.filter((a) => a.t <= tt),
    settled, pending, paidPolicies, limitUsed: used / TERMS.eventLimit, retained: Math.min(used, TERMS.retention), ceded: Math.max(0, used - TERMS.retention), heatRun, crowdRun,
  };
}

export const KEY_MOMENTS = (sc: ScenarioId) => {
  const TL = getTimeline(sc);
  const heat = TL.triggers.find((x) => x.type === "heat");
  const crowd = TL.triggers.find((x) => x.type === "crowd");
  return [
    { t: EVENT.simStart, label: "قبل فتح الساحة" },
    { t: EVENT.fanZoneOpen + 5, label: "افتتاح الساحة" },
    ...(heat ? [{ t: heat.confirmedAt - 3, label: "قبيل تحقق الحرارة" }] : []),
    { t: 20 * 60 + 25, label: "ذروة الدخول" },
    { t: EVENT.finalWhistle + 2, label: "صافرة النهاية" },
    ...(crowd ? [{ t: crowd.confirmedAt - 2, label: "قبيل تأكيد الحشد" }] : [{ t: EVENT.finalWhistle + 10, label: "ذروة البوابة 7" }]),
    { t: EVENT.simEnd, label: "نهاية الفعالية" },
  ];
};
