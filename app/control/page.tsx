"use client";
import { useMemo } from "react";
import SimBar from "@/components/SimBar";
import StadiumMap from "@/components/StadiumMap";
import CameraFeed from "@/components/CameraFeed";
import { DensityChart, HeatChart } from "@/components/Charts";
import { Badge, Card, Kpi, PageHead } from "@/components/ui";
import { EVENT, GATES, SCENARIOS, TERMS, TOTAL_POLICIES, ZONES, fmtM, fmtN, fmtSAR, fmtT } from "@/lib/config";
import { liveState } from "@/lib/engine";
import { useSim } from "@/lib/store";

const LV = { info: "info", warn: "warn", critical: "bad", ok: "ok" } as const;
const LVN = { info: "معلومة", warn: "تنبيه", critical: "حرج", ok: "زال" } as const;

export default function ControlRoom() {
  const { t, scenario, myPolicy } = useSim();
  const tm = Math.floor(t);
  const L = useMemo(() => liveState(scenario, tm), [scenario, tm]);
  const m = L.minute;
  const maxGate = GATES.reduce((a, g) => (m.gate[g.id] > m.gate[a.id] ? g : a), GATES[0]);
  const exposure = TOTAL_POLICIES * (TERMS.heat.payout + TERMS.crowd.payout) ; // أقصى نظري قبل الحد
  const heatTrig = L.triggers.find((x) => x.type === "heat");
  const crowdTrig = L.triggers.find((x) => x.type === "crowd");

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <PageHead kicker="غرفة المخاطر اللحظية — المنظّم · شركة التأمين · هيئة التأمين" title={EVENT.short}
        sub={<>{EVENT.venue} · {EVENT.date}. <b className="text-navy">{SCENARIOS[scenario].name}</b> — {SCENARIOS[scenario].desc}</>} />
      <SimBar />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mt-4">
        <Kpi label="وثائق فعّالة" value={fmtN(TOTAL_POLICIES + (myPolicy ? 1 : 0))} hint={`97% من حاملي التذاكر · قسط ${TERMS.premium} ر.س`} big />
        <Kpi label="الحرارة الظاهرة — ساحة المشجعين" value={`${m.zone.FZ.hi.toFixed(1)}°`} tone={m.zone.FZ.hi >= 45 ? "bad" : "navy"} hint={heatTrig ? `✓ تحقق المؤشر ${fmtT(heatTrig.confirmedAt)}` : L.heatRun.FZ ? `نافذة متصلة ${L.heatRun.FZ}/${TERMS.heat.minutes} د` : `الأرصاد ${m.ncm.hi.toFixed(1)}°`} />
        <Kpi label={`أعلى كثافة — ${maxGate.name}`} value={m.gate[maxGate.id].toFixed(2)} tone={m.gate[maxGate.id] >= 4 ? "bad" : m.gate[maxGate.id] >= 3 ? "warn" : "navy"} hint="شخص/م² · عتبة الخطر 4" />
        <Kpi label="تعويضات مُسوّاة" value={fmtM(L.settled)} tone={L.settled ? "bad" : "navy"} hint={L.pending ? `قيد التحويل ${fmtM(L.pending)}` : `${fmtN(L.paidPolicies)} وثيقة مستفيدة`} />
        <Kpi label="استهلاك حد الفعالية" value={`${(L.limitUsed * 100).toFixed(1)}%`} tone={L.limitUsed > 0.8 ? "bad" : "gold"} hint={`الحد ${fmtM(TERMS.eventLimit)} · احتفاظ ${fmtM(TERMS.retention)}`} />
        <Kpi label="الإنذارات والقرارات" value={fmtN(L.alerts.length)} tone="petrol" hint={`${L.alerts.filter((a) => a.level === "critical").length} حرجة · ${L.audit.length} قيد في السجل`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4">
        <Card className="xl:col-span-5" title="خريطة المخاطر — المناطق والبوابات" sub="لون الساحة = الحرارة الظاهرة؛ دوائر البوابات = الكثافة؛ التظليل المخطط = منطقة تحقق فيها المؤشر">
          <StadiumMap L={L} highlightZone={myPolicy?.zone} highlightGate={myPolicy?.gate} />
        </Card>
        <Card className="xl:col-span-4" title="تغذية الكاميرا — ممر البوابة 7" sub="إطارات خرجت فعلًا من نموذج الرؤية (YOLOv8 + استدلال مُجزّأ) على فيديو حشد مرخّص؛ القراءة في المحرك مُعايَرة للسيناريو">
          <CameraFeed />
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="rounded-lg bg-fill py-2"><div className="text-[11px] text-muted">كثافة المحرك الآن</div><div className="num font-bold text-navy text-[18px]">{m.gate.G7.toFixed(2)}</div></div>
            <div className="rounded-lg bg-fill py-2"><div className="text-[11px] text-muted">دقائق فوق العتبة</div><div className="num font-bold text-navy text-[18px]">{crowdTrig ? "✓" : `${Math.min(L.crowdRun.G7, TERMS.crowd.minutes)}/${TERMS.crowd.minutes}`}</div></div>
            <div className="rounded-lg bg-fill py-2"><div className="text-[11px] text-muted">بلاغ رسمي</div><div className="font-bold text-[14px] mt-0.5">{L.audit.some((a) => a.kind === "REPORT" && String(a.text).startsWith("الدفاع المدني")) ? <span className="text-bad">مُستلم</span> : <span className="text-muted">لا يوجد</span>}</div></div>
          </div>
        </Card>
        <Card className="xl:col-span-3" title="الإنذارات والقرارات" sub="الأحدث أولًا">
          <ul className="space-y-2 max-h-[470px] overflow-y-auto pl-1">
            {[...L.alerts].reverse().map((a, k) => (
              <li key={k} className="fade-in border border-line rounded-lg px-3 py-2">
                <div className="flex items-center justify-between gap-2"><Badge tone={LV[a.level]}>{LVN[a.level]}</Badge><span className="num text-[12px] text-muted">{fmtT(a.t)}</span></div>
                <div className="text-[12.5px] font-semibold text-navy mt-1">{a.scope}</div>
                <div className="text-[12.5px] text-ink leading-relaxed">{a.text}</div>
              </li>
            ))}
            {!L.alerts.length && <li className="text-[13px] text-muted">لا إنذارات بعد. شغّل المحاكاة.</li>}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        <Card title="مؤشر الإجهاد الحراري — المصدر الأول والثاني" sub="الحساس الموقعي يجب أن يبقى ≥ 45° لـ 120 دقيقة متصلة، والأرصاد ضمن ±3° للتأكيد. المنطقة المظللة = نافذة تغطية الساحة">
          <HeatChart sc={scenario} t={tm} />
        </Card>
        <Card title="كثافة البوابات — رؤية حاسوبية" sub="الخط المتقطع الذهبي = إنذار مبكر (3)؛ الأحمر = عتبة المؤشر (4) لمدة 10 دقائق + بلاغ رسمي">
          <DensityChart sc={scenario} t={tm} />
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4">
        <Card className="xl:col-span-5" title="أوراكل المؤشرات — قاعدة المصدرين" sub="لا يُعدّ مؤشر متحققًا إلا بمصدرين مستقلين ومدة معرّفة في الوثيقة">
          <OracleRow name="الإجهاد الحراري — ساحة المشجعين" done={!!heatTrig} progress={heatTrig ? 1 : L.heatRun.FZ / TERMS.heat.minutes}
            s1={heatTrig ? `${heatTrig.sources[0].value} ✓` : `حساس الموقع ${m.zone.FZ.hi.toFixed(1)}° ${m.zone.FZ.hi >= 45 ? "✓" : "✗"}`} s2={heatTrig ? `الأرصاد ${heatTrig.sources[1].value} ✓` : `الأرصاد ${m.ncm.hi.toFixed(1)}° — فرق ${Math.abs(m.ncm.hi - m.zone.FZ.hi).toFixed(1)}° ${Math.abs(m.ncm.hi - m.zone.FZ.hi) <= TERMS.heat.ncmTolerance ? "✓" : "✗"}`}
            rule={heatTrig ? `اكتمل عند ${fmtT(heatTrig.confirmedAt)} (نافذة من ${fmtT(heatTrig.runStart)}) — القراءات المعروضة لحظة التأكيد` : `${L.heatRun.FZ}/${TERMS.heat.minutes} دقيقة متصلة`} at={heatTrig?.confirmedAt} />
          <OracleRow name="حادث الحشد — البوابة 7" done={!!crowdTrig} progress={crowdTrig ? 1 : L.crowdRun.G7 / TERMS.crowd.minutes}
            s1={crowdTrig ? `${crowdTrig.sources[0].value} ✓` : `الرؤية الحاسوبية ${m.gate.G7.toFixed(2)} شخص/م² ${m.gate.G7 >= 4 ? "✓" : "✗"}`} s2={crowdTrig ? "بلاغ الدفاع المدني ✓" : L.audit.some((a) => a.kind === "REPORT" && a.text.startsWith("الدفاع المدني")) ? "بلاغ الدفاع المدني ✓" : "بلاغ رسمي ✗"}
            rule={crowdTrig ? `اكتمل عند ${fmtT(crowdTrig.confirmedAt)} (نافذة من ${fmtT(crowdTrig.runStart)}) — القراءات المعروضة لحظة التأكيد` : `${L.crowdRun.G7}/${TERMS.crowd.minutes} دقائق + بلاغ`} at={crowdTrig?.confirmedAt} />
          <OracleRow name="الإلغاء أو التأجيل ≥ 6 ساعات" done={false} progress={0} s1={tm >= EVENT.kickoff ? "انطلقت المباراة في موعدها" : "لا إعلان من المنظّم"} s2="منصة التذاكر: لا استرداد" rule="لم يتحقق" />
        </Card>
        <Card className="xl:col-span-7" title="الصرف التلقائي — من التأكيد إلى المحفظة" sub={`زمن التسوية المستهدف ≤ ${TERMS.payoutLatencyMin} دقائق؛ لا مطالبة ولا مستندات`}>
          {L.triggers.length === 0 && <p className="text-[13px] text-muted py-6 text-center">لا مؤشرات متحققة حتى {fmtT(tm)}.</p>}
          {L.triggers.map((tr) => {
            const stages = [["تأكيد المؤشر", tr.confirmedAt], ["تحديد المتأثرين", tr.matchedAt], ["أمر الدفع", tr.instructedAt], ["التسوية في المحافظ", tr.settledAt]] as const;
            return (
              <div key={tr.id} className="border border-line rounded-xl p-3 mb-3 fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold text-navy text-[14px]">{tr.type === "heat" ? "الإجهاد الحراري" : "حادث الحشد"} — {tr.scopeName}</div>
                  <div className="num font-bold text-bad text-[17px]">{fmtSAR(tr.total)}</div>
                </div>
                <div className="text-[12.5px] text-muted mt-0.5">{fmtN(tr.policies)} وثيقة × {fmtN(tr.payoutEach)} ر.س · نافذة من {fmtT(tr.runStart)}</div>
                <ol className="grid grid-cols-4 gap-2 mt-3">
                  {stages.map(([n, at]) => (
                    <li key={n} className={`rounded-lg px-2 py-2 text-center text-[12px] ${tm >= at ? "bg-[#e6f3ec] text-ok" : "bg-fill text-muted"}`}>
                      <div className="font-semibold">{tm >= at ? "✓ " : ""}{n}</div><div className="num">{fmtT(at)}</div>
                    </li>
                  ))}
                </ol>
                <div className="mt-2 grid md:grid-cols-2 gap-2">
                  {tr.sources.map((s) => <div key={s.name} className="text-[12px] bg-[#f7f8fb] rounded-md px-2.5 py-1.5"><b className="text-navy">{s.name}:</b> {s.value}</div>)}
                </div>
              </div>
            );
          })}
          <div className="mt-2 text-[12px] text-muted">التعرض النظري الأقصى قبل الحد: {fmtM(exposure)} · الحد الإجمالي للفعالية {fmtM(TERMS.eventLimit)}، احتفاظ المكتتب {fmtM(TERMS.retention)}، المُسنَد لإعادة التأمين الآن {fmtM(L.ceded)}.</div>
        </Card>
      </div>

      <Card className="mt-4" title="سجل التدقيق غير القابل للتعديل" sub="كل قيد يحمل بصمة SHA-256 محسوبة على محتواه وبصمة القيد السابق؛ أي تعديل لاحق يكسر السلسلة ويُكتشف فورًا">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead><tr className="bg-navy text-white"><th className="p-2 text-right">#</th><th className="p-2 text-right">الوقت</th><th className="p-2 text-right">النوع</th><th className="p-2 text-right">القيد</th><th className="p-2 text-left">البصمة السابقة</th><th className="p-2 text-left">البصمة</th></tr></thead>
            <tbody>
              {[...L.audit].reverse().slice(0, 12).map((a) => (
                <tr key={a.seq} className="border-b border-line odd:bg-[#fbfaf6]">
                  <td className="p-2 num">{a.seq}</td><td className="p-2 num">{fmtT(a.t)}</td><td className="p-2 font-mono text-[11px] text-petrol">{a.kind}</td><td className="p-2">{a.text}</td>
                  <td className="p-2 font-mono text-[11px] text-muted" dir="ltr">{a.prev.slice(0, 12)}…</td><td className="p-2 font-mono text-[11px] text-navy" dir="ltr">{a.hash.slice(0, 12)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-[12px] text-muted mt-3">المناطق: {ZONES.map((z) => `${z.name} (${fmtN(z.policies)})`).join(" · ")}.</p>
    </div>
  );
}

function OracleRow({ name, done, progress, s1, s2, rule, at }: { name: string; done: boolean; progress: number; s1: string; s2: string; rule: string; at?: number }) {
  return (
    <div className="border border-line rounded-xl p-3 mb-3">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold text-navy text-[13.5px]">{name}</div>
        {done ? <Badge tone="bad">✓ تحقق {at ? fmtT(at) : ""}</Badge> : progress > 0 ? <Badge tone="warn" pulse>قيد الاحتساب</Badge> : <Badge tone="ok">لم يتحقق</Badge>}
      </div>
      <div className="h-2 rounded-full bg-fill mt-2 overflow-hidden"><div className={`h-full ${done ? "bg-bad" : "bg-warn"} transition-all`} style={{ width: `${Math.min(100, progress * 100)}%` }} /></div>
      <div className="grid grid-cols-2 gap-2 mt-2 text-[12px]">
        <div className="bg-[#f7f8fb] rounded-md px-2 py-1.5"><span className="text-muted">المصدر 1: </span>{s1}</div>
        <div className="bg-[#f7f8fb] rounded-md px-2 py-1.5"><span className="text-muted">المصدر 2: </span>{s2}</div>
      </div>
      <div className="text-[11.5px] text-muted mt-1">الشرط الزمني: {rule}</div>
    </div>
  );
}
