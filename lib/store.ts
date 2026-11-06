"use client";
// حالة المحاكاة المشتركة بين الصفحات: الساعة، السيناريو، وثيقة المستخدم.
import { create } from "zustand";
import { EVENT, GateId, ScenarioId, TERMS, ZoneId } from "./config";

export interface MyPolicy { id: string; holder: string; zone: ZoneId; gate: GateId; seat: string; premium: number; ticket: number; issuedAt: string }

interface SimState {
  t: number; playing: boolean; speed: number; scenario: ScenarioId; myPolicy: MyPolicy | null; hydrated: boolean;
  setT: (t: number) => void; play: () => void; pause: () => void; setSpeed: (s: number) => void; setScenario: (s: ScenarioId) => void;
  buy: (p: Omit<MyPolicy, "id" | "issuedAt" | "premium">) => MyPolicy; clearPolicy: () => void; reset: () => void; hydrate: () => void;
}

const KEY = "crowd-shield-demo-v1";
const save = (s: Partial<SimState>) => { try { sessionStorage.setItem(KEY, JSON.stringify({ scenario: s.scenario, myPolicy: s.myPolicy, t: s.t })); } catch { /* تخزين غير متاح */ } };

export const useSim = create<SimState>((set, get) => ({
  t: EVENT.simStart, playing: false, speed: 6, scenario: "A", myPolicy: null, hydrated: false,
  setT: (t) => { const v = Math.max(EVENT.simStart, Math.min(EVENT.simEnd, t)); set({ t: v }); save({ ...get(), t: v }); },
  play: () => set({ playing: true }), pause: () => { set({ playing: false }); save(get()); }, setSpeed: (speed) => set({ speed }),
  setScenario: (scenario) => { set({ scenario }); save({ ...get(), scenario }); },
  buy: (p) => {
    const rnd = Math.floor(Math.random() * 90000) + 10000;
    const pol: MyPolicy = { ...p, id: `CS-2027-${rnd}`, premium: TERMS.premium, issuedAt: new Date().toISOString() };
    set({ myPolicy: pol }); save({ ...get(), myPolicy: pol }); return pol;
  },
  clearPolicy: () => { set({ myPolicy: null }); save({ ...get(), myPolicy: null }); },
  reset: () => { set({ t: EVENT.simStart, playing: false }); save({ ...get(), t: EVENT.simStart }); },
  hydrate: () => {
    if (get().hydrated) return;
    try { const raw = sessionStorage.getItem(KEY); if (raw) { const v = JSON.parse(raw); set({ scenario: v.scenario ?? "A", myPolicy: v.myPolicy ?? null, t: v.t ?? EVENT.simStart }); } } catch { /* تجاهل */ }
    set({ hydrated: true });
  },
}));
