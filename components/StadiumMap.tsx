"use client";
import { GATES, GateId, TERMS, ZONES, ZoneId, fmtN } from "@/lib/config";
import { LiveState } from "@/lib/engine";
import { toneOfDensity, toneOfHeat } from "./ui";

const CX = 440, CY = 235, RXo = 225, RYo = 170, RXi = 150, RYi = 105;
const pt = (a: number, rx: number, ry: number) => [CX + rx * Math.cos((a * Math.PI) / 180), CY + ry * Math.sin((a * Math.PI) / 180)];
function ring(a0: number, a1: number) {
  const o: number[][] = [], i: number[][] = [];
  for (let a = a0; a <= a1; a += 3) { o.push(pt(a, RXo, RYo)); i.push(pt(a, RXi, RYi)); }
  o.push(pt(a1, RXo, RYo)); i.push(pt(a1, RXi, RYi));
  return "M" + [...o, ...i.reverse()].map((p) => p.map((x) => x.toFixed(1)).join(",")).join(" L") + " Z";
}
const STANDS: { id: ZoneId; a0: number; a1: number; lx: number; ly: number }[] = [
  { id: "N", a0: -132, a1: -48, lx: 0, ly: -138 }, { id: "E", a0: -42, a1: 42, lx: 188, ly: 0 },
  { id: "S", a0: 48, a1: 132, lx: 0, ly: 138 }, { id: "W", a0: 138, a1: 222, lx: -188, ly: 0 },
];
const GATE_POS: Record<GateId, number> = { G1: -150, G3: -24, G5: 158, G7: 62 };

export default function StadiumMap({ L, highlightZone, highlightGate }: { L: LiveState; highlightZone?: ZoneId; highlightGate?: GateId }) {
  const trig = new Set(L.triggers.map((x) => x.scope));
  const fz = L.minute.zone.FZ.hi;
  return (
    <svg viewBox="0 0 700 500" className="w-full h-auto" role="img" aria-label="خريطة الملعب وساحة المشجعين">
      <defs>
        <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="none" /><line x1="0" y1="0" x2="0" y2="8" stroke="#fff" strokeWidth="2.2" opacity=".55" /></pattern>
      </defs>
      {/* ساحة المشجعين */}
      <rect x="18" y="95" width="150" height="280" rx="14" fill={toneOfHeat(fz)} opacity=".88" stroke={highlightZone === "FZ" ? "#1c2a5d" : "#fff"} strokeWidth={highlightZone === "FZ" ? 4 : 2} />
      {trig.has("FZ") && <rect x="18" y="95" width="150" height="280" rx="14" fill="url(#hatch)" />}
      <text x="93" y="200" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700">ساحة المشجعين</text>
      <text x="93" y="222" textAnchor="middle" fill="#fff" fontSize="12">مكشوفة · {fmtN(ZONES[0].policies)} وثيقة</text>
      <text x="93" y="258" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="700" style={{ direction: "ltr" }}>{fz.toFixed(1)}°</text>
      <text x="93" y="278" textAnchor="middle" fill="#fff" fontSize="11">الحرارة الظاهرة (حساس الموقع)</text>
      {trig.has("FZ") && <text x="93" y="318" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">✓ تحقق المؤشر</text>}
      {trig.has("FZ") && <text x="93" y="338" textAnchor="middle" fill="#fff" fontSize="12">صُرف التعويض</text>}
      {!trig.has("FZ") && L.heatRun.FZ > 0 && <text x="93" y="318" textAnchor="middle" fill="#fff" fontSize="12.5" fontWeight="600" style={{ direction: "rtl" }}>نافذة الحرارة: {Math.min(L.heatRun.FZ, TERMS.heat.minutes)} / {TERMS.heat.minutes} د</text>}
      {/* الملعب */}
      <ellipse cx={CX} cy={CY} rx={RXo + 8} ry={RYo + 8} fill="#eef0f5" />
      {STANDS.map((s) => {
        const z = ZONES.find((x) => x.id === s.id)!;
        return (
          <g key={s.id}>
            <path d={ring(s.a0, s.a1)} fill="#dfe6f2" stroke={highlightZone === s.id ? "#1c2a5d" : "#fff"} strokeWidth={highlightZone === s.id ? 4 : 2} />
            <text x={CX + s.lx} y={CY + s.ly - 6} textAnchor="middle" fill="#1c2a5d" fontSize="12.5" fontWeight="700">{z.name.replace("المدرج ", "")}</text>
            <text x={CX + s.lx} y={CY + s.ly + 10} textAnchor="middle" fill="#5d6475" fontSize="10.5" style={{ direction: "ltr" }}>{L.minute.zone[s.id].hi.toFixed(1)}° · {fmtN(z.policies)}</text>
          </g>
        );
      })}
      <ellipse cx={CX} cy={CY} rx={RXi - 6} ry={RYi - 6} fill="#2f7d4f" />
      <rect x={CX - 95} y={CY - 58} width="190" height="116" fill="none" stroke="#fff" strokeWidth="2" opacity=".8" />
      <line x1={CX} y1={CY - 58} x2={CX} y2={CY + 58} stroke="#fff" strokeWidth="2" opacity=".8" />
      <circle cx={CX} cy={CY} r="16" fill="none" stroke="#fff" strokeWidth="2" opacity=".8" />
      {/* البوابات */}
      {GATES.map((g) => {
        const [x, y] = pt(GATE_POS[g.id], RXo + 28, RYo + 28);
        const d = L.minute.gate[g.id], hit = trig.has(g.id), run = L.crowdRun[g.id];
        const r = 17 + Math.min(14, d * 3);
        return (
          <g key={g.id}>
            {d >= TERMS.crowd.threshold && <circle cx={x} cy={y} r={r + 9} fill={toneOfDensity(d)} opacity=".25" className="pulse" />}
            <circle cx={x} cy={y} r={r} fill={toneOfDensity(d)} stroke={highlightGate === g.id ? "#1c2a5d" : "#fff"} strokeWidth={highlightGate === g.id ? 4 : 2.5} />
            <text x={x} y={y - 2} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">{g.name.replace("البوابة ", "ب")}</text>
            <text x={x} y={y + 12} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" style={{ direction: "ltr" }}>{d.toFixed(2)}</text>
            {(hit || run > 0) && <text x={x} y={y + r + 16} textAnchor="middle" fill={hit ? "#b03a2e" : "#c08a12"} fontSize="11.5" fontWeight="700">{hit ? "✓ تحقق المؤشر" : `فوق العتبة ${run} د`}</text>}
          </g>
        );
      })}
      {/* مفتاح */}
      <g transform="translate(205,486)" fontSize="11" fill="#5d6475">
        <text x="470" y="4" textAnchor="end">الكثافة (شخص/م²):</text>
        {[["#1e7b4b", "< 2"], ["#cd9f36", "2–3"], ["#c08a12", "3–4"], ["#b03a2e", "≥ 4"]].map(([c, l], i) => (
          <g key={l} transform={`translate(${370 - i * 70},0)`}><circle cx="0" cy="0" r="6" fill={c} /><text x="-10" y="4" textAnchor="end" style={{ direction: "ltr" }}>{l}</text></g>
        ))}
      </g>
    </svg>
  );
}
