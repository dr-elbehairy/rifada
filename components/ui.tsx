"use client";
import { ReactNode } from "react";

export function Card({ title, sub, right, children, className = "", pad = true }: { title?: ReactNode; sub?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`card ${className}`}>
      {(title || right) && (
        <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2">
          <div>
            {title && <h3 className="text-[14.5px] font-bold text-navy">{title}</h3>}
            {sub && <p className="text-[12px] text-muted mt-0.5">{sub}</p>}
          </div>
          {right}
        </div>
      )}
      <div className={pad ? "px-4 pb-4" : ""}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, hint, tone = "navy", big = false }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "navy" | "gold" | "ok" | "warn" | "bad" | "petrol"; big?: boolean }) {
  const c = { navy: "text-navy", gold: "text-goldd", ok: "text-ok", warn: "text-warn", bad: "text-bad", petrol: "text-petrol" }[tone];
  return (
    <div className="card px-4 py-3">
      <div className="text-[12px] text-muted">{label}</div>
      <div className={`num text-right font-bold ${c} ${big ? "text-[30px]" : "text-[24px]"} leading-tight mt-0.5`}>{value}</div>
      {hint && <div className="text-[11.5px] text-muted mt-0.5">{hint}</div>}
    </div>
  );
}

export function Badge({ tone, children, pulse = false }: { tone: "ok" | "warn" | "bad" | "info" | "gold"; children: ReactNode; pulse?: boolean }) {
  const c = { ok: "bg-[#e6f3ec] text-ok", warn: "bg-[#fbf1dc] text-warn", bad: "bg-[#f8e3e0] text-bad", info: "bg-[#e7ebf6] text-navy", gold: "bg-[#f8efd9] text-goldd" }[tone];
  return <span className={`chip ${c}`}>{pulse && <span className="w-1.5 h-1.5 rounded-full bg-current pulse" />}{children}</span>;
}

export function PageHead({ kicker, title, sub, right }: { kicker?: string; title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
      <div>
        {kicker && <div className="text-[12.5px] font-semibold text-goldd mb-1">{kicker}</div>}
        <h1 className="text-[26px] font-bold text-navy leading-tight">{title}</h1>
        {sub && <p className="text-[14px] text-muted mt-1.5 max-w-[880px] leading-relaxed">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[372px] h-[760px] rounded-[46px] border-[10px] border-[#12151c] bg-white shadow-[0_24px_60px_rgba(28,42,93,.25)] overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#12151c] rounded-b-2xl z-10" />
      <div className="h-full overflow-y-auto">{children}</div>
    </div>
  );
}

export const toneOfDensity = (d: number) => (d >= 4 ? "#b03a2e" : d >= 3 ? "#c08a12" : d >= 2 ? "#cd9f36" : "#1e7b4b");
export const toneOfHeat = (h: number) => (h >= 45 ? "#b03a2e" : h >= 43.5 ? "#c08a12" : h >= 38 ? "#cd9f36" : "#1e7b4b");
