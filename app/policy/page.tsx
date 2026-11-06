"use client";
import Link from "next/link";
import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import SimBar from "@/components/SimBar";
import { Badge, Card, PageHead, Phone } from "@/components/ui";
import { EVENT, GATES, TERMS, ZONES, fmtN, fmtT } from "@/lib/config";
import { liveState } from "@/lib/engine";
import { useSim } from "@/lib/store";

export default function MyPolicy() {
  const { t, scenario, myPolicy } = useSim();
  const tm = Math.floor(t);
  const L = useMemo(() => liveState(scenario, tm), [scenario, tm]);
  if (!myPolicy) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-16 text-center">
        <h1 className="text-[24px] font-bold text-navy">لا توجد وثيقة بعد</h1>
        <p className="text-muted mt-2">اشترِ تذكرة تجريبية وأضف درع الحشود، ثم عد إلى هنا لتتابع وثيقتك أثناء الفعالية.</p>
        <Link href="/buy/" className="inline-block mt-6 bg-navy text-white rounded-xl px-6 py-3 font-bold">اشترِ تذكرة</Link>
      </div>
    );
  }
  const zone = ZONES.find((z) => z.id === myPolicy.zone)!, gate = GATES.find((g) => g.id === myPolicy.gate)!;
  const mine = L.triggers.filter((x) => x.scope === myPolicy.zone || x.scope === myPolicy.gate);
  const settled = mine.filter((x) => x.settledAt <= tm);
  const balance = settled.reduce((s, x) => s + x.payoutEach, 0);
  const notes = L.alerts.filter((a) => a.scope === zone.name || a.scope === gate.name || a.scope === "الفعالية");
  const zh = L.minute.zone[myPolicy.zone].hi, gd = L.minute.gate[myPolicy.gate];
  const active = tm >= (zone.outdoor ? EVENT.fanZoneOpen : EVENT.fanZoneOpen);

  return (
    <div className="mx-auto max-w-[1300px] px-4 py-6">
      <PageHead kicker="رحلة الزائر — الخطوة 2" title="وثيقتي ومحفظتي" sub="ما يراه الزائر أثناء الفعالية. شغّل المحاكاة هنا أو من غرفة المخاطر، وراقب وصول التعويض دون أي إجراء من الزائر." />
      <SimBar compact />
      <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-start mt-5">
        <Phone>
          <div className="bg-navy text-white px-5 pt-10 pb-4">
            <div className="flex justify-between items-start">
              <div><div className="text-[11.5px] opacity-80">درع الحشود · وثيقة فعالية</div><div className="text-[17px] font-bold mt-0.5">{EVENT.short}</div></div>
              <span className={`chip ${active ? "bg-[#e6f3ec] text-ok" : "bg-white/15 text-white"}`}>{active ? "تغطية فعّالة" : "تبدأ 15:00"}</span>
            </div>
            <div className="mt-3 text-[12px] opacity-90">{myPolicy.holder} · <span className="num">{myPolicy.id}</span></div>
          </div>
          <div className="p-4 space-y-3">
            <div className="rounded-xl bg-[#fdf9ee] border border-gold p-3 flex items-center justify-between">
              <div><div className="text-[11.5px] text-muted">رصيد التعويضات</div><div className="num text-[26px] font-bold text-navy">{fmtN(balance)} ر.س</div></div>
              <QRCodeSVG value={`CROWD-SHIELD|${myPolicy.id}`} size={64} fgColor="#1c2a5d" />
            </div>
            {settled.map((x) => (
              <div key={x.id} className="rounded-xl bg-[#e6f3ec] border border-[#bfe3d3] p-3 text-[12.5px] text-ok font-semibold fade-in">
                ✓ {x.type === "heat" ? "تحقق مؤشر الإجهاد الحراري في منطقتك" : "تحقق مؤشر حادث الحشد عند بوابتك"} ({fmtT(x.confirmedAt)}). حُوّل {fmtN(x.payoutEach)} ر.س إلى محفظتك {fmtT(x.settledAt)}.
              </div>
            ))}
            {mine.filter((x) => x.settledAt > tm).map((x) => <div key={x.id} className="rounded-xl bg-[#fbf1dc] p-3 text-[12.5px] text-warn font-semibold pulse">جارٍ تحويل {fmtN(x.payoutEach)} ر.س…</div>)}
            <div className="text-[12px] text-muted">{myPolicy.seat}</div>
            <div className="rounded-xl border border-line divide-y divide-line text-[12.5px]">
              <Row icon="🌡" title="الإجهاد الحراري — منطقتك" value={`${zh.toFixed(1)}°`} status={mine.some((x) => x.type === "heat") ? "تحقق" : L.heatRun[myPolicy.zone] ? `${Math.min(L.heatRun[myPolicy.zone], TERMS.heat.minutes)}/${TERMS.heat.minutes} د` : zone.outdoor ? "دون الشرط" : "منطقة مبرّدة"} />
              <Row icon="👥" title={`كثافة الحشد — ${gate.name}`} value={`${gd.toFixed(2)}/م²`} status={mine.some((x) => x.type === "crowd") ? "تحقق" : L.crowdRun[myPolicy.gate] ? `فوق العتبة ${L.crowdRun[myPolicy.gate]} د` : "طبيعي"} />
              <Row icon="📅" title="الإلغاء أو التأجيل" value="—" status={tm >= EVENT.kickoff ? "انطلقت في موعدها" : "لا إعلان"} />
            </div>
            <div className="text-[12.5px] font-bold text-navy pt-1">الإشعارات</div>
            <ul className="space-y-1.5">
              {[...notes].reverse().slice(0, 6).map((a, i) => <li key={i} className="text-[12px] bg-[#f7f8fb] rounded-lg px-2.5 py-1.5"><span className="num text-muted ml-1">{fmtT(a.t)}</span>{a.text}</li>)}
              {!notes.length && <li className="text-[12px] text-muted">لا إشعارات بعد.</li>}
            </ul>
          </div>
        </Phone>
        <div className="space-y-4">
          <Card title="ماذا يحدث لوثيقتك الآن" sub={`الساعة ${fmtT(tm)} · ${scenario === "A" ? "السيناريو أ" : "السيناريو ب"}`}>
            <ul className="text-[13px] space-y-2 leading-relaxed">
              <li><b className="text-navy">المنطقة:</b> {zone.name} ({zone.note}). {zone.outdoor ? "مؤشر الحرارة يُقاس من حساس الساحة ويُؤكَّد بقراءة المركز الوطني للأرصاد." : "المدرج مبرّد، فاحتمال تحقق مؤشر الحرارة فيه ضئيل."}</li>
              <li><b className="text-navy">البوابة:</b> {gate.name} — {gate.serves}. مؤشر الحشد يُقاس بالرؤية الحاسوبية ويحتاج بلاغًا رسميًا.</li>
              <li><b className="text-navy">التعويضات المستحقة حتى الآن:</b> {mine.length ? mine.map((x) => `${fmtN(x.payoutEach)} ر.س (${x.type === "heat" ? "حرارة" : "حشد"})`).join(" + ") : "لا شيء"}.</li>
            </ul>
          </Card>
          <Card title="جرّب الآن">
            <div className="flex flex-wrap gap-2">
              <Link href="/control/" className="bg-navy text-white rounded-lg px-4 py-2 text-[13px] font-semibold">غرفة المخاطر</Link>
              <Link href="/buy/" className="border border-navy text-navy rounded-lg px-4 py-2 text-[13px] font-semibold">اشترِ تذكرة أخرى</Link>
              <Link href="/report/" className="border border-line rounded-lg px-4 py-2 text-[13px]">تقرير ما بعد الفعالية</Link>
            </div>
            <p className="text-[12px] text-muted mt-2">المحرك يحسب المتأثرين جغرافيًا وزمنيًا؛ وثيقتك تُعامل مثل أي وثيقة من الـ {fmtN(58214)} في المحفظة.</p>
          </Card>
          <Card title="حالة المؤشرات"><div className="flex gap-2 flex-wrap">{L.triggers.length ? L.triggers.map((x) => <Badge key={x.id} tone="bad">{x.scopeName}: {x.type === "heat" ? "حرارة" : "حشد"} {fmtT(x.confirmedAt)}</Badge>) : <Badge tone="ok">لا مؤشرات متحققة</Badge>}</div></Card>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, title, value, status }: { icon: string; title: string; value: string; status: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 gap-2">
      <div><div className="font-semibold">{icon} {title}</div><div className="text-[11.5px] text-muted">{status}</div></div>
      <div className="num font-bold text-navy">{value}</div>
    </div>
  );
}
