# درع الحشود — Crowd Shield

**نموذج أولي لبرمجان التأمين 2026 (هيئة التأمين · منظومة الابتكار) — المسار 04: الفعاليات الكبرى والتجمعات الحاشدة.**
تأمين بارامتري فوري للفعاليات الكبرى يُفعَّل بالرصد الذكي، لا بالمطالبة. مقدَّم من نخبة حلول الأعمال.

**العرض المباشر:** https://dr-elbehairy.github.io/crowd-shield/

## ما الذي يعمل
- شراء التذكرة مع إصدار الوثيقة برمز QR في الرحلة نفسها.
- أوراكل المؤشرات بقاعدة المصدرين: الحرارة الظاهرة (حساس الموقع + المركز الوطني للأرصاد)، وحادث الحشد (رؤية حاسوبية + بلاغ رسمي).
- صرف تلقائي على أربع مراحل خلال 4 دقائق، مع حد للفعالية واحتفاظ للمكتتب وإعادة تأمين.
- سجل تدقيق بسلسلة بصمات SHA-256.
- تسعير اكتواري (قسط 7.96 ريال يُعرض بثمانية) ومحاكاة مونت كارلو لـ 20,000 موسم في المتصفح.
- خط رؤية حاسوبية حقيقي (`cv_pipeline/run_density.py`: YOLOv8 باستدلال مُجزّأ مُكبَّر) ومخرجاته الفعلية في `public/cv/`.

## ما هو محاكى
قراءات الأرصاد والحساسات وكثافة البوابات في السيناريو محاكاة مُعايَرة. الوثائق (58,214) والبلاغات اصطناعية، ولا تحويلات مالية حقيقية.

## التشغيل
```bash
npm install && npm run build && npx serve out
```
التقنيات: Next.js 16، TypeScript، Tailwind، Recharts؛ وPython مع ultralytics وOpenCV لخط الرؤية.

فيديو مختبر الرؤية من Wikimedia Commons (CC BY-SA 4.0 / CC BY 3.0)؛ انظر `cv_pipeline/SOURCES.md`.

---
*Crowd Shield — a working prototype of sensor-triggered parametric micro-insurance for mega events (Saudi Insurance Authority Insurance Hackathon 2026). All policy data is synthetic; no real payments.*
