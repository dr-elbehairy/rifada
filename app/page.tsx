import Link from "next/link";
import { asset } from "@/lib/base";

const STEPS = [
  { n: "1", t: "اشترِ تذكرة", d: "أضف الدرع بـ 8 ريالات في رحلة الشراء نفسها؛ تُصدر الوثيقة برمز QR في أقل من ثانية.", href: "/buy/", cta: "شراء التذكرة" },
  { n: "2", t: "شغّل الفعالية", d: "في غرفة المخاطر: أرصاد وحساسات وكاميرات، وأوراكل يطبّق قاعدة المصدرين لحظة بلحظة.", href: "/control/", cta: "غرفة المخاطر" },
  { n: "3", t: "استلم التعويض", d: "عند تحقق المؤشر يصل المبلغ لمحفظة الزائر خلال دقائق، بلا مطالبة ولا مستندات.", href: "/policy/", cta: "وثيقتي" },
  { n: "4", t: "اقرأ التقرير", d: "تقرير آلي للمنظّم والمكتتب والهيئة: المؤشرات والمصادر والأثر المالي وتوصيات السلامة.", href: "/report/", cta: "التقرير" },
];

export default function Home() {
  return (
    <div>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-[1400px] px-4 py-14 grid lg:grid-cols-[1.25fr_1fr] gap-10 items-center">
          <div>
            <div className="text-gold font-semibold text-[14px]">برمجان التأمين 2026 · المسار 04 الفعاليات الكبرى والتجمعات الحاشدة</div>
            <h1 className="text-[44px] font-bold leading-tight mt-3">درع الحشود</h1>
            <p className="text-[20px] mt-3 leading-relaxed text-[#e5e9f5]">تأمين بارامتري فوري للفعاليات الكبرى يُفعَّل بالرصد الذكي، لا بالمطالبة.</p>
            <p className="text-[14.5px] mt-4 leading-relaxed text-[#c9d1ea] max-w-[640px]">وثيقة مصغّرة تُدمج في تذكرة الفعالية، وتصرف تعويضًا ثابتًا تلقائيًا عند تحقق مؤشر مقيس من مصدرين رسميين: الإجهاد الحراري، أو حادث حشد مرصود بالرؤية الحاسوبية ومؤكَّد ببلاغ رسمي، أو إلغاء الفعالية. ومعها غرفة مخاطر لحظية مشتركة بين المنظّم وشركة التأمين وهيئة التأمين.</p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link href="/buy/" className="bg-gold text-navy font-bold rounded-xl px-6 py-3">ابدأ العرض التجريبي</Link>
              <Link href="/control/" className="border border-white/40 rounded-xl px-6 py-3 font-semibold">غرفة المخاطر مباشرة</Link>
              <a href={asset("/video/crowd-shield-demo.mp4")} target="_blank" rel="noreferrer" className="border border-gold/60 text-gold rounded-xl px-6 py-3 font-semibold">▶ فيديو العرض (2:42)</a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["8 ر.س", "قسط موحّد للزائر (اكتواريًا 7.96)"], ["< 5 دقائق", "من تحقق المؤشر إلى المحفظة"], ["مصدران", "لكل مؤشر قبل أي صرف"], ["0 مطالبة", "لا مستندات ولا احتيال فردي"]].map(([a, b]) => (
              <div key={a} className="rounded-2xl bg-white/8 border border-white/15 p-5"><div className="num text-right text-[30px] font-bold text-gold">{a}</div><div className="text-[13px] text-[#d5dbef] mt-1">{b}</div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-10">
        <h2 className="text-[22px] font-bold text-navy">العرض في أربع خطوات (نحو 3 دقائق)</h2>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
          {STEPS.map((s) => (
            <Link key={s.n} href={s.href} className="card p-5 hover:shadow-md transition block">
              <div className="w-9 h-9 rounded-full bg-navy text-white grid place-items-center font-bold">{s.n}</div>
              <div className="font-bold text-navy text-[16px] mt-3">{s.t}</div>
              <p className="text-[13px] text-muted mt-1.5 leading-relaxed">{s.d}</p>
              <div className="text-goldd font-semibold text-[13px] mt-3">{s.cta} ←</div>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mt-8">
          <Link href="/cv/" className="card p-5 block hover:shadow-md"><div className="font-bold text-navy">مختبر الرؤية الحاسوبية</div><p className="text-[13px] text-muted mt-1">مخرجات فعلية لنموذج YOLOv8 باستدلال مُجزّأ على فيديو حشد مرخّص، مع الحدود المعلنة وخطة معالجتها.</p></Link>
          <Link href="/pricing/" className="card p-5 block hover:shadow-md"><div className="font-bold text-navy">التسعير الاكتواري</div><p className="text-[13px] text-muted mt-1">خسارة متوقعة لكل مؤشر، تحميلات، سعر موحّد وحسب المنطقة، ومحاكاة مونت كارلو لـ 20,000 موسم.</p></Link>
          <Link href="/methodology/" className="card p-5 block hover:shadow-md"><div className="font-bold text-navy">المنهجية والشفافية</div><p className="text-[13px] text-muted mt-1">ما الحقيقي وما المحاكى في هذا النموذج، وقواعد المصدرين، والحوكمة والخصوصية، والبنية المستهدفة.</p></Link>
        </div>

        <div className="card p-5 mt-8 bg-fill">
          <div className="font-bold text-navy">السيناريو التجريبي</div>
          <p className="text-[13.5px] mt-1 leading-relaxed">نهائي بطولة في ملعب بسعة 60,000 مع ساحة مشجعين خارجية، يوم موجة حر في الرياض. <b>السيناريو أ:</b> يتحقق مؤشر الحرارة في الساحة، ويُطلق الإنذار المبكر عند البوابة 7 فيستجيب المنظّم ولا يقع حادث. <b>السيناريو ب:</b> لا استجابة، فيتحقق مؤشر الحشد ويُصرف لحاملي تذاكر البوابة 7. البيانات اصطناعية ولا مدفوعات حقيقية.</p>
        </div>
      </section>
    </div>
  );
}
