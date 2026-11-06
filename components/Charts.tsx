"use client";
import { CartesianGrid, Legend, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Cell } from "recharts";
import { EVENT, ScenarioId, TERMS, fmtT } from "@/lib/config";
import { getScenario } from "@/lib/scenario";

const ticks = Array.from({ length: 10 }, (_, k) => 15 * 60 + k * 60).filter((x) => x <= EVENT.simEnd);

export function HeatChart({ sc, t, h = 230 }: { sc: ScenarioId; t: number; h?: number }) {
  const S = getScenario(sc);
  const data = S.minutes.filter((m) => m.t <= t && m.t % 2 === 0).map((m) => ({ t: m.t, fz: +m.zone.FZ.hi.toFixed(2), ncm: +m.ncm.hi.toFixed(2), st: +m.zone.E.hi.toFixed(2) }));
  return (
    <div dir="ltr" style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="#eee" vertical={false} />
          <XAxis dataKey="t" type="number" domain={[EVENT.simStart, EVENT.simEnd]} ticks={ticks} tickFormatter={fmtT} fontSize={11} />
          <YAxis domain={[26, 50]} ticks={[26, 30, 35, 40, 45, 50]} fontSize={11} unit="°" />
          <ReferenceArea x1={EVENT.fanZoneOpen} x2={EVENT.fanZoneClose} fill="#cd9f36" fillOpacity={0.07} />
          <ReferenceLine y={TERMS.heat.threshold} stroke="#b03a2e" strokeDasharray="5 4" label={{ value: "العتبة 45°", position: "insideBottomRight", fontSize: 11, fill: "#b03a2e" }} />
          <ReferenceLine x={t} stroke="#1c2a5d" strokeWidth={1.5} />
          <Tooltip labelFormatter={(v) => fmtT(Number(v))} formatter={(v) => `${Number(v).toFixed(1)}°`} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line dataKey="fz" name="حساس ساحة المشجعين" stroke="#b03a2e" dot={false} strokeWidth={2.4} isAnimationActive={false} />
          <Line dataKey="ncm" name="المركز الوطني للأرصاد" stroke="#1c2a5d" dot={false} strokeWidth={2} isAnimationActive={false} />
          <Line dataKey="st" name="مدرج مُبرَّد" stroke="#007a88" dot={false} strokeWidth={1.6} strokeDasharray="4 3" isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DensityChart({ sc, t, h = 230 }: { sc: ScenarioId; t: number; h?: number }) {
  const S = getScenario(sc);
  const from = 19 * 60 + 30;
  const data = S.minutes.filter((m) => m.t <= t && m.t >= from).map((m) => ({ t: m.t, G1: +m.gate.G1.toFixed(2), G3: +m.gate.G3.toFixed(2), G5: +m.gate.G5.toFixed(2), G7: +m.gate.G7.toFixed(2) }));
  const tk = [1170, 1200, 1230, 1260, 1290, 1320, 1350, 1380, 1410];
  return (
    <div dir="ltr" style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="#eee" vertical={false} />
          <XAxis dataKey="t" type="number" domain={[from, EVENT.simEnd]} ticks={tk} tickFormatter={fmtT} fontSize={11} />
          <YAxis domain={[0, 5.5]} fontSize={11} />
          <ReferenceLine y={TERMS.crowd.threshold} stroke="#b03a2e" strokeDasharray="5 4" label={{ value: "عتبة 4 شخص/م²", position: "insideTopLeft", fontSize: 11, fill: "#b03a2e" }} />
          <ReferenceLine y={TERMS.crowd.warn} stroke="#c08a12" strokeDasharray="2 4" />
          <ReferenceLine x={EVENT.finalWhistle} stroke="#999" strokeDasharray="3 3" label={{ value: "صافرة النهاية", position: "insideTopLeft", fontSize: 10, fill: "#777" }} />
          {t >= from && <ReferenceLine x={t} stroke="#1c2a5d" strokeWidth={1.5} />}
          <Tooltip labelFormatter={(v) => fmtT(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line dataKey="G7" name="البوابة 7" stroke="#b03a2e" dot={false} strokeWidth={2.6} isAnimationActive={false} />
          <Line dataKey="G1" name="البوابة 1" stroke="#1c2a5d" dot={false} strokeWidth={1.6} isAnimationActive={false} />
          <Line dataKey="G3" name="البوابة 3" stroke="#007a88" dot={false} strokeWidth={1.6} isAnimationActive={false} />
          <Line dataKey="G5" name="البوابة 5" stroke="#cd9f36" dot={false} strokeWidth={1.6} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      {t < from && <div className="text-center text-[12px] text-[#777] -mt-[130px] mb-[110px]">يظهر المنحنى من 19:30 (ذروة الدخول ثم الخروج)</div>}
    </div>
  );
}

export function SimpleBars({ data, h = 220, color = "#1c2a5d", unit = "", highlight }: { data: { label: string; value: number }[]; h?: number; color?: string; unit?: string; highlight?: (d: { label: string; value: number }) => boolean }) {
  return (
    <div dir="ltr" style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#eee" vertical={false} />
          <XAxis dataKey="label" fontSize={11} interval={0} />
          <YAxis fontSize={11} unit={unit} />
          <Tooltip formatter={(v) => `${Number(v).toFixed(1)}${unit}`} />
          <Bar dataKey="value" isAnimationActive={false} radius={[4, 4, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={highlight?.(d) ? "#b03a2e" : color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
