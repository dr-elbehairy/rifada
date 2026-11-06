"use client";
import { useMemo } from "react";
import { Badge, Card, Kpi } from "@/components/ui";
import { EVENT, SCENARIOS, ScenarioId, TERMS, TOTAL_POLICIES, fmtM, fmtN, fmtSAR, fmtT } from "@/lib/config";
import { getTimeline, liveState } from "@/lib/engine";
import { useSim } from "@/lib/store";

export default function Report() {
  const { scenario, setScenario } = useSim();
  const L = useMemo(() => liveState(scenario, EVENT.simEnd), [scenario]);
  const TL = getTimeline(scenario);
  const premium = TOTAL_POLICIES * TERMS.premium;
  const total = L.settled + L.pending;
  const early = TL.alerts.find((a) => a.scope === "البوابة 7" && a.level === "warn");
  const cross = TL.alerts.find((a) => a.scope === "البوابة 7" && a.level === "critical");
  const response = TL.audit.find((a) => a.kind === "REPORT" && a.text.includes("7ب"));
  const head = TL.audit[TL.audit.length - 1];

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 rounded-lg border border-line p-0.5">
          {(["A", "B"] as ScenarioId[]).map((s) => <button key={s} onClick={() => setScenario(s)} className={`px-3 py-1.5 rounded-md text-[12.5px] font-semibold ${scenario === s ? "bg-navy text-white" : ""}`}>{SCENARIOS[s].name}</button>)}
        </div>
        <button onClick={() => window.print()} className="bg-navy text-white rounded-lg px-4 py-2 text-[13px] font-semibold">طباعة / حفظ PDF</button>
      </div>

      <div className="border-b-4 border-gold pb-4 mb-5">
        <div className="text-[12.5px] font-semibold text-goldd">رِفادة · تقرير ما بعد الفعالية · يُولَّد آليًا خلال 24 ساعة</div>
        <h1 className="text-[28px] font-bold text-navy mt-1">{EVENT.short}</h1>
        <p className="text-[13.5px] text-muted mt-1">{EVENT.venue} · {EVENT.date} · {SCENARIOS[scenario].name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="وثائق فعّالة" value={fmtN(TOTAL_POLICIES)} hint={`أقساط ${fmtM(premium)}`} />
        <Kpi label="مؤشرات متحققة" value={String(L.triggers.length)} tone={L.triggers.length ? "bad" : "ok"} hint={L.triggers.map((x) => x.scopeName).join(" + ") || "لا شيء"} />
        <Kpi label="إجمالي التعويضات" value={fmtM(total)} tone="bad" hint={`${fmtN(L.paidPolicies)} وثيقة مستفيدة`} />
        <Kpi label="متوسط زمن الصرف" value={`${TERMS.payoutLatencyMin} دقائق`} tone="ok" hint="من التأكيد إلى المحفظة؛ صفر مطالبات" />
      </div>

      <Card className="mt-5" title="1. المؤشرات المتحققة ومصادرها">
        {L.triggers.length === 0 && <p className="text-[13px]">لم يتحقق أي مؤشر.</p>}
        {L.triggers.map((x) => (
          <div key={x.id} className="border border-line rounded-lg p-3 mb-2">
            <div className="flex flex-wrap justify-between gap-2"><b className="text-navy">{x.type === "heat" ? "الإجهاد الحراري" : "حادث الحشد"} — {x.scopeName}</b><span className="num font-bold">{fmtSAR(x.total)}</span></div>
            <div className="text-[12.5px] text-muted">النافذة {fmtT(x.runStart)} ← التأكيد {fmtT(x.confirmedAt)} ← التسوية {fmtT(x.settledAt)} · {fmtN(x.policies)} × {fmtN(x.payoutEach)} ر.س</div>
            <ul className="text-[12.5px] mt-1.5 space-y-0.5">{x.sources.map((s) => <li key={s.name}>• <b>{s.name}:</b> {s.value}</li>)}</ul>
          </div>
        ))}
      </Card>

      <Card className="mt-4" title="2. الأثر المالي">
        <table className="w-full text-[13px]">
          <tbody>
            {[
              ["الأقساط المكتتبة للفعالية", fmtSAR(premium)],
              ["إجمالي التعويضات", fmtSAR(total)],
              ["نسبة الخسارة للفعالية", `${((total / premium) * 100).toFixed(0)}%`],
              ["يتحملها المكتتب (الاحتفاظ)", fmtSAR(L.retained)],
              ["تُسترد من إعادة التأمين", fmtSAR(L.ceded)],
              ["استهلاك حد الفعالية", `${(L.limitUsed * 100).toFixed(1)}% من ${fmtM(TERMS.eventLimit)}`],
            ].map(([k, v]) => <tr key={k} className="border-b border-line"><td className="py-2 font-semibold text-navy">{k}</td><td className="py-2 num text-left">{v}</td></tr>)}
          </tbody>
        </table>
        <p className="text-[12.5px] text-muted mt-2">فعالية بموجة حر حدث ذيلي بطبيعته: نسبة الخسارة تُقرأ على مستوى الموسم (متوسط مستهدف نحو 62% في نموذج التسعير)، والحد وإعادة التأمين مصممان لامتصاص هذا الحدث.</p>
      </Card>

      <Card className="mt-4" title="3. الوقاية: ماذا فعل الإنذار المبكر؟">
        <ul className="text-[13px] space-y-1.5">
          <li>• إنذار مبكر للمنظّم عند البوابة 7: <b className="num">{early ? fmtT(early.t) : "—"}</b>.</li>
          <li>• أول تجاوز للعتبة: <b className="num">{cross ? fmtT(cross.t) : "—"}</b> — مهلة الإنذار <b className="num">{early && cross ? cross.t - early.t : "—"}</b> دقائق.</li>
          <li>• استجابة المنظّم: {response ? <><b className="num">{fmtT(response.t)}</b> — {response.text.replace("المنظّم: ", "")}</> : "لم تُسجَّل استجابة."}</li>
          <li>• النتيجة: {L.triggers.some((x) => x.type === "crowd") ? <Badge tone="bad">تحقق مؤشر الحشد وصُرف التعويض</Badge> : <Badge tone="ok">زال التجاوز قبل 10 دقائق — لا حادث ولا صرف</Badge>}</li>
        </ul>
      </Card>

      <Card className="mt-4" title="4. توصيات سلامة للمنظّم (آلية)">
        <ol className="list-decimal pr-5 text-[13px] space-y-1.5">
          <li>تجاوزت الحرارة الظاهرة في ساحة المشجعين العتبة لأكثر من ساعتين؛ تقديم موعد فتح الساحة إلى ما بعد 17:30 في أيام موجات الحر، وزيادة التظليل.</li>
          <li>مراوح الرذاذ في هواء جاف رفعت الرطوبة الموضعية والحرارة الظاهرة؛ توجيهها لمسارات المشي لا لمناطق التجمع.</li>
          <li>البوابة 7 أضيق بوابات الخروج نسبةً إلى ما تخدمه؛ فتح المخرج 7ب مسبقًا مع صافرة النهاية بدل انتظار الإنذار.</li>
          <li>رفع الإنذار المبكر إلى خطة الإخلاء: عتبة 3 أشخاص/م² مع ميل متزايد تمنح {early && cross ? cross.t - early.t : 4} دقائق للتصرّف.</li>
        </ol>
      </Card>

      <Card className="mt-4" title="5. سلامة السجل">
        <p className="text-[13px]">عدد القيود: <b className="num">{TL.audit.length}</b>. بصمة رأس السلسلة: <span className="font-mono text-[12px] text-navy" dir="ltr">{head.hash}</span></p>
        <p className="text-[12px] text-muted mt-1">تتيح البصمة لهيئة التأمين والمكتتب التحقق من أن أي واقعة صرف ومصادرها لم تُعدَّل بعد وقوعها.</p>
      </Card>
    </div>
  );
}
