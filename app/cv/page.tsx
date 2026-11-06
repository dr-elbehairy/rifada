"use client";
import { useCallback, useState } from "react";
import CameraFeed, { CVFrame, useCV } from "@/components/CameraFeed";
import { SimpleBars } from "@/components/Charts";
import { Card, Kpi, PageHead } from "@/components/ui";
import { asset } from "@/lib/base";

export default function CVLab() {
  const data = useCV("gate_cam");
  const dense = useCV("limits_dense");
  const [playing, setPlaying] = useState(true);
  const [f, setF] = useState<CVFrame | null>(null);
  const onFrame = useCallback((x: CVFrame) => setF(x), []);
  const meta = (data?.meta ?? {}) as Record<string, string | number | number[]>;
  const series = data?.series ?? [];
  const totals = series.map((s) => ({ label: s.i % 4 === 0 ? `${s.t.toFixed(0)}ث` : "", value: s.total }));

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <PageHead kicker="المصدر الأول لمؤشر الحشد" title="مختبر الرؤية الحاسوبية"
        sub="هذه نتائج فعلية لخط المعالجة في النموذج الأولي (Python · ultralytics YOLOv8m) على فيديو حشد حقيقي مرخّص من Wikimedia Commons. الإطارات أدناه لم تُرسم يدويًا: كل صندوق ورقم خرج من النموذج." />
      <div className="grid xl:grid-cols-12 gap-4">
        <Card className="xl:col-span-8" title="الإطار المُحلَّل" sub="صناديق الأشخاص + شبكة 3×3 قطاعات بمساحات معايَرة + خريطة حرارية للتمركز" right={<button onClick={() => setPlaying(!playing)} className="text-[12.5px] px-3 py-1.5 rounded-lg border border-line">{playing ? "إيقاف" : "تشغيل"}</button>}>
          <CameraFeed playing={playing} onFrame={onFrame} label="فيديو مرخّص · تحليل فعلي" />
        </Card>
        <div className="xl:col-span-4 grid grid-cols-2 gap-3 content-start">
          <Kpi label="أشخاص مرصودون في الإطار" value={f?.total ?? "—"} big />
          <Kpi label="أعلى كثافة قطاع" value={f ? f.max_density.toFixed(2) : "—"} hint="شخص/م²" tone="gold" big />
          <Kpi label="متوسط الأشخاص/إطار" value={String(meta.persons_mean ?? "—")} />
          <Kpi label="زمن المعالجة/إطار" value={`${meta.runtime_s_per_frame ?? "—"} ث`} hint="حاسوب محمول، بلا GPU مخصّص" tone="petrol" />
          <Card className="col-span-2" title="كثافة القطاعات في الإطار الحالي">
            <SimpleBars data={(f?.sectors ?? []).map((s) => ({ label: s.id, value: s.density }))} h={170} unit="" color="#007a88" />
          </Card>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-4 mt-4">
        <Card title="عدد الأشخاص عبر الزمن (الثانية من المقطع)" sub="ثبات القراءة بين إطارات متتالية مؤشر على موثوقية الإشارة؛ المحرك يأخذ المتوسط المتحرك لا الإطار المفرد">
          <SimpleBars data={totals} h={220} color="#1c2a5d" />
        </Card>
        <Card title="إعدادات خط المعالجة ومعايرته">
          <table className="w-full text-[12.5px]">
            <tbody>
              {[
                ["المصدر", String(meta.source ?? "")],
                ["النموذج", String(meta.model ?? "")],
                ["طريقة الاستدلال", String(meta.method ?? "")],
                ["عتبة الثقة", String(meta.conf ?? "")],
                ["الشبكة", String(meta.grid ?? "")],
                ["مساحة القطاع لكل صف (م²)", Array.isArray(meta.row_areas_m2) ? meta.row_areas_m2.join(" / ") : ""],
                ["إطارات مُحلَّلة", String(meta.frames ?? "")],
                ["الخصوصية", "لا تخزين للفيديو في المنصة؛ لا تعرّف على الوجوه؛ تُرسل الكثافة فقط"],
              ].map(([k, v]) => <tr key={k} className="border-b border-line"><td className="py-1.5 pl-3 font-semibold text-navy w-[40%]">{k}</td><td className="py-1.5" dir="auto">{v}</td></tr>)}
            </tbody>
          </table>
          <p className="text-[12px] text-muted mt-2">الكثافة = عدد الأشخاص الذين تقع نقطة أقدامهم داخل القطاع ÷ مساحة القطاع على الأرض. المساحات تُعايَر لكل كاميرا مرة واحدة (هنا تقديرية لكل صف بسبب المنظور).</p>
        </Card>
      </div>

      <div className="grid xl:grid-cols-12 gap-4 mt-4">
        <Card className="xl:col-span-5" title="حدود معلنة: الحشود شديدة الكثافة" sub="الطواف، 2016 (CC BY 3.0) — نفس الخط بنفس الإعدادات">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/cv/limits_dense/frame_000.jpg")} alt="إطار طواف بعد التحليل يظهر عدم قدرة كاشف الأشخاص على عدّ الحشد الكثيف" className="rounded-lg w-full" />
          <p className="text-[12.5px] mt-2">رصد الكاشف <b className="num">{dense?.series[0]?.total ?? "…"}</b> شخصًا فقط في مشهد يضم آلافًا. السبب: في الكثافة العالية لا تظهر الأجساد كاملة، فيفشل أي كاشف قائم على الصناديق.</p>
        </Card>
        <Card className="xl:col-span-7" title="كيف نعالج ذلك في النسخة التشغيلية" sub="القرار التصميمي معلن للجنة، لا مخفي">
          <ol className="list-decimal pr-5 text-[13px] space-y-2 leading-relaxed">
            <li><b>نموذجان حسب الكثافة:</b> كاشف الأشخاص (المعروض هنا) للكثافات حتى نحو 2 شخص/م²، ونموذج خريطة كثافة (CSRNet أو DM-Count) للكثافات الأعلى، يُدرَّب على مشاهد محلية ويُختبر قبل الاعتماد. يجري التبديل آليًا حسب قراءة الكاشف.</li>
            <li><b>معايرة هندسية لكل كاميرا:</b> تحويل منظوري (homography) من صورة الكاميرا إلى مخطط الأرض بالأمتار، بدل مساحة تقديرية لكل صف.</li>
            <li><b>لا يقرّر النموذج وحده:</b> مؤشر الحشد يتطلب بلاغًا رسميًا مستقلًا، فخطأ النموذج لا يصرف تعويضًا بمفرده، وأسوأ أثر له إنذار مبكر زائد للمنظّم.</li>
            <li><b>معيار القبول قبل البيئة التجريبية:</b> خطأ مطلق متوسط أقل من 15% في كثافة القطاعات على عينة موسومة محليًا، ودقة تصنيف «فوق/دون العتبة» أعلى من 95%.</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
