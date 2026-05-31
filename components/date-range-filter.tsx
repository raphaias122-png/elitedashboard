"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

const presets = ["Hoje", "Ontem", "Últimos 7 dias", "Semana atual", "Mês atual", "Últimos 30 dias", "Personalizado"] as const;
export type DatePreset = (typeof presets)[number];
export type DateRange = { preset: DatePreset; start?: string; end?: string };

export function DateRangeFilter({ onChange }: { onChange?: (range: DateRange) => void }) {
  const [range, setRange] = useState<DateRange>({ preset: "Últimos 30 dias" });
  useEffect(() => {
    const saved = localStorage.getItem("elite-date-range");
    if (saved) setRange(JSON.parse(saved));
  }, []);
  function update(next: DateRange) {
    setRange(next);
    localStorage.setItem("elite-date-range", JSON.stringify(next));
    onChange?.(next);
  }
  return <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-3">
    <span className="mr-1 flex items-center gap-2 text-xs font-bold text-amber-300"><CalendarDays size={15}/> Período global</span>
    {presets.map(preset => <button key={preset} onClick={() => update({ ...range, preset })} className={`rounded-full border px-3 py-2 text-[10px] font-bold ${range.preset === preset ? "border-amber-400/40 bg-amber-400/15 text-amber-200" : "border-white/10 bg-white/[.03] text-slate-400"}`}>{preset}</button>)}
    {range.preset === "Personalizado" && <div className="flex gap-2">
      <input type="date" value={range.start || ""} onChange={e => update({ ...range, start: e.target.value })} className="rounded-lg border border-white/10 bg-white/[.04] px-2 py-1 text-xs"/>
      <input type="date" value={range.end || ""} onChange={e => update({ ...range, end: e.target.value })} className="rounded-lg border border-white/10 bg-white/[.04] px-2 py-1 text-xs"/>
    </div>}
  </div>;
}
