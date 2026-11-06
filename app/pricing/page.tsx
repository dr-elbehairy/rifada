"use client";
import { useMemo, useState } from "react";
import { SimpleBars } from "@/components/Charts";
import { Card, Kpi, PageHead } from "@/components/ui";
import { fmtM } from "@/lib/config";
import { DEFAULT_LOADS, DEFAULT_MC, DEFAULT_TRIGGERS, Loads, MCParams, TriggerAssump, price, simulateSeason } from "@/lib/pricing";

const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;

export default function Pricing() {
  const [tr, setTr] = useState<TriggerAssump[]>(DEFAULT_TRIGGERS);
  const [loads, setLoads] = useState<Loads>(DEFAULT_LOADS);
  const [mc, setMc] = useState<MCParams>(DEFAULT_MC);
  const P = useMemo(() => price(tr, loads), [tr, loads]);
  const R = useMemo(() => simulateSeason(tr, { ...mc, premium: Math.ceil(P.gross) }), [tr, mc, P.gross]);
  const upd = (k: number, f: keyof TriggerAssump, v: number) => setTr(tr.map((x, i) => (i === k ? { ...x, [f]: v } : x)));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <PageHead kicker="الطبقة الاكتوارية" title="التسعير البارامتري ومحاكاة الموسم"
        sub="القسط البارامتري = Σ (احتمال تحقق المؤشر في الفعالية × نسبة الوثائق داخل النطاق × المبلغ الثابت) ثم تحميل المصاريف والربح وإعادة التأمين. غيّر الافتراضات ويُعاد الحساب فورًا، ومعه محاكاة مونت كارلو لـ 20,000 موسم." />
      <div className="grid xl:grid-cols-12 gap-4">
        <Card className="xl:col-span-7" title="افتراضات المؤشرات" sub="القيم الافتراضية تطابق المقترح المقدَّم؛ تُعاير على بيانات الأرصاد التاريخية وسجل الحوادث داخل البيئة التجريبية">
          <table className="w-full text-[13px]">
            <thead><tr className="bg-navy text-white"><th className="p-2 text-right">المؤشر</th><th className="p-2">احتمال التحقق/فعالية</th><th className="p-2">نسبة المتأثرين</th><th className="p-2">المبلغ (ر.س)</th><th className="p-2">الخسارة المتوقعة/زائر</th></tr></thead>
            <tbody>
              {P.rows.map((r, k) => (
                <tr key={r.key} className="border-b border-line">
                  <td className="p-2 font-semibold text-navy">{r.name}</td>
                  <td className="p-2"><Num v={r.p * 100} step={0.1} onChange={(v) => upd(k, "p", v / 100)} suffix="%" /></td>
                  <td className="p-2"><Num v={r.share * 100} step={1} onChange={(v) => upd(k, "share", v / 100)} suffix="%" /></td>
                  <td className="p-2"><Num v={r.payout} step={25} onChange={(v) => upd(k, "payout", v)} /></td>
                  <td className="p-2 num font-bold text-center">{r.el.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-fill font-bold"><td className="p-2" colSpan={4}>إجمالي الخسارة المتوقعة لكل زائر</td><td className="p-2 num text-center">{P.el.toFixed(2)}</td></tr>
            </tbody>
          </table>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {([["expense", "المصاريف والتوزيع"], ["profit", "الربح وتكلفة رأس المال"], ["reins", "إعادة التأمين والتذبذب"]] as const).map(([k, n]) => (
              <label key={k} className="text-[12.5px] text-muted">{n}
                <Num v={loads[k] * 100} step={0.5} onChange={(v) => setLoads({ ...loads, [k]: v / 100 })} suffix="% من القسط" />
              </label>
            ))}
          </div>
        </Card>
        <div className="xl:col-span-5 grid grid-cols-2 gap-3 content-start">
          <Kpi label="القسط الموحّد للزائر" value={`${P.gross.toFixed(2)} ر.س`} hint={`يُعرض ${P.rounded} ر.س · مضاعف التحميل ×${P.mult.toFixed(2)}`} tone="gold" big />
          <Kpi label="نسبة الخسارة المتوقعة" value={pct(P.el / P.gross)} hint="الخسارة المتوقعة ÷ القسط" big />
          <Kpi label="السعر حسب الخطر — ساحة مكشوفة" value={`${P.outdoor.toFixed(2)} ر.س`} tone="bad" hint="معرّض لمؤشر الحرارة بالكامل" />
          <Kpi label="السعر حسب الخطر — مدرج مبرّد" value={`${P.indoor.toFixed(2)} ر.س`} tone="ok" hint="غير معرّض للحرارة" />
          <Card className="col-span-2" title="تفكيك القسط الموحّد">
            <SimpleBars data={[{ label: "خسارة متوقعة", value: P.breakdown.el }, { label: "مصاريف", value: P.breakdown.expense }, { label: "ربح ورأس مال", value: P.breakdown.profit }, { label: "إعادة تأمين", value: P.breakdown.reins }]} h={170} color="#1c2a5d" />
            <p className="text-[12px] text-muted mt-1">السعر الموحّد خيار تجاري لبساطة الشراء؛ ويمكن تقديم السعر حسب المنطقة عند طلب المنظّم.</p>
          </Card>
        </div>
      </div>

      <Card className="mt-4" title="محاكاة مونت كارلو لموسم كامل" sub="الموسم = عدد من الفعاليات بأحجام عشوائية؛ موجات الحر مترابطة داخل الموسم (موسم حار يضاعف احتمال الحرارة ×2.5 مع حفظ المتوسط)؛ المبالغ المتأثرة متغيرة حول الافتراض">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <label className="text-[12.5px] text-muted">فعاليات في الموسم<Num v={mc.events} step={5} onChange={(v) => setMc({ ...mc, events: Math.max(1, Math.round(v)) })} /></label>
          <label className="text-[12.5px] text-muted">احتمال موسم حار<Num v={mc.hotSeasonProb * 100} step={5} onChange={(v) => setMc({ ...mc, hotSeasonProb: Math.min(0.39, v / 100) })} suffix="%" /></label>
          <label className="text-[12.5px] text-muted">أقل حضور<Num v={mc.minAtt} step={5000} onChange={(v) => setMc({ ...mc, minAtt: v })} /></label>
          <label className="text-[12.5px] text-muted">أعلى حضور<Num v={mc.maxAtt} step={5000} onChange={(v) => setMc({ ...mc, maxAtt: v })} /></label>
        </div>
        <div className="grid xl:grid-cols-12 gap-4">
          <div className="xl:col-span-7"><SimpleBars data={R.hist.map((h) => ({ label: h.label, value: h.share * 100 }))} h={250} unit="%" color="#007a88" highlight={(d) => d.label.startsWith("1") || d.label.startsWith("2") || d.label.startsWith(">")} /></div>
          <div className="xl:col-span-5 grid grid-cols-2 gap-3 content-start">
            <Kpi label="متوسط نسبة الخسارة للموسم" value={pct(R.meanLR)} hint={`الوسيط ${pct(R.medianLR)}`} />
            <Kpi label="احتمال موسم خاسر (> 100%)" value={pct(R.pAbove100)} tone={R.pAbove100 > 0.25 ? "bad" : "warn"} hint="قبل إعادة التأمين" />
            <Kpi label="خسارة الموسم عند 99.5%" value={fmtM(R.var995Loss)} tone="bad" hint={`المتوسط ${fmtM(R.meanLoss)}`} />
            <Kpi label="أكبر خسارة فعالية عند 99.5%" value={fmtM(R.var995Event)} tone="gold" hint="أساس تحديد الحد وإعادة التأمين لكل فعالية" />
          </div>
        </div>
        <p className="text-[12.5px] mt-3 leading-relaxed"><b className="text-navy">القراءة:</b> المنتج يحقق نسبة خسارة متوسطة قريبة من المستهدف، لكن توزيعه ذيلي: فعالية واحدة بموجة حر قد تبلغ خسارتها أضعاف أقساطها. لذلك يقترن المنتج بحد لكل فعالية واحتفاظ للمكتتب وإعادة تأمين لما فوقه، ويُسعَّر ويُراقَب على مستوى الموسم والمحفظة، لا الفعالية الواحدة.</p>
      </Card>
    </div>
  );
}

function Num({ v, onChange, step = 1, suffix }: { v: number; onChange: (v: number) => void; step?: number; suffix?: string }) {
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <input type="number" value={Number(v.toFixed(3))} step={step} onChange={(e) => onChange(Number(e.target.value))} className="num w-24 border border-line rounded-md px-2 py-1 text-ink text-center" />
      {suffix && <span className="text-[11.5px] text-muted">{suffix}</span>}
    </div>
  );
}
