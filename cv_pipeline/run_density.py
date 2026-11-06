# -*- coding: utf-8 -*-
"""درع الحشود — خط تقدير كثافة الحشود (النموذج الأولي v2: استدلال مُجزّأ).

المشكلة: كاشف الأشخاص على الإطار كاملًا يفوّت الأشخاص الصغار في الحشود (تقليل عدّ حاد).
الحل في هذا الإصدار: تقسيم الإطار إلى بلاطات متداخلة بدقة عالية (على طريقة SAHI)، رصد الأشخاص
في كل بلاطة، ثم دمج النتائج بإزالة التكرار (NMS). بعدها:
  - يُسقَط موقع كل شخص (منتصف أسفل الصندوق = نقطة القدمين) على شبكة قطاعات.
  - مساحة كل قطاع بالمتر المربع تُعايَر لكل صف (المنظور: الصفوف البعيدة أكبر مساحةً).
  - الكثافة = عدد الأشخاص ÷ مساحة القطاع.
المخرجات:
  <out>/<name>.json  : سلسلة زمنية لكل قطاع + بيانات المعايرة + ملاحظات منهجية
  <out>/<name>/frame_XXX.jpg : إطارات موسومة (صناديق + شبكة ملوّنة بالعتبات + خريطة حرارية)
الاستخدام:
  python run_density.py --video data/shibuya_crossing.webm --name shibuya --fps 1 --out ../crowd-shield/public/cv \
      --row_areas 260,170,110 --tile 640 --overlap 0.25
حدود معلنة: في الحشود شديدة الكثافة (> 3 شخص/م²) يبقى الكاشف أقل من العدّ الحقيقي؛ النسخة التشغيلية
تضيف نموذج خريطة كثافة (CSRNet / DM-Count) بأوزان مدرّبة ومُدقّقة داخليًا، ويُستخدم الكاشف للمشاهد المتوسطة.
"""
import argparse, json, os, time
import cv2, numpy as np, torch, torchvision
from ultralytics import YOLO

ap = argparse.ArgumentParser()
ap.add_argument("--video", required=True); ap.add_argument("--name", required=True); ap.add_argument("--out", required=True)
ap.add_argument("--fps", type=float, default=1.0); ap.add_argument("--start", type=float, default=0.0, help="ثانية البداية")
ap.add_argument("--grid", default="3x3"); ap.add_argument("--row_areas", default="200,140,90", help="مساحة القطاع (م²) لكل صف من الأعلى للأسفل")
ap.add_argument("--model", default="yolov8s.pt"); ap.add_argument("--tile", type=int, default=320, help="حجم البلاطة بالبكسل الأصلي")
ap.add_argument("--infer", type=int, default=640, help="دقة الاستدلال (تكبير البلاطة)"); ap.add_argument("--overlap", type=float, default=0.25)
ap.add_argument("--device", default="mps" if torch.backends.mps.is_available() else "cpu")
ap.add_argument("--conf", type=float, default=0.22); ap.add_argument("--max_frames", type=int, default=60); ap.add_argument("--width", type=int, default=960)
a = ap.parse_args()

rows, cols = [int(x) for x in a.grid.lower().split("x")]
ROW_AREA = [float(x) for x in a.row_areas.split(",")]; assert len(ROW_AREA) == rows
os.makedirs(os.path.join(a.out, a.name), exist_ok=True)
model = YOLO(a.model)
cap = cv2.VideoCapture(a.video)
vfps = cap.get(cv2.CAP_PROP_FPS) or 25; W = int(cap.get(3)); H = int(cap.get(4))
cap.set(cv2.CAP_PROP_POS_FRAMES, int(a.start * vfps))
step = max(1, int(round(vfps / a.fps)))


def tiles(w, h, t, ov):
    s = int(t * (1 - ov)); xs = list(range(0, max(1, w - t), s)) + [max(0, w - t)]; ys = list(range(0, max(1, h - t), s)) + [max(0, h - t)]
    return [(x, y) for y in sorted(set(ys)) for x in sorted(set(xs))]


def detect(frame):
    """رصد مُجزّأ + الإطار كاملًا، ثم NMS للدمج."""
    B, S = [], []
    crops = [(x, y, frame[y:y + a.tile, x:x + a.tile]) for x, y in tiles(W, H, a.tile, a.overlap)]
    res = []
    for i in range(0, len(crops), 16):
        res += model.predict([c for _, _, c in crops[i:i + 16]], imgsz=a.infer, conf=a.conf, classes=[0], verbose=False, device=a.device)
    for (x, y, _), r in zip(crops, res):
        if r.boxes is None or not len(r.boxes): continue
        b = r.boxes.xyxy.cpu().numpy(); b[:, [0, 2]] += x; b[:, [1, 3]] += y; B.append(b); S.append(r.boxes.conf.cpu().numpy())
    full = model.predict(frame, imgsz=1280, conf=a.conf, classes=[0], verbose=False, device=a.device)[0]   # للأشخاص الكبار القريبين
    if full.boxes is not None and len(full.boxes): B.append(full.boxes.xyxy.cpu().numpy()); S.append(full.boxes.conf.cpu().numpy())
    if not B: return np.zeros((0, 4)), np.zeros((0,))
    B = np.concatenate(B); S = np.concatenate(S)
    keep = torchvision.ops.nms(torch.tensor(B, dtype=torch.float32), torch.tensor(S, dtype=torch.float32), 0.45).numpy()
    return B[keep], S[keep]


def color_for(d):
    if d >= 4: return (46, 58, 176)      # أحمر BGR
    if d >= 2.5: return (11, 134, 184)   # ذهبي
    return (75, 123, 30)                 # أخضر


series = []; fi = 0; k = 0; t0 = time.time()
while k < a.max_frames:
    ok, frame = cap.read()
    if not ok: break
    if fi % step: fi += 1; continue
    t = a.start + fi / vfps
    boxes, confs = detect(frame)
    pts = np.stack([(boxes[:, 0] + boxes[:, 2]) / 2, boxes[:, 3]], axis=1) if len(boxes) else np.zeros((0, 2))
    counts = np.zeros((rows, cols), dtype=int)
    for x, y in pts:
        c = min(cols - 1, int(x / W * cols)); r = min(rows - 1, int(y / H * rows)); counts[r, c] += 1
    sectors = [{"id": f"S{r * cols + c + 1}", "row": r, "col": c, "count": int(counts[r, c]), "area_m2": ROW_AREA[r],
                "density": round(counts[r, c] / ROW_AREA[r], 3)} for r in range(rows) for c in range(cols)]
    # ---- الرسم
    heat = np.zeros((H, W), dtype=np.float32)
    for x, y in pts: cv2.circle(heat, (int(x), int(y)), 2, 1.0, -1)
    heat = cv2.GaussianBlur(heat, (0, 0), 38)
    if heat.max() > 0: heat = heat / heat.max()
    hm = cv2.applyColorMap((heat * 255).astype(np.uint8), cv2.COLORMAP_TURBO)
    mask = (heat > 0.18)[..., None]
    vis = np.where(mask, cv2.addWeighted(frame, 0.7, hm, 0.3, 0), frame)
    for (x1, y1, x2, y2) in boxes: cv2.rectangle(vis, (int(x1), int(y1)), (int(x2), int(y2)), (255, 255, 255), 1)
    for s in sectors:
        r, c = s["row"], s["col"]; x1, y1, x2, y2 = int(c * W / cols), int(r * H / rows), int((c + 1) * W / cols), int((r + 1) * H / rows)
        col = color_for(s["density"]); cv2.rectangle(vis, (x1 + 2, y1 + 2), (x2 - 2, y2 - 2), col, 4)
        label = f"{s['id']}  {s['count']}p  {s['density']:.2f}/m2"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.85, 2)
        cv2.rectangle(vis, (x1 + 8, y1 + 8), (x1 + 22 + tw, y1 + 22 + th), col, -1)
        cv2.putText(vis, label, (x1 + 15, y1 + 15 + th), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2, cv2.LINE_AA)
    total = int(len(pts)); dmax = max(s["density"] for s in sectors)
    bar = f"CROWD SHIELD CV  |  t={t:5.1f}s  |  persons={total}  |  max density={dmax:.2f} p/m2  |  {os.path.basename(a.model)[:-3]} tiled {a.tile}->{a.infer}px + NMS"
    cv2.rectangle(vis, (0, H - 46), (W, H), (35, 28, 18), -1)
    cv2.putText(vis, bar, (16, H - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.imwrite(os.path.join(a.out, a.name, f"frame_{k:03d}.jpg"), cv2.resize(vis, (a.width, int(H * a.width / W))), [cv2.IMWRITE_JPEG_QUALITY, 74])
    series.append({"i": k, "t": round(t, 2), "total": total, "max_density": dmax, "sectors": sectors})
    k += 1; fi += 1
cap.release()
tot = [s["total"] for s in series]
meta = {"name": a.name, "source": os.path.basename(a.video), "model": f"{os.path.basename(a.model)} (ultralytics) — person class", "method": f"tiled inference {a.tile}px upscaled to {a.infer}px, overlap {a.overlap}, + full frame 1280px, NMS 0.45",
        "conf": a.conf, "grid": a.grid, "row_areas_m2": ROW_AREA, "video_fps": vfps, "analysis_fps": a.fps, "frames": len(series),
        "persons_mean": round(float(np.mean(tot)), 1), "persons_max": int(max(tot)), "max_density": max(s["max_density"] for s in series),
        "runtime_s_per_frame": round((time.time() - t0) / max(1, len(series)), 2),
        "limitations": "كاشف الأشخاص يقلّل العدّ في الحشود شديدة الكثافة؛ القراءة اتجاهية لتجاوز العتبات. النسخة التشغيلية: نموذج خريطة كثافة بأوزان مُدقّقة + معايرة هندسية لكل كاميرا (homography)."}
json.dump({"meta": meta, "series": series}, open(os.path.join(a.out, a.name + ".json"), "w", encoding="utf8"), ensure_ascii=False)
print(json.dumps({k_: meta[k_] for k_ in ("name", "frames", "persons_mean", "persons_max", "max_density", "runtime_s_per_frame")}, ensure_ascii=False))
