"use client";
import { useEffect, useState } from "react";
import { asset } from "@/lib/base";

export interface CVSector { id: string; count: number; density: number; area_m2: number }
export interface CVFrame { i: number; t: number; total: number; max_density: number; sectors: CVSector[] }
export interface CVData { meta: Record<string, unknown>; series: CVFrame[] }

export function useCV(name: string) {
  const [data, setData] = useState<CVData | null>(null);
  useEffect(() => { fetch(asset(`/cv/${name}.json`)).then((r) => r.json()).then(setData).catch(() => setData(null)); }, [name]);
  return data;
}

/** تغذية كاميرا: تعرض إطارات خرجت فعلًا من خط الرؤية الحاسوبية (YOLOv8 + استدلال مُجزّأ) على فيديو مرخّص */
export default function CameraFeed({ name = "gate_cam", fps = 4, label = "كاميرا ممر البوابة 7", playing = true, onFrame }: { name?: string; fps?: number; label?: string; playing?: boolean; onFrame?: (f: CVFrame) => void }) {
  const data = useCV(name);
  const [i, setI] = useState(0);
  const n = data?.series.length ?? 0;
  useEffect(() => {
    if (!n || !playing) return;
    const id = setInterval(() => setI((x) => (x + 1) % n), 1000 / fps);
    return () => clearInterval(id);
  }, [n, fps, playing]);
  useEffect(() => { if (data && onFrame) onFrame(data.series[i]); }, [i, data, onFrame]);
  useEffect(() => { if (!data) return; data.series.forEach((f) => { const im = new Image(); im.src = asset(`/cv/${name}/frame_${String(f.i).padStart(3, "0")}.jpg`); }); }, [data, name]);
  const f = data?.series[i];
  return (
    <div className="relative rounded-xl overflow-hidden bg-[#0d1020] aspect-video">
      {f && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset(`/cv/${name}/frame_${String(f.i).padStart(3, "0")}.jpg`)} alt="إطار من تغذية الكاميرا بعد تحليل الرؤية الحاسوبية" className="w-full h-full object-cover" />
      )}
      <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/60 text-white text-[11.5px] px-2.5 py-1 rounded-md">
        <span className="w-2 h-2 rounded-full bg-[#e0453a] pulse" /> {label}
      </div>
      {f && (
        <div className="absolute bottom-2 left-2 bg-black/65 text-white text-[11.5px] px-2.5 py-1 rounded-md num">
          {f.total} persons · max {f.max_density.toFixed(2)} p/m²
        </div>
      )}
      {!data && <div className="absolute inset-0 grid place-items-center text-white/70 text-[13px]">جارٍ تحميل التغذية…</div>}
    </div>
  );
}
