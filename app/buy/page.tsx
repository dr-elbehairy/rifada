"use client";
import Link from "next/link";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, PageHead, Phone } from "@/components/ui";
import { EVENT, TERMS, fmtN } from "@/lib/config";
import { useSim } from "@/lib/store";
import { TICKETS } from "@/lib/tickets";
import { sha256 } from "@/lib/util";

type Step = 0 | 1 | 2 | 3;

export default function Buy() {
  const { buy, myPolicy } = useSim();
  const [step, setStep] = useState<Step>(0);
  const [sel, setSel] = useState(TICKETS[0].key);
  const [shield, setShield] = useState(true);
  const [name, setName] = useState("عبدالله المطيري");
  const [c1, setC1] = useState(true);
  const [c2, setC2] = useState(true);
  const tk = TICKETS.find((x) => x.key === sel)!;
  const total = tk.price + (shield ? TERMS.premium : 0);
  const [issued, setIssued] = useState<ReturnType<typeof buy> | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const pay = () => {
    const t0 = performance.now();
    if (!shield) { setIssued(null); setStep(3); setLog(["تذكرة بلا حماية رِفادة: لا وثيقة"]); return; }
    const p = buy({ holder: name, zone: tk.zone, gate: tk.gate, seat: tk.seat, ticket: tk.price });
    const h = sha256(JSON.stringify(p));
    setIssued(p);
    setLog([
      `POST /policies → 201 Created (${p.id})`,
      `ربط الوثيقة بالمنطقة ${tk.zone} والبوابة ${tk.gate} ونافذة التغطية`,
      `قيد سجل التدقيق: POLICY_ISSUED · بصمة ${h.slice(0, 16)}…`,
      `إشعار للزائر عبر الرسائل والتطبيق`,
      `زمن الإصدار: ${(performance.now() - t0).toFixed(1)} ملّي ثانية`,
    ]);
    setStep(3);
  };

  return (
    <div className="mx-auto max-w-[1300px] px-4 py-6">
      <PageHead kicker="رحلة الزائر — الخطوة 1" title="شراء التذكرة مع رِفادة" sub="الوثيقة تُصدر لحظة الدفع ضمن رحلة شراء التذكرة نفسها: لا نموذج، لا أسئلة، ولا رحلة منفصلة. الشروط كلها على شاشة واحدة قبل الدفع." />
      <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-start">
        <Phone>
          <div className="bg-navy text-white px-5 pt-10 pb-4">
            <div className="text-[11.5px] opacity-80">منصة التذاكر (تجريبية)</div>
            <div className="text-[18px] font-bold leading-snug mt-0.5">{EVENT.short}</div>
            <div className="text-[11.5px] opacity-80 mt-0.5">{EVENT.date}</div>
          </div>
          {step === 0 && (
            <div className="p-4 space-y-2.5 fade-in">
              <div className="text-[13px] font-bold text-navy">اختر المقعد</div>
              {TICKETS.map((x) => (
                <button key={x.key} onClick={() => setSel(x.key)} className={`w-full text-right rounded-xl border px-3 py-2.5 ${sel === x.key ? "border-navy bg-[#eef1f8]" : "border-line"}`}>
                  <div className="flex justify-between"><span className="font-semibold text-[13.5px] text-ink">{x.title}</span><span className="num font-bold text-navy text-[13.5px]">{x.price} ر.س</span></div>
                  <div className="text-[11.5px] text-muted mt-0.5">{x.note}</div>
                </button>
              ))}
              <button onClick={() => setStep(1)} className="w-full bg-navy text-white rounded-xl py-3 font-bold mt-2">متابعة</button>
            </div>
          )}
          {step === 1 && (
            <div className="p-4 fade-in">
              <div className="rounded-2xl border-2 border-gold bg-[#fdf9ee] p-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-navy text-[15px]">🛡 رِفادة</div>
                  <label className="flex items-center gap-2 text-[13px] font-semibold"><input type="checkbox" checked={shield} onChange={(e) => setShield(e.target.checked)} className="w-4 h-4 accent-[#1c2a5d]" /> أضف بـ {TERMS.premium} ر.س</label>
                </div>
                <p className="text-[12px] text-muted mt-1">حماية فورية طوال الفعالية؛ التعويض يصلك تلقائيًا بلا مطالبة.</p>
                <ul className="mt-3 space-y-2 text-[12.5px]">
                  <li className="flex justify-between gap-2"><span>🌡 إجهاد حراري: حرارة ظاهرة ≥ 45° لساعتين في منطقتك</span><b className="num text-navy whitespace-nowrap">300 ر.س</b></li>
                  <li className="flex justify-between gap-2"><span>👥 حادث حشد: كثافة ≥ 4/م² لعشر دقائق + بلاغ رسمي</span><b className="num text-navy whitespace-nowrap">1,000 ر.س</b></li>
                  <li className="flex justify-between gap-2"><span>📅 إلغاء أو تأجيل ≥ 6 ساعات</span><b className="num text-navy whitespace-nowrap">50% من التذكرة</b></li>
                </ul>
                <details className="mt-3 text-[11.5px] text-muted"><summary className="cursor-pointer text-navy font-semibold">الاستثناءات والمصادر</summary>
                  <p className="mt-1 leading-relaxed">يُقاس المؤشر من مصدرين رسميين مستقلين (حساس الموقع والمركز الوطني للأرصاد؛ أو الرؤية الحاسوبية وبلاغ الدفاع المدني). لا تعويض عن الأحداث خارج منطقة تذكرتك أو خارج نافذة التغطية. المكتتب: شركة تأمين مرخّصة (شريك). يمكنك الإلغاء قبل الفعالية واسترداد القسط.</p></details>
              </div>
              <button onClick={() => setStep(2)} className="w-full bg-navy text-white rounded-xl py-3 font-bold mt-4">متابعة للدفع</button>
              <button onClick={() => setStep(0)} className="w-full text-[12.5px] text-muted mt-2">رجوع</button>
            </div>
          )}
          {step === 2 && (
            <div className="p-4 fade-in space-y-3">
              <label className="block text-[12.5px] text-muted">الاسم كما في الهوية<input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-ink" /></label>
              <div className="rounded-xl bg-fill p-3 text-[13px] space-y-1">
                <div className="flex justify-between"><span>{tk.title}</span><span className="num">{tk.price} ر.س</span></div>
                {shield && <div className="flex justify-between"><span>رِفادة</span><span className="num">{TERMS.premium} ر.س</span></div>}
                <div className="flex justify-between font-bold text-navy border-t border-line pt-1"><span>الإجمالي</span><span className="num">{total} ر.س</span></div>
              </div>
              {shield && (
                <div className="space-y-1.5 text-[12px]">
                  <label className="flex gap-2"><input type="checkbox" checked={c1} onChange={(e) => setC1(e.target.checked)} /> قرأت المؤشرات والاستثناءات على الشاشة السابقة</label>
                  <label className="flex gap-2"><input type="checkbox" checked={c2} onChange={(e) => setC2(e.target.checked)} /> أوافق على ربط تذكرتي بالوثيقة لتحديد منطقتي وإرسال التعويض لمحفظتي</label>
                </div>
              )}
              <button disabled={shield && !(c1 && c2)} onClick={pay} className="w-full bg-goldd disabled:opacity-40 text-white rounded-xl py-3 font-bold">ادفع {total} ر.س (تجريبي)</button>
              <button onClick={() => setStep(1)} className="w-full text-[12.5px] text-muted">رجوع</button>
            </div>
          )}
          {step === 3 && (
            <div className="p-4 fade-in text-center">
              {issued ? (
                <>
                  <div className="text-[40px]">✓</div>
                  <div className="font-bold text-navy text-[16px]">تم إصدار الوثيقة</div>
                  <div className="num text-[13px] text-muted">{issued.id}</div>
                  <div className="my-4 grid place-items-center"><QRCodeSVG value={`RIFADA|${issued.id}|${issued.zone}|${issued.gate}`} size={150} fgColor="#1c2a5d" /></div>
                  <div className="text-[12.5px] text-ink">{issued.seat}</div>
                  <Link href="/policy/" className="block w-full bg-navy text-white rounded-xl py-3 font-bold mt-4">افتح وثيقتي</Link>
                  <Link href="/control/" className="block w-full border border-navy text-navy rounded-xl py-3 font-bold mt-2">تابع من غرفة المخاطر</Link>
                </>
              ) : (
                <><div className="font-bold text-navy mt-6">تمت التذكرة بلا حماية</div><button onClick={() => setStep(1)} className="mt-4 text-navy underline text-[13px]">أضف حماية رِفادة</button></>
              )}
            </div>
          )}
        </Phone>

        <div className="space-y-4">
          <Card title="ما الذي يحدث خلف الشاشة" sub="الوثيقة تُنشأ بوصفها سجلًا مرتبطًا بالتذكرة، وتُسجَّل في سجل التدقيق المتسلسل">
            {log.length ? (
              <ol className="font-mono text-[12px] space-y-1.5" dir="rtl">{log.map((l, i) => <li key={i} className="bg-[#0f1530] text-[#d7e1ff] rounded-md px-3 py-1.5 fade-in">{l}</li>)}</ol>
            ) : (
              <ol className="list-decimal pr-5 text-[13px] space-y-1.5 text-ink">
                <li>اختيار المقعد يحدد <b>المنطقة</b> (للحرارة) و<b>البوابة</b> (للحشد) تلقائيًا.</li>
                <li>شاشة واحدة تعرض المؤشرات الثلاثة والمبالغ الثابتة والاستثناءات.</li>
                <li>عند الدفع تُصدر الوثيقة برمز استجابة سريعة وتُضاف إلى محفظة الفعالية.</li>
                <li>من هنا لا يفعل الزائر شيئًا: المحرك يرصد ويقرر ويصرف.</li>
              </ol>
            )}
          </Card>
          <Card title="لماذا السعر موحّد عند 8 ريالات؟" sub="التسعير الاكتواري حسب المنطقة متاح في صفحة التسعير">
            <p className="text-[13px] leading-relaxed">الخسارة المتوقعة المختلطة للزائر 4.98 ريال، وبتحميل المصاريف والربح وإعادة التأمين (×1.6) يصبح القسط 7.96 ريال. السعر حسب الخطر 21.40 ريال لساحة المشجعين المكشوفة و2.20 للمدرج المبرّد؛ نقترح السعر الموحّد تجاريًا لبساطته، مع حدود لكل فعالية.</p>
            <Link href="/pricing/" className="inline-block mt-2 text-navy font-semibold text-[13px] underline">افتح نموذج التسعير</Link>
          </Card>
          <Card title="جرّب السيناريوهات">
            <ul className="text-[13px] space-y-1.5">
              <li>• اختر <b>ساحة المشجعين</b> لترى صرف مؤشر الحرارة نحو 17:12.</li>
              <li>• اختر <b>المدرج الجنوبي (مخرج البوابة 7)</b> ثم السيناريو ب لترى صرف مؤشر الحشد نحو 23:08.</li>
              <li>• في السيناريو أ يصدر الإنذار المبكر ويستجيب المنظّم فلا يتحقق مؤشر الحشد: التأمين هنا أداة وقاية.</li>
            </ul>
            {myPolicy && <p className="text-[12px] text-muted mt-2">لديك وثيقة نشطة: <span className="num">{myPolicy.id}</span> ({fmtN(myPolicy.ticket)} ر.س).</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
