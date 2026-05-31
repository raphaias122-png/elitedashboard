import { createClient } from "./supabase";

export const tables = ["campaigns", "creatives", "spy_ads", "spy_items", "spy_sources", "drive_creatives", "creative_folders", "creative_assets", "operation_pages", "influencers", "influencer_contacts", "operation_budgets", "integrations", "integration_sync_logs", "meta_ads_metrics", "workspace_boards", "workspace_columns", "workspace_cards", "workspace_checklists", "workspace_notes", "workspace_goals", "offers", "campaign_creatives", "campaign_pages", "campaign_offers", "campaign_budgets", "campaign_tests", "daily_metrics", "financial_records", "dds_logs"] as const;
export type TableName = (typeof tables)[number];
export type Row = Record<string, unknown> & { id?: string; user_id?: string };

const key = (table: TableName) => `orbit_demo_${table}`;
const settingKey = (name: string) => `orbit_setting_${name}`;
const readDemo = (table: TableName): Row[] => JSON.parse(localStorage.getItem(key(table)) || "[]");

export async function listRows(table: TableName) {
  const supabase = createClient();
  if (!supabase) return readDemo(table);
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
export async function createRow(table: TableName, values: Row) {
  const supabase = createClient();
  if (!supabase) {
    const row = { ...values, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    localStorage.setItem(key(table), JSON.stringify([row, ...readDemo(table)]));
    return row;
  }
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from(table).insert({ ...values, user_id: user?.id }).select().single();
  if (error) throw error;
  return data;
}
export async function updateRow(table: TableName, id: string, values: Row) {
  const supabase = createClient();
  if (!supabase) {
    const rows = readDemo(table).map(row => row.id === id ? { ...row, ...values } : row);
    localStorage.setItem(key(table), JSON.stringify(rows));
    return rows.find(row => row.id === id);
  }
  const { data, error } = await supabase.from(table).update(values).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteRow(table: TableName, id: string) {
  const supabase = createClient();
  if (!supabase) {
    localStorage.setItem(key(table), JSON.stringify(readDemo(table).filter(row => row.id !== id)));
    return;
  }
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function linkSpyAndCreativeDataToCurrentUser() {
  const supabase = createClient();
  if (!supabase) throw new Error("Configure o Supabase.");
  const { data, error } = await supabase.rpc("claim_existing_spy_and_creative_data");
  if (error) throw error;
  return data;
}

export function getSetting(name: string, fallback: string) {
  return localStorage.getItem(settingKey(name)) || fallback;
}

export function setSetting(name: string, value: string) {
  localStorage.setItem(settingKey(name), value);
}

export async function exportRepositoryBackup() {
  const groups: Record<string, TableName[]> = {
    financeiro: ["financial_records"],
    campanhas: ["campaigns", "daily_metrics", "campaign_budgets", "campaign_tests"],
    criativos: ["creatives", "drive_creatives", "creative_folders", "creative_assets"],
    spy: ["spy_ads", "spy_items", "spy_sources"],
    paginas: ["operation_pages"],
    workspace: ["workspace_boards", "workspace_columns", "workspace_cards", "workspace_checklists", "workspace_notes", "workspace_goals"],
    integracoes: ["integrations", "integration_sync_logs", "meta_ads_metrics"],
    relatorios_metas: ["operation_budgets", "daily_metrics", "financial_records", "workspace_goals"],
  };
  const backup: Record<string, unknown> = { exported_at: new Date().toISOString() };
  for (const [group, groupTables] of Object.entries(groups)) {
    backup[group] = Object.fromEntries(await Promise.all(groupTables.map(async (table) => [table, await listRows(table)])));
  }
  backup.configuracoes = { meta_ftd: getSetting("meta_ftd", "50") };
  return backup;
}
