"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { EVENT } from "@/lib/config";
import { useSim } from "@/lib/store";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/buy/", label: "شراء التذكرة" },
  { href: "/policy/", label: "وثيقتي" },
  { href: "/control/", label: "غرفة المخاطر" },
  { href: "/cv/", label: "مختبر الرؤية" },
  { href: "/pricing/", label: "التسعير الاكتواري" },
  { href: "/report/", label: "تقرير الفعالية" },
  { href: "/methodology/", label: "المنهجية" },
];

/** يحرّك ساعة المحاكاة عند التشغيل ويستعيد الحالة من الجلسة */
function SimDriver() {
  const hydrate = useSim((s) => s.hydrate);
  const last = useRef<number | null>(null);
  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    let raf = 0;
    const loop = (ts: number) => {
      const s = useSim.getState();
      if (s.playing) {
        if (last.current != null) {
          const dt = (ts - last.current) / 1000;
          const nt = s.t + dt * s.speed;
          if (nt >= EVENT.simEnd) { s.setT(EVENT.simEnd); s.pause(); } else useSim.setState({ t: nt });
          if (Math.floor(nt) !== Math.floor(s.t)) { try { const raw = sessionStorage.getItem("crowd-shield-demo-v1"); const v = raw ? JSON.parse(raw) : {}; sessionStorage.setItem("crowd-shield-demo-v1", JSON.stringify({ ...v, t: nt })); } catch { /* تجاهل */ } }
        }
        last.current = ts;
      } else last.current = null;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <>
      <SimDriver />
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-[1400px] px-4 h-16 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <svg width="34" height="38" viewBox="0 0 34 38" aria-hidden><path d="M17 1 L32 7 V18 C32 28 25 34 17 37 C9 34 2 28 2 18 V7 Z" fill="#1c2a5d" /><path d="M17 6 L27 10 V18 C27 25 22 29.5 17 31.5 Z" fill="#cd9f36" /><circle cx="12" cy="17" r="2.2" fill="#fff" /><circle cx="12" cy="24" r="2.2" fill="#fff" /></svg>
            <div className="leading-tight">
              <div className="text-[17px] font-bold text-navy">درع الحشود</div>
              <div className="text-[11px] text-muted">نموذج أولي · برمجان التأمين 2026</div>
            </div>
          </Link>
          <nav className="flex-1 overflow-x-auto">
            <ul className="flex gap-1 text-[13.5px] whitespace-nowrap">
              {NAV.map((n) => {
                const active = n.href === "/" ? path === "/" : path?.startsWith(n.href.replace(/\/$/, ""));
                return (
                  <li key={n.href}>
                    <Link href={n.href} className={`px-3 py-2 rounded-lg block transition ${active ? "bg-navy text-white" : "text-ink hover:bg-fill"}`}>{n.label}</Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="hidden xl:block text-[11px] text-muted text-left leading-tight shrink-0">مقدَّم من<br /><span className="font-semibold text-navy">نخبة حلول الأعمال</span></div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="no-print border-t border-line mt-10">
        <div className="mx-auto max-w-[1400px] px-4 py-5 text-[12px] text-muted flex flex-wrap gap-x-6 gap-y-1 justify-between">
          <span>نموذج أولي للعرض ضمن برمجان التأمين 2026 — هيئة التأمين · منظومة الابتكار. البيانات اصطناعية والسيناريو افتراضي؛ لا وثائق أو مدفوعات حقيقية.</span>
          <span>فيديو مختبر الرؤية: Wikimedia Commons (CC BY-SA 4.0 / CC BY 3.0)</span>
        </div>
      </footer>
    </>
  );
}
