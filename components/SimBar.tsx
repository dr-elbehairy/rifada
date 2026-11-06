"use client";
import { EVENT, SCENARIOS, ScenarioId, fmtT } from "@/lib/config";
import { KEY_MOMENTS } from "@/lib/engine";
import { useSim } from "@/lib/store";

/** شريط التحكم بالمحاكاة: الساعة، التشغيل، السرعة، الانتقال للحظات المفتاحية، السيناريو */
export default function SimBar({ compact = false }: { compact?: boolean }) {
  const { t, playing, speed, scenario, play, pause, setSpeed, setT, setScenario, reset } = useSim();
  const moments = KEY_MOMENTS(scenario);
  return (
    <div className="no-print card px-4 py-3 bg-[#fbfaf6]">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] text-muted">ساعة الفعالية</span>
          <span className="num text-[26px] font-bold text-navy w-[86px] text-center">{fmtT(t)}</span>
        </div>
        <button onClick={() => (playing ? pause() : play())} className={`px-4 py-2 rounded-lg text-white text-[13.5px] font-semibold ${playing ? "bg-goldd" : "bg-navy"}`}>{playing ? "إيقاف مؤقت" : "تشغيل المحاكاة"}</button>
        <button onClick={reset} className="px-3 py-2 rounded-lg border border-line text-[13px]">إعادة</button>
        <label className="flex items-center gap-2 text-[12.5px] text-muted">السرعة
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="border border-line rounded-md px-2 py-1 text-ink bg-white">
            <option value={1}>دقيقة/ثانية</option><option value={3}>3 دقائق/ثانية</option><option value={6}>6 دقائق/ثانية</option><option value={15}>15 دقيقة/ثانية</option><option value={30}>30 دقيقة/ثانية</option>
          </select>
        </label>
        {!compact && (
          <div className="flex items-center gap-1 rounded-lg border border-line p-0.5 bg-white">
            {(["A", "B"] as ScenarioId[]).map((s) => (
              <button key={s} onClick={() => setScenario(s)} title={SCENARIOS[s].desc} className={`px-3 py-1.5 rounded-md text-[12.5px] font-semibold ${scenario === s ? "bg-navy text-white" : "text-ink"}`}>{SCENARIOS[s].name.split(":")[0]}: {s === "A" ? "استجابة للإنذار" : "حادث مؤكد"}</button>
            ))}
          </div>
        )}
      </div>
      <input type="range" min={EVENT.simStart} max={EVENT.simEnd} step={1} value={Math.floor(t)} onChange={(e) => setT(Number(e.target.value))} className="w-full mt-2" dir="ltr" />
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {moments.map((m) => (
          <button key={m.label} onClick={() => { pause(); setT(m.t); }} className="text-[11.5px] px-2.5 py-1 rounded-full border border-line bg-white hover:bg-fill">
            <span className="num text-muted ml-1">{fmtT(m.t)}</span>{m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
