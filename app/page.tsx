"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  Columns3,
  CircleDollarSign,
  Download,
  FileText,
  Filter,
  Gauge,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Copy,
  ExternalLink,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { DateRangeFilter } from "../components/date-range-filter";
import { createRow, deleteRow, exportRepositoryBackup, getSetting, linkSpyAndCreativeDataToCurrentUser, listRows, setSetting, updateRow, type Row } from "../lib/repository";
import { createClient as createSupabaseClient } from "../lib/supabase";

const nav = [
  ["Visão Geral", LayoutDashboard],
  ["Financeiro", CircleDollarSign],
  ["Campanhas", BriefcaseBusiness],
  ["Criativos", Image],
  ["SPY", Target],
  ["Páginas", FileText],
  ["Workspace", Columns3],
  ["Relatórios", FileText],
  ["Integrações", Settings],
] as const;

type SpyRow = Row & {
  name?: string;
  brand?: string;
  platform?: string;
  country?: string;
  niche?: string;
  angle?: string;
  description?: string;
  potential_score?: number | string;
  status?: string;
  tags?: string[];
};
type SpySource = Row & {
  name?: string;
  source_url?: string;
  source_type?: string;
  status?: string;
};
type Tone = "gold" | "green" | "orange" | "blue" | "pink";
type OverviewMetrics = {
  budget: number;
  revenue: number;
  spend: number;
  profit: number;
  roi: number;
  ftds: number;
  leads: number;
  registrations: number;
};
type FinanceRecord = Row & {
  record_date?: string;
  ads_total?: number | string;
  opened_link?: number | string;
  registrations?: number | string;
  ftd?: number | string;
  deposits?: number | string;
  withdrawals?: number | string;
  gross_revenue?: number | string;
  tools_cost?: number | string;
  total_commission?: number | string;
  notes?: string;
};
type FinanceForm = {
  record_date: string;
  ads_total: string;
  opened_link: string;
  registrations: string;
  ftd: string;
  deposits: string;
  withdrawals: string;
  gross_revenue: string;
  tools_cost: string;
  total_commission: string;
  notes: string;
};
type FinanceSummary = {
  adsTotal: number;
  openedLink: number;
  registrations: number;
  ftd: number;
  deposits: number;
  withdrawals: number;
  netDeposit: number;
  grossRevenue: number;
  toolsCost: number;
  totalCommission: number;
  netProfit: number;
  roi: number;
  costFtd: number;
};
type CampaignRecord = Row & {
  name?: string;
  platform?: string;
  country?: string;
  campaign_type?: string;
  objective?: string;
  daily_budget?: number | string;
  total_budget?: number | string;
  spent_amount?: number | string;
  status?: string;
  creative_ids?: string[];
  page_id?: string;
  offer_id?: string;
  pixel_id?: string;
  notes?: string;
};
type CampaignForm = {
  name: string;
  platform: string;
  country: string;
  campaign_type: string;
  objective: string;
  daily_budget: string;
  total_budget: string;
  spent_amount: string;
  status: string;
  creative_ids: string[];
  page_id: string;
  offer_id: string;
  pixel_id: string;
  notes: string;
};
type DailyMetric = Row & {
  campaign_id?: string;
  metric_date?: string;
  impressions?: number | string;
  clicks?: number | string;
  spend?: number | string;
  leads?: number | string;
  registrations?: number | string;
  ftds?: number | string;
  revenue?: number | string;
  ctr?: number | string;
  cpc?: number | string;
  cpm?: number | string;
  cpa?: number | string;
  profit?: number | string;
  roi?: number | string;
};
type PageRecord = Row & {
  name?: string;
  preview_url?: string;
  download_url?: string;
};
type PageForm = {
  name: string;
  preview_url: string;
  download_url: string;
};
type WorkspaceCard = Row & {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
};
type WorkspaceForm = {
  title: string;
  description: string;
  priority: string;
  status: string;
};
type IntegrationRecord = Row & {
  provider?: string;
  name?: string;
  access_token_encrypted?: string;
  business_manager_id?: string;
  ad_account_id?: string;
  pixel_id?: string;
  api_url?: string;
  affiliate_id?: string;
  subid_param?: string;
  status?: string;
  last_sync_at?: string;
  notes?: string;
};
type IntegrationForm = {
  name: string;
  access_token_encrypted: string;
  business_manager_id: string;
  ad_account_id: string;
  pixel_id: string;
  api_url: string;
  affiliate_id: string;
  subid_param: string;
  status: string;
};

const emptyOverviewMetrics: OverviewMetrics = {
  budget: 0,
  revenue: 0,
  spend: 0,
  profit: 0,
  roi: 0,
  ftds: 0,
  leads: 0,
  registrations: 0,
};

function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3})/g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function sumRows(rows: Row[], field: string) {
  return rows.reduce((total, row) => total + toNumber(row[field]), 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value)}%`;
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoInput(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function safeDivide(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function labelById(rows: Row[], id?: unknown, fallback = "-") {
  const match = rows.find((row) => row.id === id);
  return String(match?.name || match?.file_name || match?.title || fallback);
}

function maskToken(token?: unknown) {
  const value = String(token || "");
  return value ? `•••• ${value.slice(-4)}` : "-";
}

const integrationMappings = {
  metaAdsToCampaigns: ["campaign_id", "campaign_name", "status", "spend", "impressions", "clicks", "ctr", "cpc", "cpm"],
  affiliateToFinance: ["date", "registrations", "ftd", "deposits", "withdrawals", "gross_revenue", "commission_total", "subid", "campaign_id"],
} as const;

function Badge({ children, tone = "gold" }: { children: React.ReactNode; tone?: Tone }) {
  const tones: Record<Tone, string> = {
    gold: "bg-amber-400/15 text-amber-200",
    green: "bg-emerald-500/15 text-emerald-300",
    orange: "bg-orange-500/15 text-orange-300",
    blue: "bg-cyan-500/15 text-cyan-300",
    pink: "bg-pink-500/15 text-pink-300",
  };

  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${tones[tone]}`}>{children}</span>;
}

function Btn({ children, secondary = false, onClick, type = "button" }: { children: React.ReactNode; secondary?: boolean; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
        secondary
          ? "border border-white/10 bg-white/[.05] text-slate-300 hover:border-amber-300/40 hover:text-amber-100"
          : "bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 shadow-lg shadow-amber-950/30 hover:-translate-y-0.5"
      }`}
    >
      {children}
    </button>
  );
}
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass rounded-2xl ${className}`}>{children}</div>;
}

export default function Home() {
  const router = useRouter();
  const [active, setActive] = useState("Visão Geral");
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [spy, setSpy] = useState<SpyRow[]>([]);
  const [spySources, setSpySources] = useState<SpySource[]>([]);
  const [spyForm, setSpyForm] = useState({ brand: "", ad_url: "", angle: "", notes: "" });
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [linkingData, setLinkingData] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      router.replace("/login");
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
      else setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const visibleSpy = useMemo(
    () => spy.filter((item) => `${item.name || item.brand || ""}${item.platform || ""}${item.niche || ""}${item.description || item.angle || ""}`.toLowerCase().includes(search.toLowerCase())),
    [spy, search],
  );

  useEffect(() => {
    Promise.all([listRows("spy_items"), listRows("spy_sources")])
      .then(([items, sources]) => {
        setSpy(items as SpyRow[]);
        setSpySources(sources as SpySource[]);
      })
      .catch(() => {
        setSpy([]);
        setSpySources([]);
      });
  }, []);

  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2200);
  };

  const exportCsv = async () => {
    const campaigns = await listRows("campaigns");
    const rows = [["Campanha", "Plataforma", "Pais", "Status"], ...campaigns.map((campaign) => [campaign.name, campaign.platform, campaign.country, campaign.status])];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([rows.map((row) => row.join(";")).join("\n")], { type: "text/csv" }));
    link.download = "relatorio-elite.csv";
    link.click();
    notify("Relatório exportado com sucesso");
  };

  const addSpy = async () => {
    await createRow("spy_items", { category: "Outros", name: spyForm.brand, main_url: spyForm.ad_url, description: spyForm.angle, notes: spyForm.notes, status: "novo", tags: [] });
    setSpy((await listRows("spy_items")) as SpyRow[]);
    setSpyForm({ brand: "", ad_url: "", angle: "", notes: "" });
    setModal(false);
    notify("Anúncio adicionado ao radar");
  };

  const removeSpy = async (id?: string) => {
    if (!id) return;
    await deleteRow("spy_items", id);
    setSpy((await listRows("spy_items")) as SpyRow[]);
    notify("Anúncio removido");
  };
  const logout = async () => {
    const supabase = createSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    router.replace("/login");
  };
  const linkData = async () => {
    setLinkingData(true);
    try {
      await linkSpyAndCreativeDataToCurrentUser();
      window.location.reload();
    } catch {
      notify("Não foi possível vincular os dados. Confirme o perfil de administrador.");
      setLinkingData(false);
    }
  };

  if (!authReady) {
    return <main className="noise grid min-h-screen place-items-center bg-[#070a16] text-xs text-slate-400">Verificando acesso...</main>;
  }

  return (
    <main className="noise min-h-screen bg-[#070a16] text-slate-100">
      {toast && (
        <div className="fixed right-5 top-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/15 px-4 py-3 text-xs font-semibold text-emerald-200 backdrop-blur-xl">
          <ShieldCheck size={16} />
          {toast}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Novo anúncio spy</h3>
              <button onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="mt-5 grid gap-3">
              <input value={spyForm.brand} onChange={(event) => setSpyForm({ ...spyForm, brand: event.target.value })} placeholder="Marca ou cassino" className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none focus:border-amber-400" />
              <input value={spyForm.ad_url} onChange={(event) => setSpyForm({ ...spyForm, ad_url: event.target.value })} placeholder="Link do anúncio" className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none focus:border-amber-400" />
              <input value={spyForm.angle} onChange={(event) => setSpyForm({ ...spyForm, angle: event.target.value })} placeholder="Ângulo principal" className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none focus:border-amber-400" />
              <input value={spyForm.notes} onChange={(event) => setSpyForm({ ...spyForm, notes: event.target.value })} placeholder="Ideia de adaptação" className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none focus:border-amber-400" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Btn secondary onClick={() => setModal(false)}>Cancelar</Btn>
              <Btn onClick={addSpy}><Plus size={15} />Adicionar ao radar</Btn>
            </div>
          </Card>
        </div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-[244px] border-r border-white/[.07] bg-[#0c1023]/95 px-3 py-5 backdrop-blur-xl transition-transform lg:translate-x-0 ${mobile ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 px-3">
          <img src="/elite-dashboard-logo.png" alt="Elite Dashboard" className="h-12 w-12 rounded-xl border border-amber-400/40 object-cover shadow-lg shadow-amber-950/30" />
          <div>
            <b className="text-lg">ELITE</b>
            <p className="text-[9px] font-bold tracking-[.25em] text-amber-400">DASHBOARD</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMobile(false)}><X size={17} /></button>
        </div>

        <p className="mb-3 mt-9 px-3 text-[9px] font-bold tracking-[.18em] text-slate-600">MENU PRINCIPAL</p>
        <nav className="space-y-1">
          {nav.map(([item, Icon]) => (
            <button
              key={item}
              onClick={() => {
                setActive(item);
                setMobile(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                active === item
                  ? "bg-gradient-to-r from-amber-500/30 to-violet-600/10 text-white"
                  : "text-slate-500 hover:bg-white/[.04] hover:text-slate-200"
              }`}
            >
              <Icon size={16} />
              {item}
              {item === "SPY" && <span className="ml-auto rounded-full bg-pink-500 px-1.5 text-[9px] text-white">DOC</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-3 right-3">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-violet-600 text-xs font-bold text-slate-950">RM</div>
              <div>
                <p className="text-xs font-bold">Rafael Martins</p>
                <p className="text-[10px] text-slate-500">Administrador</p>
              </div>
              <MoreHorizontal className="ml-auto text-slate-500" size={15} />
            </div>
            <button onClick={logout} className="mt-3 flex w-full items-center gap-2 rounded-xl bg-white/[.05] px-3 py-2 text-xs font-bold text-slate-400 transition hover:text-amber-200">
              <LogOut size={14} />Sair
            </button>
            <button onClick={linkData} className="mt-2 flex w-full items-center gap-2 rounded-xl bg-white/[.05] px-3 py-2 text-left text-xs font-bold text-slate-400 transition hover:text-amber-200">
              <ShieldCheck size={14} />{linkingData ? "Vinculando..." : "Vincular dados ao meu usuário"}
            </button>
          </Card>
        </div>
      </aside>

      <section className="min-h-screen lg:ml-[244px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-white/[.07] bg-[#070a16]/80 px-4 backdrop-blur-xl md:px-7">
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-white/[.07] bg-white/[.03] text-slate-300 lg:hidden" onClick={() => setMobile(true)}>
            <Menu size={20} />
          </button>
          <div>
            <p className="text-[11px] text-slate-500">Domingo, 31 de maio de 2026</p>
            <h1 className="text-lg font-bold">{active}</h1>
          </div>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <button className="grid h-10 w-10 place-items-center rounded-xl border border-white/[.07] bg-white/[.03] text-slate-400"><Bell size={16} /></button>
            <button className="grid h-10 w-10 place-items-center rounded-xl border border-white/[.07] bg-white/[.03] text-slate-400"><Settings size={16} /></button>
          </div>
        </header>

        <div className="p-4 md:p-7">
          {active === "Visão Geral" ? (
            <Overview exportCsv={exportCsv} />
          ) : active === "Financeiro" ? (
            <Financeiro />
          ) : active === "Campanhas" ? (
            <Campanhas />
          ) : active === "Criativos" ? (
            <Creatives />
          ) : active === "SPY" ? (
            <Spy rows={visibleSpy} sources={spySources} search={search} setSearch={setSearch} add={() => setModal(true)} remove={removeSpy} notify={notify} />
          ) : active === "Páginas" ? (
            <Paginas />
          ) : active === "Workspace" ? (
            <Workspace />
          ) : active === "Relatórios" ? (
            <Relatorios />
          ) : active === "Integrações" ? (
            <Integracoes />
          ) : (
            <Overview exportCsv={exportCsv} />
          )}
        </div>
      </section>
    </main>
  );
}

function Overview({ exportCsv }: { exportCsv: () => void }) {
  const [metrics, setMetrics] = useState<OverviewMetrics>(emptyOverviewMetrics);
  const [ftdGoal, setFtdGoal] = useState(50);
  const [financialRecords, setFinancialRecords] = useState<FinanceRecord[]>([]);
  const [dailyMetricRows, setDailyMetricRows] = useState<DailyMetric[]>([]);
  const [campaignRows, setCampaignRows] = useState<CampaignRecord[]>([]);

  useEffect(() => {
    setFtdGoal(Number(getSetting("meta_ftd", "50")));
    let isMounted = true;

    async function loadOverview() {
      const [budgets, financialRows, dailyMetrics, campaigns] = await Promise.all([
        listRows("operation_budgets"),
        listRows("financial_records"),
        listRows("daily_metrics"),
        listRows("campaigns"),
      ]);

      const budget = sumRows(budgets, "amount");
      const revenue = sumRows(financialRows, "revenue") + sumRows(dailyMetrics, "revenue");
      const spend = sumRows(financialRows, "spend") + sumRows(dailyMetrics, "spend");
      const profit = revenue - spend;
      const roi = spend > 0 ? (profit / spend) * 100 : 0;

      if (isMounted) {
        setMetrics({
          budget,
          revenue,
          spend,
          profit,
          roi,
          ftds: sumRows(financialRows, "ftd"),
          leads: sumRows(dailyMetrics, "leads"),
          registrations: sumRows(dailyMetrics, "registrations"),
        });
        setFinancialRecords(financialRows as FinanceRecord[]);
        setDailyMetricRows(dailyMetrics as DailyMetric[]);
        setCampaignRows(campaigns as CampaignRecord[]);
      }
    }

    loadOverview().catch(() => {
      if (isMounted) setMetrics(emptyOverviewMetrics);
    });

    return () => {
      isMounted = false;
    };
  }, []);
  const exportBackup = async () => {
    const backup = await exportRepositoryBackup();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    link.download = `backup-elite-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const changeFtdGoal = (goal: number) => {
    setFtdGoal(goal);
    setSetting("meta_ftd", String(goal));
  };
  const missingFtds = Math.max(0, ftdGoal - metrics.ftds);
  const ftdProgress = Math.min(100, safeDivide(metrics.ftds, ftdGoal) * 100);
  const chartData = financialRecords.map((record) => {
    const receita = toNumber(record.gross_revenue ?? record.revenue);
    const gasto = toNumber(record.ads_total ?? record.spend);
    return { day: String(record.record_date || "-"), receita, gasto, lucro: receita - gasto - toNumber(record.tools_cost) };
  });
  const countries = Array.from(financialRecords.reduce((map, record) => {
    const country = String(record.country || "Sem país");
    map.set(country, (map.get(country) || 0) + toNumber(record.gross_revenue ?? record.revenue));
    return map;
  }, new Map<string, number>())).map(([name, revenue], index, rows) => ({
    name,
    value: formatCurrency(revenue),
    pct: safeDivide(revenue, Math.max(...rows.map(([, value]) => value), 0)) * 100,
    color: ["#d5a42b", "#22d3ee", "#34d399", "#f97316"][index % 4],
  }));
  const stats: [string, string, string, LucideIcon, string][] = [
    ["Receita total", formatCurrency(metrics.revenue), "repository", CircleDollarSign, "from-amber-500 to-yellow-400"],
    ["Gastos totais", formatCurrency(metrics.spend), "repository", TrendingUp, "from-cyan-500 to-blue-600"],
    ["Lucro liquido", formatCurrency(metrics.profit), "repository", Sparkles, "from-emerald-500 to-teal-600"],
    ["ROI medio", formatPercent(metrics.roi), "repository", Gauge, "from-orange-500 to-pink-600"],
  ];
  const micro = [
    ["Budget", formatCurrency(metrics.budget)],
    ["Leads totais", new Intl.NumberFormat("pt-BR").format(metrics.leads)],
    ["Cadastros", new Intl.NumberFormat("pt-BR").format(metrics.registrations)],
    ["FTDs", new Intl.NumberFormat("pt-BR").format(metrics.ftds)],
    ["Lead -> FTD", metrics.leads > 0 ? formatPercent((metrics.ftds / metrics.leads) * 100) : "0%"],
  ];

  return (
    <div className="rise space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Bom dia, Rafael <span className="text-amber-300">✦</span></h2>
          <p className="mt-1 text-xs text-slate-500">Acompanhe sua operação com leitura rápida de receita, gasto, lucro e ROI.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn secondary onClick={exportBackup}><Download size={15} />Exportar Backup</Btn>
          <Btn secondary onClick={exportCsv}><Download size={15} />Exportar CSV</Btn>
          <Btn><Plus size={15} />Novo registro</Btn>
        </div>
      </div>

      <DateRangeFilter />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, delta, Icon, color]) => (
          <Card key={label} className="overflow-hidden p-4 transition hover:-translate-y-0.5 hover:border-white/20">
            <div className="flex items-center justify-between">
              <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${color} text-slate-950`}><Icon size={18} /></div>
              <Badge tone="green">{delta}</Badge>
            </div>
            <p className="mt-5 text-[11px] text-slate-500">{label}</p>
            <b className="mt-1 block text-xl">{value}</b>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {micro.map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-[10px] text-slate-500">{label}</p>
            <b className="mt-1.5 block text-base">{value}</b>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold">Meta de FTD</h3>
            <p className="mt-1 text-[10px] text-slate-500">Acompanhamento automático com base nos dados financeiros existentes.</p>
          </div>
          <div className="flex gap-2">
            {[50, 100].map((goal) => (
              <button key={goal} onClick={() => changeFtdGoal(goal)} className={`rounded-full border px-3 py-2 text-[10px] font-bold ${ftdGoal === goal ? "border-amber-400/40 bg-amber-400/15 text-amber-200" : "border-white/10 bg-white/[.03] text-slate-400"}`}>
                Meta {goal} FTD
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[["FTD atual", metrics.ftds], ["Meta escolhida", ftdGoal], ["Faltam", missingFtds]].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white/[.04] p-3">
              <p className="text-[10px] text-slate-500">{label}</p>
              <b className="mt-1 block text-base">{value}</b>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="mb-2 flex justify-between text-[10px] text-slate-500"><span>Progresso</span><span>{formatPercent(ftdProgress)}</span></div>
          <div className="h-2 rounded-full bg-white/[.08]"><div className="h-full rounded-full bg-amber-400" style={{ width: `${ftdProgress}%` }} /></div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">Performance financeira</h3>
              <p className="mt-1 text-[10px] text-slate-500">Receita, gastos e lucro diário</p>
            </div>
            <Badge>Dados reais</Badge>
          </div>
          <div className="mt-4 h-64">
            {chartData.length ? <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#d5a42b" stopOpacity=".38" />
                    <stop offset="1" stopColor="#d5a42b" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff0b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ background: "#141a35", border: "1px solid #ffffff18", borderRadius: 12, fontSize: 11 }} />
                <Area type="monotone" dataKey="receita" stroke="#d5a42b" fill="url(#revenue)" strokeWidth={3} />
                <Line type="monotone" dataKey="lucro" stroke="#34d399" strokeWidth={2} />
                <Line type="monotone" dataKey="gasto" stroke="#f97316" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer> : <div className="grid h-full place-items-center rounded-xl border border-dashed border-white/10 text-xs text-slate-500">Nenhum dado financeiro cadastrado.</div>}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold">Performance por país</h3>
          <p className="mt-1 text-[10px] text-slate-500">Receita acumulada no período</p>
          <div className="mt-5 space-y-5">
            {countries.map((country) => (
              <div key={country.name}>
                <div className="mb-2 flex items-center text-xs">
                  <b>{country.name}</b>
                  <span className="ml-auto text-slate-400">{country.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[.06]">
                  <div className="h-full rounded-full" style={{ width: `${country.pct}%`, background: country.color }} />
                </div>
              </div>
            ))}
            {!countries.length && <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-slate-500">Nenhum dado por país cadastrado.</div>}
          </div>
        </Card>
      </div>

      <CampaignTable campaigns={campaignRows} dailyMetrics={dailyMetricRows} />
    </div>
  );
}

function CampaignTable({ campaigns, dailyMetrics }: { campaigns: CampaignRecord[]; dailyMetrics: DailyMetric[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-5">
        <div>
          <h3 className="text-sm font-bold">Campanhas em destaque</h3>
          <p className="mt-1 text-[10px] text-slate-500">As campanhas com melhor desempenho no período</p>
        </div>
        <Btn secondary>Ver todas</Btn>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-xs">
          <thead className="bg-white/[.025] text-[10px] uppercase tracking-wider text-slate-500">
            <tr>{["Campanha", "Plataforma", "País", "Gasto", "Receita", "Lucro", "ROI", "Status"].map((header) => <th key={header} className="px-5 py-3">{header}</th>)}</tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => {
              const metrics = dailyMetrics.filter((metric) => String(metric.campaign_id || "") === String(campaign.id || ""));
              const spend = sumRows(metrics, "spend");
              const revenue = sumRows(metrics, "revenue");
              const profit = revenue - spend;
              return <tr key={String(campaign.id)} className="border-t border-white/[.05]">
                <td className="px-5 py-4 font-bold">{campaign.name}</td>
                <td className="px-5 text-slate-400">{campaign.platform}</td>
                <td className="px-5 text-slate-400">{campaign.country}</td>
                <td className="px-5 text-slate-400">{formatCurrency(spend)}</td>
                <td className="px-5">{formatCurrency(revenue)}</td>
                <td className="px-5 font-bold text-emerald-400">{formatCurrency(profit)}</td>
                <td className="px-5 font-bold text-emerald-400">{formatPercent(safeDivide(profit, spend) * 100)}</td>
                <td className="px-5"><Badge tone="green">{campaign.status || "Planejamento"}</Badge></td>
              </tr>
            })}
            {!campaigns.length && <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-500">Nenhuma campanha real cadastrada.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Creatives() {
  const defaultFolders = [
    { label: "Criativos Prontos", type: "pronto", description: "Pasta com criativos prontos para uso na operacao.", url: "https://drive.google.com/drive/folders/1ik_S2JepbqR-MdNVbtytF0SPV8POtbGh" },
    { label: "Criativos Para Modelar", type: "para_modelar", description: "Pasta com referencias e criativos para modelagem/adaptacao.", url: "https://drive.google.com/drive/folders/1oJ5Dgs63qLlCUjYvxq-sg0-_YUOA6i9c" },
  ];
  const [folders, setFolders] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      setFolders(await listRows("creative_folders"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const findFolder = (label: string, type: string) => folders.find((folder) => {
    const name = String(folder.name || "").toLowerCase();
    const folderType = String(folder.folder_type || "").toLowerCase();
    return name.includes(label.toLowerCase()) || folderType.includes(type);
  });
  const folderSources = defaultFolders.map((source) => {
    const folder = findFolder(source.label, source.type);
    return { ...source, url: String(folder?.drive_url || source.url) };
  });

  return (
    <div className="rise space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Biblioteca de criativos</h2>
          <p className="mt-1 text-xs text-slate-500">Encontre os formatos e ângulos que mais convertem.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {folderSources.map((source) => (
          <Card key={source.type} className="p-6">
            <div className="flex h-full flex-col justify-between gap-5">
              <div>
                <p className="text-lg font-bold">{source.label}</p>
                <p className="mt-2 text-sm text-slate-400">{source.description}</p>
              </div>
              <button onClick={() => window.open(source.url, "_blank", "noopener,noreferrer")} className="inline-flex w-fit items-center gap-2 rounded-xl bg-amber-500/15 px-4 py-3 text-xs font-bold text-amber-200">
                <ExternalLink size={15} />Abrir pasta
              </button>
            </div>
          </Card>
        ))}
      </div>
      {loading && <Card className="p-5 text-center text-xs text-slate-500">Carregando pastas...</Card>}
    </div>
  );
}

function Spy({
  rows,
  sources,
  search,
  setSearch,
  add,
  remove,
  notify,
}: {
  rows: SpyRow[];
  sources: SpySource[];
  search: string;
  setSearch: (value: string) => void;
  add: () => void;
  remove: (id?: string) => void;
  notify: (message: string) => void;
}) {
  const mainSpy = rows.find((item) => String(item.name || item.brand || "").toLowerCase().includes("spy igaming chile")) || rows.find((item) => Boolean(item.main_url));
  const defaultSource: SpySource = {
    name: "SPY IGAMING CHILE",
    source_url: "https://docs.google.com/document/d/1rWTk54TMAvXxBmtcX19LYx_Vcoe-FP2voB_Y9Riisns/edit?tab=t.0",
    source_type: "google_docs",
    status: "active",
  };
  const visibleSources = sources.length ? sources : [defaultSource];
  const spyUrl = String(mainSpy?.main_url || visibleSources[0]?.source_url || defaultSource.source_url);
  const counters: [string, string, LucideIcon][] = [
    ["Anúncios salvos", String(rows.length), Target],
    ["Em análise", String(rows.filter((row) => String(row.status || "").toLowerCase() === "analisando").length), Search],
    ["Winners encontrados", String(rows.filter((row) => (row.tags || []).some((tag) => tag.toLowerCase() === "winner")).length), Sparkles],
  ];

  return (
    <div className="rise space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Spy de Anúncios <span className="text-pink-400">✦</span></h2>
          <p className="mt-1 text-xs text-slate-500">Radar inteligente de oportunidades e referências.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={add}><Plus size={15} />Salvar anúncio spy</Btn>
        </div>
      </div>
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-lg font-bold">Spy feita dia 29/05</p>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Nesse spy tem: Casas e Marcas do Chile / Jogos e Produtos / Funil Telegram e WhatsApp / LPs e PWA.</p>
          </div>
          <button onClick={() => window.open(spyUrl, "_blank", "noopener,noreferrer")} className="inline-flex items-center gap-2 rounded-xl bg-amber-500/15 px-4 py-3 text-xs font-bold text-amber-200">
            <ExternalLink size={15} />Abrir SPY
          </button>
        </div>
      </Card>
      {false && (<>
      {!rows.length && (
        <div className="grid gap-3 md:grid-cols-2">
          {visibleSources.map((source) => (
            <Card key={String(source.id || source.source_url)} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{source.name || "Documento SPY principal"}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{source.source_type || "google_docs"} · {source.status || "active"}</p>
                </div>
                {source.source_url && <a href={source.source_url} target="_blank" rel="noreferrer" className="rounded-lg bg-white/[.05] p-2 text-slate-300"><ExternalLink size={15} /></a>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-3">
        {counters.map(([label, value, Icon], index) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${index === 0 ? "bg-amber-500/20 text-amber-300" : index === 1 ? "bg-cyan-500/20 text-cyan-300" : "bg-pink-500/20 text-pink-300"}`}><Icon size={17} /></div>
              <div><p className="text-[10px] text-slate-500">{label}</p><b className="text-lg">{value}</b></div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          <label className="flex min-w-52 flex-1 items-center gap-2 rounded-xl bg-white/[.04] px-3">
            <Search size={15} className="text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar marca, nicho ou ângulo..." className="w-full bg-transparent py-3 text-xs outline-none" />
          </label>
          <Btn secondary><Filter size={14} />Filtros</Btn>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="p-5">
          <h3 className="text-sm font-bold">Ranking de potencial</h3>
          <p className="mt-1 text-[10px] text-slate-500">Priorize os anúncios com maior oportunidade de adaptação</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="bg-white/[.025] text-[10px] uppercase text-slate-500">
              <tr>{["Marca", "Plataforma", "País", "Nicho", "Ângulo", "Potencial", "Status", "Ações"].map((header) => <th key={header} className="px-5 py-3">{header}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={String(item.id)} className="border-t border-white/[.05]">
                  <td className="px-5 py-4"><b>{item.name || item.brand || "-"}</b><div className="mt-1"><Badge tone="pink">{item.tags?.[0] || "NOVO"}</Badge></div></td>
                  <td className="px-5 text-slate-400">{item.platform}</td>
                  <td className="px-5 text-slate-400">{item.country}</td>
                  <td className="px-5 text-slate-400">{item.niche}</td>
                  <td className="px-5 text-slate-400">{item.description || item.angle || "-"}</td>
                  <td className="px-5"><b className="text-emerald-300">{String(item.potential_score || 0)}</b><span className="text-slate-600"> / 10</span></td>
                  <td className="px-5"><Badge tone="blue">{item.status}</Badge></td>
                  <td className="px-5">
                    <div className="flex gap-2">
                      <button onClick={() => item.main_url && window.open(String(item.main_url), "_blank", "noopener,noreferrer")} title="Transformar em criativo" className="rounded-lg bg-amber-500/15 p-2 text-amber-300"><Zap size={14} /></button>
                      <button title="Editar" className="rounded-lg bg-white/[.05] p-2 text-slate-400"><Pencil size={14} /></button>
                      <button onClick={() => remove(String(item.id || ""))} title="Excluir" className="rounded-lg bg-red-500/10 p-2 text-red-300"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-500">Nenhum anúncio spy cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      </>)}
    </div>
  );
}

function Financeiro() {
  const emptyForm: FinanceForm = {
    record_date: todayInput(),
    ads_total: "",
    opened_link: "",
    registrations: "",
    ftd: "",
    deposits: "",
    withdrawals: "",
    gross_revenue: "",
    tools_cost: "",
    total_commission: "",
    notes: "",
  };
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [filter, setFilter] = useState("Últimos 30 dias");
  const [customStart, setCustomStart] = useState(daysAgoInput(30));
  const [customEnd, setCustomEnd] = useState(todayInput());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FinanceForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      setRecords((await listRows("financial_records")) as FinanceRecord[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const period = useMemo(() => {
    const today = todayInput();
    if (filter === "Hoje") return { from: today, to: today };
    if (filter === "Ontem") {
      const yesterday = daysAgoInput(1);
      return { from: yesterday, to: yesterday };
    }
    if (filter === "Semana") return { from: daysAgoInput(7), to: today };
    if (filter === "Mês") return { from: new Date().toISOString().slice(0, 8) + "01", to: today };
    if (filter === "Personalizado") return { from: customStart, to: customEnd };
    return { from: daysAgoInput(30), to: today };
  }, [customEnd, customStart, filter]);

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const date = String(record.record_date || "");
        return date >= period.from && date <= period.to;
      }),
    [period.from, period.to, records],
  );

  const summary = useMemo<FinanceSummary>(() => {
    const adsTotal = sumRows(filteredRecords, "ads_total") || sumRows(filteredRecords, "spend");
    const openedLink = sumRows(filteredRecords, "opened_link");
    const registrations = sumRows(filteredRecords, "registrations");
    const ftd = sumRows(filteredRecords, "ftd");
    const deposits = sumRows(filteredRecords, "deposits");
    const withdrawals = sumRows(filteredRecords, "withdrawals");
    const grossRevenue = sumRows(filteredRecords, "gross_revenue") || sumRows(filteredRecords, "revenue");
    const toolsCost = sumRows(filteredRecords, "tools_cost");
    const totalCommission = sumRows(filteredRecords, "total_commission");
    const netDeposit = deposits - withdrawals;
    const netProfit = totalCommission - adsTotal - toolsCost;
    return {
      adsTotal,
      openedLink,
      registrations,
      ftd,
      deposits,
      withdrawals,
      netDeposit,
      grossRevenue,
      toolsCost,
      totalCommission,
      netProfit,
      roi: safeDivide(netProfit, adsTotal) * 100,
      costFtd: safeDivide(adsTotal, ftd),
    };
  }, [filteredRecords]);

  const chartRows = useMemo(() => {
    const grouped = new Map<string, FinanceSummary & { date: string }>();
    filteredRecords.forEach((record) => {
      const date = String(record.record_date || "Sem data");
      const current = grouped.get(date) || {
        date,
        adsTotal: 0,
        openedLink: 0,
        registrations: 0,
        ftd: 0,
        deposits: 0,
        withdrawals: 0,
        netDeposit: 0,
        grossRevenue: 0,
        toolsCost: 0,
        totalCommission: 0,
        netProfit: 0,
        roi: 0,
        costFtd: 0,
      };
      current.adsTotal += toNumber(record.ads_total ?? record.spend);
      current.openedLink += toNumber(record.opened_link);
      current.registrations += toNumber(record.registrations);
      current.ftd += toNumber(record.ftd);
      current.deposits += toNumber(record.deposits);
      current.withdrawals += toNumber(record.withdrawals);
      current.grossRevenue += toNumber(record.gross_revenue ?? record.revenue);
      current.toolsCost += toNumber(record.tools_cost);
      current.totalCommission += toNumber(record.total_commission);
      current.netDeposit = current.deposits - current.withdrawals;
      current.netProfit = current.totalCommission - current.adsTotal - current.toolsCost;
      current.roi = safeDivide(current.netProfit, current.adsTotal) * 100;
      current.costFtd = safeDivide(current.adsTotal, current.ftd);
      grouped.set(date, current);
    });
    return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRecords]);

  const saveRecord = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const values = {
        record_date: form.record_date,
        ads_total: toNumber(form.ads_total),
        opened_link: toNumber(form.opened_link),
        registrations: toNumber(form.registrations),
        ftd: toNumber(form.ftd),
        deposits: toNumber(form.deposits),
        withdrawals: toNumber(form.withdrawals),
        gross_revenue: toNumber(form.gross_revenue),
        tools_cost: toNumber(form.tools_cost),
        total_commission: toNumber(form.total_commission),
        spend: toNumber(form.ads_total),
        revenue: toNumber(form.gross_revenue),
        notes: form.notes,
        currency: "BRL",
      };
      await createRow("financial_records", values);
      setForm(emptyForm);
      setShowForm(false);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const cards = [
    ["Ads Total", formatCurrency(summary.adsTotal), CircleDollarSign, "from-amber-500 to-yellow-400"],
    ["Registros", new Intl.NumberFormat("pt-BR").format(summary.registrations), Activity, "from-cyan-500 to-blue-600"],
    ["FTDs", new Intl.NumberFormat("pt-BR").format(summary.ftd), Target, "from-emerald-500 to-teal-600"],
    ["Custo FTD Geral", formatCurrency(summary.costFtd), Gauge, "from-orange-500 to-pink-600"],
    ["Depósitos", formatCurrency(summary.deposits), TrendingUp, "from-emerald-500 to-lime-500"],
    ["Saques", formatCurrency(summary.withdrawals), Download, "from-red-500 to-orange-500"],
    ["Net Deposit", formatCurrency(summary.netDeposit), Sparkles, "from-violet-500 to-amber-500"],
    ["Receita Bruta", formatCurrency(summary.grossRevenue), CircleDollarSign, "from-blue-500 to-cyan-400"],
    ["Custo em Ferramentas", formatCurrency(summary.toolsCost), Settings, "from-slate-500 to-slate-300"],
    ["Comissão Total", formatCurrency(summary.totalCommission), BriefcaseBusiness, "from-amber-600 to-yellow-500"],
    ["Lucro Líquido", formatCurrency(summary.netProfit), Sparkles, "from-emerald-600 to-cyan-500"],
    ["ROI", formatPercent(summary.roi), Gauge, "from-pink-500 to-amber-500"],
  ] as const;

  const charts = [
    ["Ads Total por dia", "adsTotal", "#d5a42b"],
    ["FTD por dia", "ftd", "#34d399"],
    ["Custo FTD por dia", "costFtd", "#fb923c"],
    ["Depósitos x Saques", "deposits", "#22d3ee", "withdrawals", "#f87171"],
    ["Receita Bruta por dia", "grossRevenue", "#60a5fa"],
    ["Comissão Total por dia", "totalCommission", "#facc15"],
    ["Lucro Líquido por dia", "netProfit", "#10b981"],
    ["ROI por dia", "roi", "#e879f9"],
  ] as const;

  return (
    <div className="rise space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Financeiro</h2>
          <p className="mt-1 text-xs text-slate-500">Todos os valores, cálculos e detalhes financeiros da operação.</p>
        </div>
        <Btn onClick={() => setShowForm(true)}><Plus size={15} />Novo registro financeiro</Btn>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          {["Hoje", "Ontem", "Semana", "Mês", "Últimos 30 dias", "Personalizado"].map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`rounded-full border px-3 py-2 text-[10px] font-bold ${filter === option ? "border-amber-400/40 bg-amber-400/15 text-amber-200" : "border-white/10 bg-white/[.03] text-slate-400"}`}
            >
              {option}
            </button>
          ))}
          {filter === "Personalizado" && (
            <div className="flex flex-wrap gap-2">
              <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="rounded-lg border border-white/10 bg-white/[.04] px-2 py-1 text-xs" />
              <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="rounded-lg border border-white/10 bg-white/[.04] px-2 py-1 text-xs" />
            </div>
          )}
        </div>
      </Card>

      {showForm && (
        <Card className="p-5">
          <form onSubmit={saveRecord} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">Cadastro manual</h3>
                <p className="mt-1 text-[10px] text-slate-500">Preencha somente dados reais da operação.</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-white/[.05] p-2 text-slate-400"><X size={15} /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              {[
                ["Data", "record_date", "date"],
                ["Ads Total", "ads_total", "number"],
                ["Abriu Link", "opened_link", "number"],
                ["Registros", "registrations", "number"],
                ["FTD", "ftd", "number"],
                ["Depósitos", "deposits", "number"],
                ["Saques", "withdrawals", "number"],
                ["Receita Bruta", "gross_revenue", "number"],
                ["Custo em Ferramentas", "tools_cost", "number"],
                ["Comissão Total", "total_commission", "number"],
              ].map(([label, key, type]) => (
                <label key={key} className="block">
                  <span className="text-[10px] font-bold uppercase text-slate-500">{label}</span>
                  <input
                    required={key === "record_date"}
                    type={type}
                    step={type === "number" ? "0.01" : undefined}
                    value={form[key as keyof FinanceForm]}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400"
                  />
                </label>
              ))}
              <label className="block md:col-span-3 xl:col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-500">Observações</span>
                <input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Btn secondary onClick={() => setShowForm(false)}>Cancelar</Btn>
              <Btn type="submit">{saving ? "Salvando..." : "Salvar registro"}</Btn>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon, color]) => (
          <Card key={label} className="p-4">
            <div className="flex items-center justify-between">
              <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${color} text-slate-950`}><Icon size={18} /></div>
              <Badge>{filter}</Badge>
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
            <b className="mt-1 block text-lg">{value}</b>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {charts.map(([title, firstKey, firstColor, secondKey, secondColor]) => (
          <Card key={title} className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{title}</h3>
              <Badge>{chartRows.length} dias</Badge>
            </div>
            <div className="mt-4 h-48">
              {chartRows.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartRows}>
                    <CartesianGrid stroke="#ffffff0b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ background: "#141a35", border: "1px solid #ffffff18", borderRadius: 12, fontSize: 11 }} />
                    <Area type="monotone" dataKey={firstKey} stroke={firstColor} fill={firstColor} fillOpacity={0.16} strokeWidth={2} />
                    {secondKey && <Area type="monotone" dataKey={secondKey} stroke={secondColor} fill={secondColor} fillOpacity={0.12} strokeWidth={2} />}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center rounded-xl border border-dashed border-white/10 text-xs text-slate-500">Sem dados financeiros no período.</div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <div>
            <h3 className="text-sm font-bold">Tabela financeira detalhada</h3>
            <p className="mt-1 text-[10px] text-slate-500">Campos operacionais, valores e cálculos automáticos.</p>
          </div>
          {loading && <Badge>Carregando</Badge>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1380px] text-left text-xs">
            <thead className="bg-white/[.025] text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                {["DATA", "ADS TOTAL", "ABRIU LINK", "REGISTROS", "FTD", "CUSTO FTD GERAL", "DEPÓSITOS", "SAQUES", "DEPÓSITOS - SAQUES", "RECEITA BRUTA", "CUSTO EM FERRAMENTAS", "COMISSÃO TOTAL", "LUCRO LÍQUIDO", "ROI", "TAXA REGISTRO -> FTD", "CUSTO POR REGISTRO", "CUSTO POR ABRIU LINK"].map((header) => (
                  <th key={header} className="px-4 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const adsTotal = toNumber(record.ads_total ?? record.spend);
                const openedLink = toNumber(record.opened_link);
                const registrations = toNumber(record.registrations);
                const ftd = toNumber(record.ftd);
                const deposits = toNumber(record.deposits);
                const withdrawals = toNumber(record.withdrawals);
                const grossRevenue = toNumber(record.gross_revenue ?? record.revenue);
                const toolsCost = toNumber(record.tools_cost);
                const totalCommission = toNumber(record.total_commission);
                const netDeposit = deposits - withdrawals;
                const netProfit = totalCommission - adsTotal - toolsCost;
                return (
                  <tr key={record.id || `${record.record_date}-${adsTotal}-${totalCommission}`} className="border-t border-white/[.05]">
                    <td className="px-4 py-4 font-bold">{String(record.record_date || "-")}</td>
                    <td className="px-4 text-slate-400">{formatCurrency(adsTotal)}</td>
                    <td className="px-4 text-slate-400">{openedLink}</td>
                    <td className="px-4 text-slate-400">{registrations}</td>
                    <td className="px-4 text-slate-400">{ftd}</td>
                    <td className="px-4 text-slate-400">{formatCurrency(safeDivide(adsTotal, ftd))}</td>
                    <td className="px-4 text-slate-400">{formatCurrency(deposits)}</td>
                    <td className="px-4 text-slate-400">{formatCurrency(withdrawals)}</td>
                    <td className="px-4 font-bold text-cyan-300">{formatCurrency(netDeposit)}</td>
                    <td className="px-4 text-slate-400">{formatCurrency(grossRevenue)}</td>
                    <td className="px-4 text-slate-400">{formatCurrency(toolsCost)}</td>
                    <td className="px-4 text-slate-400">{formatCurrency(totalCommission)}</td>
                    <td className="px-4 font-bold text-emerald-300">{formatCurrency(netProfit)}</td>
                    <td className="px-4 font-bold text-emerald-300">{formatPercent(safeDivide(netProfit, adsTotal) * 100)}</td>
                    <td className="px-4 text-slate-400">{formatPercent(safeDivide(ftd, registrations) * 100)}</td>
                    <td className="px-4 text-slate-400">{formatCurrency(safeDivide(adsTotal, registrations))}</td>
                    <td className="px-4 text-slate-400">{formatCurrency(safeDivide(adsTotal, openedLink))}</td>
                  </tr>
                );
              })}
              {!filteredRecords.length && (
                <tr>
                  <td colSpan={17} className="px-5 py-10 text-center text-slate-500">Nenhum registro financeiro real cadastrado neste período.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Campanhas() {
  const emptyForm: CampaignForm = {
    name: "",
    platform: "",
    country: "",
    campaign_type: "",
    objective: "Tráfego",
    daily_budget: "",
    total_budget: "",
    spent_amount: "",
    status: "Planejamento",
    creative_ids: [],
    page_id: "",
    offer_id: "",
    pixel_id: "",
    notes: "",
  };
  const [records, setRecords] = useState<CampaignRecord[]>([]);
  const [creativesList, setCreativesList] = useState<Row[]>([]);
  const [pagesList, setPagesList] = useState<Row[]>([]);
  const [offersList, setOffersList] = useState<Row[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [countryFilter, setCountryFilter] = useState("Todos");
  const [platformFilter, setPlatformFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const [campaignRows, creativeRows, pageRows, offerRows, metricRows] = await Promise.all([
        listRows("campaigns"),
        listRows("creatives"),
        listRows("operation_pages"),
        listRows("offers"),
        listRows("daily_metrics"),
      ]);
      setRecords(campaignRows as CampaignRecord[]);
      setCreativesList(creativeRows);
      setPagesList(pageRows);
      setOffersList(offerRows);
      setDailyMetrics(metricRows as DailyMetric[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const openCreate = () => {
    setEditingId("");
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (record: CampaignRecord) => {
    setEditingId(String(record.id || ""));
    setForm({
      name: String(record.name || ""),
      platform: String(record.platform || ""),
      country: String(record.country || ""),
      campaign_type: String(record.campaign_type || ""),
      objective: String(record.objective || "Tráfego"),
      daily_budget: String(record.daily_budget || ""),
      total_budget: String(record.total_budget || ""),
      spent_amount: String(record.spent_amount || ""),
      status: String(record.status || "Planejamento"),
      creative_ids: Array.isArray(record.creative_ids) ? record.creative_ids : [],
      page_id: String(record.page_id || ""),
      offer_id: String(record.offer_id || ""),
      pixel_id: String(record.pixel_id || ""),
      notes: String(record.notes || ""),
    });
    setShowForm(true);
  };

  const saveCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const values = {
        name: form.name,
        platform: form.platform,
        country: form.country,
        campaign_type: form.campaign_type,
        objective: form.objective,
        daily_budget: toNumber(form.daily_budget),
        total_budget: toNumber(form.total_budget),
        spent_amount: toNumber(form.spent_amount),
        status: form.status,
        creative_ids: form.creative_ids,
        page_id: form.page_id || null,
        offer_id: form.offer_id || null,
        pixel_id: form.pixel_id,
        notes: form.notes,
      };

      if (editingId) await updateRow("campaigns", editingId, values);
      else await createRow("campaigns", values);

      setShowForm(false);
      setEditingId("");
      setForm(emptyForm);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const removeCampaign = async (id?: string) => {
    if (!id) return;
    await deleteRow("campaigns", id);
    await reload();
  };

  const statusTone = (status?: string): Tone => {
    if (status === "Lucrativa" || status === "Escalando") return "green";
    if (status === "Pausada" || status === "Encerrada") return "orange";
    if (status === "Em teste") return "blue";
    return "gold";
  };

  const statusOptions = ["Todos", ...Array.from(new Set(records.map((record) => String(record.status || "Planejamento"))))];
  const countryOptions = ["Todos", ...Array.from(new Set(records.map((record) => String(record.country || "")).filter(Boolean)))];
  const platformOptions = ["Todos", ...Array.from(new Set(records.map((record) => String(record.platform || "")).filter(Boolean)))];

  const visible = records.filter((record) => {
    const matchesQuery = `${record.name || ""}${record.platform || ""}${record.country || ""}${record.status || ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "Todos" || String(record.status || "Planejamento") === statusFilter;
    const matchesCountry = countryFilter === "Todos" || String(record.country || "") === countryFilter;
    const matchesPlatform = platformFilter === "Todos" || String(record.platform || "") === platformFilter;
    return matchesQuery && matchesStatus && matchesCountry && matchesPlatform;
  });

  const summary = useMemo(() => {
    const totalBudget = records.reduce((total, record) => total + toNumber(record.total_budget), 0);
    const spent = records.reduce((total, record) => total + toNumber(record.spent_amount), 0);
    return {
      total: records.length,
      testing: records.filter((record) => record.status === "Em teste").length,
      profitable: records.filter((record) => record.status === "Lucrativa").length,
      scaling: records.filter((record) => record.status === "Escalando").length,
      totalBudget,
      spent,
      used: safeDivide(spent, totalBudget) * 100,
      linkedCreatives: records.reduce((total, record) => total + (record.creative_ids?.length || 0), 0),
    };
  }, [records]);
  const campaignSummaryCards: [string, string | number, LucideIcon, string][] = [
    ["Campanhas", summary.total, BriefcaseBusiness, "from-amber-500 to-yellow-400"],
    ["Em teste", summary.testing, Activity, "from-cyan-500 to-blue-600"],
    ["Lucrativas", summary.profitable, Sparkles, "from-emerald-500 to-teal-600"],
    ["Escalando", summary.scaling, TrendingUp, "from-orange-500 to-pink-600"],
    ["Orçamento total", formatCurrency(summary.totalBudget), CircleDollarSign, "from-violet-500 to-amber-500"],
    ["Valor gasto", formatCurrency(summary.spent), Gauge, "from-blue-500 to-cyan-400"],
    ["Orçamento usado", formatPercent(summary.used), Target, "from-emerald-600 to-cyan-500"],
    ["Criativos vinculados", summary.linkedCreatives, Image, "from-pink-500 to-amber-500"],
  ];
  const metricsByCampaign = useMemo(() => records.map((campaign) => {
    const metrics = dailyMetrics.filter((metric) => String(metric.campaign_id || "") === String(campaign.id || ""));
    const totals = metrics.reduce<{ impressions: number; clicks: number; spend: number; leads: number; registrations: number; ftds: number; revenue: number }>((acc, metric) => ({
      impressions: acc.impressions + toNumber(metric.impressions),
      clicks: acc.clicks + toNumber(metric.clicks),
      spend: acc.spend + toNumber(metric.spend),
      leads: acc.leads + toNumber(metric.leads),
      registrations: acc.registrations + toNumber(metric.registrations),
      ftds: acc.ftds + toNumber(metric.ftds),
      revenue: acc.revenue + toNumber(metric.revenue),
    }), { impressions: 0, clicks: 0, spend: 0, leads: 0, registrations: 0, ftds: 0, revenue: 0 });
    return {
      campaign,
      ...totals,
      ctr: safeDivide(totals.clicks, totals.impressions) * 100,
      cpc: safeDivide(totals.spend, totals.clicks),
      cpm: safeDivide(totals.spend, totals.impressions) * 1000,
      cpa: safeDivide(totals.spend, totals.ftds),
      roi: safeDivide(totals.revenue - totals.spend, totals.spend) * 100,
    };
  }), [dailyMetrics, records]);

  return (
    <div className="rise space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Campanhas</h2>
          <p className="mt-1 text-xs text-slate-500">Gestão operacional das campanhas e seus vínculos principais.</p>
        </div>
        <Btn onClick={openCreate}><Plus size={15} />Nova campanha</Btn>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          <label className="flex min-w-52 flex-1 items-center gap-2 rounded-xl bg-white/[.04] px-3">
            <Search size={15} className="text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar campanha, plataforma, país ou status..." className="w-full bg-transparent py-3 text-xs outline-none" />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#11162d] px-3 py-2 text-xs text-slate-300 outline-none focus:border-amber-400">
            {statusOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
          <select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#11162d] px-3 py-2 text-xs text-slate-300 outline-none focus:border-amber-400">
            {countryOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
          <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#11162d] px-3 py-2 text-xs text-slate-300 outline-none focus:border-amber-400">
            {platformOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
          {loading && <Badge>Carregando</Badge>}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {campaignSummaryCards.map(([label, value, Icon, color]) => (
          <Card key={String(label)} className="p-4">
            <div className="flex items-center justify-between">
              <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${color} text-slate-950`}><Icon size={18} /></div>
              <Badge>{visible.length} visíveis</Badge>
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
            <b className="mt-1 block text-lg">{String(value)}</b>
          </Card>
        ))}
      </div>

      {showForm && (
        <Card className="p-5">
          <form onSubmit={saveCampaign} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">{editingId ? "Editar campanha" : "Nova campanha"}</h3>
                <p className="mt-1 text-[10px] text-slate-500">Preencha os dados reais da campanha.</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-white/[.05] p-2 text-slate-400"><X size={15} /></button>
            </div>

            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              {[
                ["Nome da campanha", "name"],
                ["Plataforma", "platform"],
                ["País", "country"],
                ["Tipo de campanha", "campaign_type"],
                ["Orçamento diário", "daily_budget"],
                ["Orçamento total", "total_budget"],
                ["Valor gasto", "spent_amount"],
                ["Pixel vinculado", "pixel_id"],
              ].map(([label, key]) => (
                <label key={key} className="block">
                  <span className="text-[10px] font-bold uppercase text-slate-500">{label}</span>
                  <input
                    required={key === "name"}
                    value={form[key as keyof CampaignForm] as string}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400"
                  />
                </label>
              ))}

              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Objetivo</span>
                <select value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-[#11162d] px-3 py-2 text-xs outline-none focus:border-amber-400">
                  {["Tráfego", "Leads", "Cadastros", "FTD", "Conversão", "Engajamento"].map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Status</span>
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-[#11162d] px-3 py-2 text-xs outline-none focus:border-amber-400">
                  {["Planejamento", "Em teste", "Escalando", "Lucrativa", "Pausada", "Encerrada"].map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Página vinculada</span>
                <select value={form.page_id} onChange={(event) => setForm({ ...form, page_id: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-[#11162d] px-3 py-2 text-xs outline-none focus:border-amber-400">
                  <option value="">Nenhuma página</option>
                  {pagesList.map((page) => <option key={String(page.id)} value={String(page.id)}>{String(page.name || "Página")}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Oferta vinculada</span>
                <select value={form.offer_id} onChange={(event) => setForm({ ...form, offer_id: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-[#11162d] px-3 py-2 text-xs outline-none focus:border-amber-400">
                  <option value="">Nenhuma oferta</option>
                  {offersList.map((offer) => <option key={String(offer.id)} value={String(offer.id)}>{String(offer.name || "Oferta")}</option>)}
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-500">Criativos vinculados</span>
                <select
                  multiple
                  value={form.creative_ids}
                  onChange={(event) => setForm({ ...form, creative_ids: Array.from(event.target.selectedOptions).map((option) => option.value) })}
                  className="mt-1 h-24 w-full rounded-xl border border-white/10 bg-[#11162d] px-3 py-2 text-xs outline-none focus:border-amber-400"
                >
                  {creativesList.map((creative) => <option key={String(creative.id)} value={String(creative.id)}>{String(creative.name || creative.file_name || "Criativo")}</option>)}
                </select>
              </label>

              <label className="block md:col-span-3 xl:col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-500">Observações</span>
                <input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Btn secondary onClick={() => setShowForm(false)}>Cancelar</Btn>
              <Btn type="submit">{saving ? "Salvando..." : "Salvar campanha"}</Btn>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-xs">
            <thead className="bg-white/[.025] text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                {["Nome", "Plataforma", "País", "Tipo", "Objetivo", "Orçamento diário", "Orçamento total", "Valor gasto", "Orcamento usado", "Status", "Criativos", "Página", "Oferta", "Pixel", "Observações", "Ações"].map((header) => (
                  <th key={header} className="px-4 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((record) => {
                const budgetUsed = safeDivide(toNumber(record.spent_amount), toNumber(record.total_budget)) * 100;
                return (
                  <tr key={String(record.id)} className="border-t border-white/[.05]">
                    <td className="px-4 py-4 font-bold">{record.name || "-"}</td>
                    <td className="px-4 text-slate-400">{record.platform || "-"}</td>
                    <td className="px-4 text-slate-400">{record.country || "-"}</td>
                    <td className="px-4 text-slate-400">{record.campaign_type || "-"}</td>
                    <td className="px-4 text-slate-400">{record.objective || "-"}</td>
                    <td className="px-4 text-slate-400">{formatCurrency(toNumber(record.daily_budget))}</td>
                    <td className="px-4 text-slate-400">{formatCurrency(toNumber(record.total_budget))}</td>
                    <td className="px-4 text-slate-400">{formatCurrency(toNumber(record.spent_amount))}</td>
                    <td className="px-4">
                      <div className="min-w-28">
                        <div className="mb-1 text-[10px] text-slate-500">{formatPercent(budgetUsed)}</div>
                        <div className="h-1.5 rounded-full bg-white/[.08]"><div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, budgetUsed)}%` }} /></div>
                      </div>
                    </td>
                    <td className="px-4"><Badge tone={statusTone(record.status)}>{record.status || "Planejamento"}</Badge></td>
                    <td className="px-4 text-slate-400">{(record.creative_ids || []).map((id) => labelById(creativesList, id)).join(", ") || "-"}</td>
                    <td className="px-4 text-slate-400">{labelById(pagesList, record.page_id)}</td>
                    <td className="px-4 text-slate-400">{labelById(offersList, record.offer_id)}</td>
                    <td className="px-4 text-slate-400">{record.pixel_id ? <Badge>{record.pixel_id}</Badge> : "-"}</td>
                    <td className="px-4 text-slate-400">{record.notes || "-"}</td>
                    <td className="px-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(record)} title="Editar" className="rounded-lg bg-white/[.05] p-2 text-slate-400"><Pencil size={14} /></button>
                        <button onClick={() => removeCampaign(String(record.id || ""))} title="Excluir" className="rounded-lg bg-red-500/10 p-2 text-red-300"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!visible.length && (
                <tr>
                  <td colSpan={16} className="px-5 py-10 text-center text-slate-500">Nenhuma campanha cadastrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-5">
          <h3 className="text-sm font-bold">Métricas da Campanha</h3>
          <p className="mt-1 text-[10px] text-slate-500">Dados reais de daily_metrics vinculados por campaign_id. Meta Ads atualizará mídia; a API da casa atualizará registros, FTD, receita, comissão e ROI por campaign_id ou subid.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] text-left text-xs">
            <thead className="bg-white/[.025] text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                {["Campanha", "Impressões", "Cliques", "CTR", "CPC", "CPM", "Gasto", "Leads", "Registros", "FTD", "CPA", "ROI"].map((header) => <th key={header} className="px-4 py-3">{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {metricsByCampaign.map((metric) => (
                <tr key={String(metric.campaign.id)} className="border-t border-white/[.05]">
                  <td className="px-4 py-4 font-bold">{metric.campaign.name || "-"}</td>
                  <td className="px-4 text-slate-400">{metric.impressions}</td>
                  <td className="px-4 text-slate-400">{metric.clicks}</td>
                  <td className="px-4 text-slate-400">{formatPercent(metric.ctr)}</td>
                  <td className="px-4 text-slate-400">{formatCurrency(metric.cpc)}</td>
                  <td className="px-4 text-slate-400">{formatCurrency(metric.cpm)}</td>
                  <td className="px-4 text-slate-400">{formatCurrency(metric.spend)}</td>
                  <td className="px-4 text-slate-400">{metric.leads}</td>
                  <td className="px-4 text-slate-400">{metric.registrations}</td>
                  <td className="px-4 text-slate-400">{metric.ftds}</td>
                  <td className="px-4 text-slate-400">{formatCurrency(metric.cpa)}</td>
                  <td className="px-4 font-bold text-emerald-300">{formatPercent(metric.roi)}</td>
                </tr>
              ))}
              {!metricsByCampaign.length && (
                <tr><td colSpan={12} className="px-5 py-10 text-center text-slate-500">Nenhuma campanha cadastrada para exibir métricas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Relatorios() {
  const [campaignRows, setCampaignRows] = useState<CampaignRecord[]>([]);
  const [metricRows, setMetricRows] = useState<DailyMetric[]>([]);
  const [financeRows, setFinanceRows] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listRows("campaigns"), listRows("daily_metrics"), listRows("financial_records")])
      .then(([campaignsData, metricsData, financeData]) => {
        setCampaignRows(campaignsData as CampaignRecord[]);
        setMetricRows(metricsData as DailyMetric[]);
        setFinanceRows(financeData as FinanceRecord[]);
      })
      .finally(() => setLoading(false));
  }, []);

  const report = useMemo(() => {
    const campaignName = (id?: unknown) => campaignRows.find((campaign) => String(campaign.id || "") === String(id || ""))?.name || "Campanha sem vínculo";
    const summarize = (rows: DailyMetric[]) => rows.reduce<{ spend: number; revenue: number; profit: number; ftds: number }>((acc, row) => ({
      spend: acc.spend + toNumber(row.spend),
      revenue: acc.revenue + toNumber(row.revenue),
      profit: acc.profit + toNumber(row.profit ?? (toNumber(row.revenue) - toNumber(row.spend))),
      ftds: acc.ftds + toNumber(row.ftds),
    }), { spend: 0, revenue: 0, profit: 0, ftds: 0 });
    const campaignMap = new Map<string, DailyMetric[]>();
    const dayMap = new Map<string, DailyMetric[]>();
    metricRows.forEach((row) => {
      const campaignId = String(row.campaign_id || "");
      const day = String(row.metric_date || "");
      campaignMap.set(campaignId, [...(campaignMap.get(campaignId) || []), row]);
      dayMap.set(day, [...(dayMap.get(day) || []), row]);
    });
    const campaignsRanked = Array.from(campaignMap.entries()).map(([campaignId, rows]) => ({ name: campaignName(campaignId), ...summarize(rows) })).sort((a, b) => b.profit - a.profit);
    const daysRanked = Array.from(dayMap.entries()).map(([date, rows]) => ({ date, ...summarize(rows) })).sort((a, b) => b.profit - a.profit);
    const totals = summarize(metricRows);
    return {
      ...totals,
      roi: safeDivide(totals.profit, totals.spend) * 100,
      totalCommission: financeRows.reduce((total, row) => total + toNumber(row.total_commission), 0),
      bestCampaign: campaignsRanked[0],
      worstCampaign: campaignsRanked[campaignsRanked.length - 1],
      bestDay: daysRanked[0],
      worstDay: daysRanked[daysRanked.length - 1],
    };
  }, [campaignRows, financeRows, metricRows]);

  const cards = [
    ["Lucro por período", formatCurrency(report.profit)],
    ["ROI geral", formatPercent(report.roi)],
    ["Total de FTD", report.ftds],
    ["Comissão total", formatCurrency(report.totalCommission)],
    ["Melhor campanha", report.bestCampaign?.name || "-"],
    ["Pior campanha", report.worstCampaign?.name || "-"],
    ["Melhor dia", report.bestDay?.date || "-"],
    ["Pior dia", report.worstDay?.date || "-"],
  ];

  return (
    <div className="rise space-y-5">
      <div>
        <h2 className="text-xl font-bold">Relatórios</h2>
        <p className="mt-1 text-xs text-slate-500">Resumo estratégico com dados reais de campanhas e financeiro.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={String(label)} className="p-4">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
            <b className="mt-2 block text-lg">{String(value)}</b>
          </Card>
        ))}
      </div>
      {loading && <Card className="p-5 text-xs text-slate-500">Carregando relatórios...</Card>}
      {!loading && !metricRows.length && <Card className="p-5 text-xs text-slate-500">Nenhuma métrica real cadastrada para gerar o resumo estratégico.</Card>}
    </div>
  );
}

function Paginas() {
  const emptyForm: PageForm = { name: "", preview_url: "", download_url: "" };
  const [records, setRecords] = useState<PageRecord[]>([]);
  const [form, setForm] = useState<PageForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      setRecords((await listRows("operation_pages")) as PageRecord[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const openCreate = () => {
    setEditingId("");
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (record: PageRecord) => {
    setEditingId(String(record.id || ""));
    setForm({
      name: String(record.name || ""),
      preview_url: String(record.preview_url || ""),
      download_url: String(record.download_url || ""),
    });
    setShowForm(true);
  };

  const savePage = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const values = {
        name: form.name,
        preview_url: form.preview_url,
        download_url: form.download_url,
      };
      if (editingId) await updateRow("operation_pages", editingId, values);
      else await createRow("operation_pages", values);
      setShowForm(false);
      setEditingId("");
      setForm(emptyForm);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const removePage = async (id?: string) => {
    if (!id) return;
    await deleteRow("operation_pages", id);
    await reload();
  };

  const copyLink = async (link?: string) => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
  };

  const openLink = (link?: string) => {
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const downloadLink = (link?: string) => {
    if (!link) return;
    const anchor = document.createElement("a");
    anchor.href = link;
    anchor.download = "";
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.click();
  };

  return (
    <div className="rise space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Páginas</h2>
          <p className="mt-1 text-xs text-slate-500">Cadastro simples de páginas da operação.</p>
        </div>
        <Btn onClick={openCreate}><Plus size={15} />Adicionar página</Btn>
      </div>

      {showForm && (
        <Card className="p-5">
          <form onSubmit={savePage} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">{editingId ? "Editar página" : "Nova página"}</h3>
                <p className="mt-1 text-[10px] text-slate-500">Informe apenas nome, link e download.</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-white/[.05] p-2 text-slate-400"><X size={15} /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Nome</span>
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Link</span>
                <input value={form.preview_url} onChange={(event) => setForm({ ...form, preview_url: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Download</span>
                <input value={form.download_url} onChange={(event) => setForm({ ...form, download_url: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Btn secondary onClick={() => setShowForm(false)}>Cancelar</Btn>
              <Btn type="submit">{saving ? "Salvando..." : "Salvar página"}</Btn>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <div>
            <h3 className="text-sm font-bold">Páginas cadastradas</h3>
            <p className="mt-1 text-[10px] text-slate-500">Sem registros falsos. Apenas páginas cadastradas ou importadas.</p>
          </div>
          {loading && <Badge>Carregando</Badge>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="bg-white/[.025] text-[10px] uppercase tracking-wide text-slate-500">
              <tr>{["Nome", "Link", "Download", "Ações"].map((header) => <th key={header} className="px-5 py-4">{header}</th>)}</tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={String(record.id)} className="border-t border-white/[.05]">
                  <td className="px-5 py-4 font-bold">{record.name || "-"}</td>
                  <td className="max-w-[320px] truncate px-5 text-slate-400">{record.preview_url || "-"}</td>
                  <td className="max-w-[320px] truncate px-5 text-slate-400">{record.download_url || "-"}</td>
                  <td className="px-5">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => copyLink(record.preview_url)} title="Copiar link" className="rounded-lg bg-white/[.05] p-2 text-slate-400"><Copy size={14} /></button>
                      <button onClick={() => openLink(record.preview_url)} title="Abrir link" className="rounded-lg bg-white/[.05] p-2 text-slate-400"><ExternalLink size={14} /></button>
                      <button onClick={() => downloadLink(record.download_url || record.preview_url)} title="Download" className="rounded-lg bg-white/[.05] p-2 text-slate-400"><Download size={14} /></button>
                      <button onClick={() => openEdit(record)} title="Editar" className="rounded-lg bg-white/[.05] p-2 text-slate-400"><Pencil size={14} /></button>
                      <button onClick={() => removePage(String(record.id || ""))} title="Excluir" className="rounded-lg bg-red-500/10 p-2 text-red-300"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!records.length && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-500">Nenhuma página cadastrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Workspace() {
  const columns = ["Ideias", "A Fazer", "Em Produção", "Em Teste", "Concluído"];
  const emptyForm: WorkspaceForm = { title: "", description: "", priority: "Média", status: "Ideias" };
  const [records, setRecords] = useState<WorkspaceCard[]>([]);
  const [form, setForm] = useState<WorkspaceForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      setRecords((await listRows("workspace_cards")) as WorkspaceCard[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const openCreate = () => {
    setEditingId("");
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (record: WorkspaceCard) => {
    setEditingId(String(record.id || ""));
    setForm({
      title: String(record.title || ""),
      description: String(record.description || ""),
      priority: String(record.priority || "Média"),
      status: String(record.status || "Ideias"),
    });
    setShowForm(true);
  };

  const saveCard = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const values = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        status: form.status,
      };
      if (editingId) await updateRow("workspace_cards", editingId, values);
      else await createRow("workspace_cards", values);
      setShowForm(false);
      setEditingId("");
      setForm(emptyForm);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const removeCard = async (id?: string) => {
    if (!id) return;
    await deleteRow("workspace_cards", id);
    await reload();
  };

  const changeStatus = async (record: WorkspaceCard, status: string) => {
    if (!record.id) return;
    await updateRow("workspace_cards", String(record.id), { status });
    await reload();
  };

  const priorityTone = (priority?: string): Tone => {
    if (priority === "Alta" || priority === "Crítica") return "orange";
    if (priority === "Baixa") return "blue";
    return "gold";
  };

  return (
    <div className="rise space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Workspace</h2>
          <p className="mt-1 text-xs text-slate-500">Kanban simples para organizar tarefas da operação.</p>
        </div>
        <Btn onClick={openCreate}><Plus size={15} />Adicionar card</Btn>
      </div>

      {showForm && (
        <Card className="p-5">
          <form onSubmit={saveCard} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">{editingId ? "Editar card" : "Novo card"}</h3>
                <p className="mt-1 text-[10px] text-slate-500">Use apenas título, descrição, prioridade e status.</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-white/[.05] p-2 text-slate-400"><X size={15} /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Título</span>
                <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Prioridade</span>
                <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-[#11162d] px-3 py-2 text-xs outline-none focus:border-amber-400">
                  {["Baixa", "Média", "Alta", "Crítica"].map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Status</span>
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-[#11162d] px-3 py-2 text-xs outline-none focus:border-amber-400">
                  {columns.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="text-[10px] font-bold uppercase text-slate-500">Descrição</span>
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 min-h-24 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Btn secondary onClick={() => setShowForm(false)}>Cancelar</Btn>
              <Btn type="submit">{saving ? "Salvando..." : "Salvar card"}</Btn>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-5">
        {columns.map((column) => {
          const columnCards = records.filter((record) => String(record.status || "Ideias") === column);
          return (
            <section key={column} className="min-h-80 rounded-2xl border border-white/10 bg-white/[.03] p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold">{column}</h3>
                <Badge>{columnCards.length}</Badge>
              </div>
              <div className="space-y-3">
                {columnCards.map((record) => (
                  <Card key={String(record.id)} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold">{record.title || "-"}</h4>
                        <p className="mt-2 text-xs leading-5 text-slate-400">{record.description || "-"}</p>
                      </div>
                      <Badge tone={priorityTone(record.priority)}>{record.priority || "Média"}</Badge>
                    </div>
                    <select value={String(record.status || "Ideias")} onChange={(event) => changeStatus(record, event.target.value)} className="mt-4 w-full rounded-xl border border-white/10 bg-[#11162d] px-3 py-2 text-xs outline-none focus:border-amber-400">
                      {columns.map((option) => <option key={option}>{option}</option>)}
                    </select>
                    <div className="mt-3 flex justify-end gap-2">
                      <button onClick={() => openEdit(record)} title="Editar" className="rounded-lg bg-white/[.05] p-2 text-slate-400"><Pencil size={14} /></button>
                      <button onClick={() => removeCard(String(record.id || ""))} title="Excluir" className="rounded-lg bg-red-500/10 p-2 text-red-300"><Trash2 size={14} /></button>
                    </div>
                  </Card>
                ))}
                {!columnCards.length && <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-slate-500">Sem cards.</div>}
              </div>
            </section>
          );
        })}
      </div>
      {loading && <p className="text-xs text-slate-500">Carregando Workspace...</p>}
    </div>
  );
}

function Integracoes() {
  const emptyForm: IntegrationForm = {
    name: "",
    access_token_encrypted: "",
    business_manager_id: "",
    ad_account_id: "",
    pixel_id: "",
    api_url: "",
    affiliate_id: "",
    subid_param: "",
    status: "Pendente",
  };
  const [records, setRecords] = useState<IntegrationRecord[]>([]);
  const [forms, setForms] = useState<Record<string, IntegrationForm>>({
    meta_ads: emptyForm,
    affiliate_api: emptyForm,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const hasSupabase = Boolean(createSupabaseClient());

  const reload = async () => {
    setLoading(true);
    try {
      const rows = (await listRows("integrations")) as IntegrationRecord[];
      setRecords(rows);
      setForms({
        meta_ads: recordToForm(rows.find((row) => row.provider === "meta_ads")),
        affiliate_api: recordToForm(rows.find((row) => row.provider === "affiliate_api")),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const recordToForm = (record?: IntegrationRecord): IntegrationForm => ({
    name: String(record?.name || ""),
    access_token_encrypted: "",
    business_manager_id: String(record?.business_manager_id || ""),
    ad_account_id: String(record?.ad_account_id || ""),
    pixel_id: String(record?.pixel_id || ""),
    api_url: String(record?.api_url || ""),
    affiliate_id: String(record?.affiliate_id || ""),
    subid_param: String(record?.subid_param || ""),
    status: String(record?.status || "Pendente"),
  });

  const recordFor = (provider: string) => records.find((record) => record.provider === provider);

  const updateForm = (provider: string, key: keyof IntegrationForm, value: string) => {
    setForms((current) => ({ ...current, [provider]: { ...current[provider], [key]: value } }));
  };

  const saveIntegration = async (provider: "meta_ads" | "affiliate_api") => {
    const form = forms[provider];
    const existing = recordFor(provider);
    const values = {
      provider,
      name: form.name,
      access_token_encrypted: form.access_token_encrypted || existing?.access_token_encrypted || "",
      business_manager_id: provider === "meta_ads" ? form.business_manager_id : "",
      ad_account_id: provider === "meta_ads" ? form.ad_account_id : "",
      pixel_id: provider === "meta_ads" ? form.pixel_id : "",
      api_url: provider === "affiliate_api" ? form.api_url : "",
      affiliate_id: provider === "affiliate_api" ? form.affiliate_id : "",
      subid_param: provider === "affiliate_api" ? form.subid_param : "",
      status: form.status,
      notes: provider === "meta_ads" ? "Meta Ads API somente leitura" : "API da Casa de Aposta / Afiliado",
    };

    if (existing?.id) await updateRow("integrations", String(existing.id), values);
    else await createRow("integrations", values);

    setMessage("Integração salva.");
    await reload();
  };

  const testConnection = (provider: "meta_ads" | "affiliate_api") => {
    const form = forms[provider];
    const required =
      provider === "meta_ads"
        ? [form.name, form.access_token_encrypted || recordFor(provider)?.access_token_encrypted, form.business_manager_id, form.ad_account_id]
        : [form.name, form.api_url, form.access_token_encrypted || recordFor(provider)?.access_token_encrypted, form.affiliate_id];
    setMessage(required.every(Boolean) ? "Campos obrigatórios preenchidos. Pronto para teste real futuro." : "Preencha os campos obrigatórios antes de testar.");
  };

  const syncNow = async (provider: "meta_ads" | "affiliate_api") => {
    const existing = recordFor(provider);
    if (!existing?.id) {
      setMessage("Salve a integração antes de sincronizar.");
      return;
    }
    await updateRow("integrations", String(existing.id), { status: "Pronto", last_sync_at: new Date().toISOString() });
    setMessage("Sincronização simulada registrada. Nenhuma chamada real foi feita.");
    await reload();
  };

  const removeIntegration = async (provider: "meta_ads" | "affiliate_api") => {
    const existing = recordFor(provider);
    if (!existing?.id) return;
    await deleteRow("integrations", String(existing.id));
    setMessage("Integração removida.");
    await reload();
  };

  const renderBlock = (provider: "meta_ads" | "affiliate_api", title: string) => {
    const form = forms[provider];
    const existing = recordFor(provider);
    const isMeta = provider === "meta_ads";
    const mapping = isMeta ? integrationMappings.metaAdsToCampaigns : integrationMappings.affiliateToFinance;

    return (
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">{isMeta ? "Somente leitura. Apenas puxa dados para Campanhas, Financeiro e Relatórios." : "Preparada para puxar dados de registros, FTD, depósitos, saques e comissões."}</p>
          </div>
          <Badge tone={form.status === "Pronto" ? "green" : "gold"}>{form.status}</Badge>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="text-[10px] font-bold uppercase text-slate-500">{isMeta ? "Nome da integração" : "Nome da casa/oferta"}</span>
            <input value={form.name} onChange={(event) => updateForm(provider, "name", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
          </label>
          {isMeta ? (
            <>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Access Token</span>
                <input value={form.access_token_encrypted} placeholder={maskToken(existing?.access_token_encrypted)} onChange={(event) => updateForm(provider, "access_token_encrypted", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Business Manager ID</span>
                <input value={form.business_manager_id} onChange={(event) => updateForm(provider, "business_manager_id", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Ad Account ID</span>
                <input value={form.ad_account_id} onChange={(event) => updateForm(provider, "ad_account_id", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Pixel ID</span>
                <input value={form.pixel_id} onChange={(event) => updateForm(provider, "pixel_id", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
              </label>
            </>
          ) : (
            <>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">URL da API</span>
                <input value={form.api_url} onChange={(event) => updateForm(provider, "api_url", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">API Key / Token</span>
                <input value={form.access_token_encrypted} placeholder={maskToken(existing?.access_token_encrypted)} onChange={(event) => updateForm(provider, "access_token_encrypted", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">ID de afiliado</span>
                <input value={form.affiliate_id} onChange={(event) => updateForm(provider, "affiliate_id", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase text-slate-500">Parâmetro/SubID</span>
                <input value={form.subid_param} onChange={(event) => updateForm(provider, "subid_param", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs outline-none focus:border-amber-400" />
              </label>
            </>
          )}
          <label className="block">
            <span className="text-[10px] font-bold uppercase text-slate-500">Status</span>
            <select value={form.status} onChange={(event) => updateForm(provider, "status", event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#11162d] px-3 py-2 text-xs outline-none focus:border-amber-400">
              {["Pendente", "Pronto", "Erro", "Desconectado"].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500">Última sincronização</span>
            <div className="mt-1 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs text-slate-400">{existing?.last_sync_at ? new Date(existing.last_sync_at).toLocaleString("pt-BR") : "-"}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Btn onClick={() => saveIntegration(provider)}>Salvar integração</Btn>
          <Btn secondary onClick={() => testConnection(provider)}>Testar conexão</Btn>
          <Btn secondary onClick={() => syncNow(provider)}>Sincronizar agora</Btn>
          <Btn secondary onClick={() => removeIntegration(provider)}>Remover integração</Btn>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[.03] p-4">
          <p className="text-[10px] font-bold uppercase text-slate-500">Mapeamento futuro</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {mapping.map((field) => <Badge key={field}>{field}</Badge>)}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="rise space-y-5">
      <div>
        <h2 className="text-xl font-bold">Integrações</h2>
        <p className="mt-1 text-xs text-slate-500">Conexões preparadas para puxar dados automaticamente depois.</p>
      </div>
      {message && <Card className="p-3 text-xs text-amber-200">{message}</Card>}
      <Card className="p-4">
        <p className="text-xs text-slate-400">Tokens são exibidos apenas com os últimos 4 caracteres. Criptografia real fica preparada para uma próxima etapa.</p>
        <p className="mt-1 text-[10px] text-slate-600">{hasSupabase ? "Supabase configurado: dados salvos no banco." : "Supabase não configurado: usando fallback local do repository."}</p>
      </Card>
      {loading ? <Card className="p-5 text-xs text-slate-500">Carregando integrações...</Card> : null}
      {renderBlock("meta_ads", "Meta Ads API")}
      {renderBlock("affiliate_api", "API da Casa de Aposta / Afiliado")}
    </div>
  );
}
