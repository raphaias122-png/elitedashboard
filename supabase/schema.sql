-- Orbit Affiliates: execute in the Supabase SQL Editor.
create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, role text default 'user', must_change_password boolean default false,
  avatar_url text,
  created_at timestamptz default now()
);
create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, platform text, country text, niche text, status text default 'active',
  daily_budget numeric default 0, affiliate_link text, pixel text, notes text, created_at timestamptz default now()
);
create table if not exists public.creatives (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, asset_url text, niche text, country text, angle text, hook text, cta text, status text default 'active',
  ctr numeric default 0, cpm numeric default 0, cpc numeric default 0, cpa numeric default 0, conversions integer default 0, notes text, created_at timestamptz default now()
);
create table if not exists public.spy_ads (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  found_at date default current_date, platform text, country text, niche text, brand text, ad_url text, landing_page_url text,
  primary_text text, headline text, cta text, offer text, angle text, promise_type text, tags text[], adaptation_ideas text,
  notes text, status text default 'analisando', potential_score numeric check (potential_score between 1 and 10), created_at timestamptz default now()
);
create table if not exists public.daily_metrics (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade, metric_date date not null default current_date,
  impressions integer default 0, clicks integer default 0, spend numeric default 0, leads integer default 0, registrations integer default 0,
  ftds integer default 0, revenue numeric default 0,
  ctr numeric generated always as (case when impressions > 0 then clicks::numeric / impressions * 100 else 0 end) stored,
  cpc numeric generated always as (case when clicks > 0 then spend / clicks else 0 end) stored,
  cpm numeric generated always as (case when impressions > 0 then spend / impressions * 1000 else 0 end) stored,
  cpa numeric generated always as (case when ftds > 0 then spend / ftds else 0 end) stored,
  profit numeric generated always as (revenue - spend) stored,
  roi numeric generated always as (case when spend > 0 then (revenue - spend) / spend * 100 else 0 end) stored
);
create table if not exists public.financial_records (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  record_date date not null default current_date, traffic_source text, campaign_id uuid references public.campaigns(id) on delete set null,
  country text, spend numeric default 0, revenue numeric default 0, notes text,
  profit numeric generated always as (revenue - spend) stored,
  roi numeric generated always as (case when spend > 0 then (revenue - spend) / spend * 100 else 0 end) stored
);
create table if not exists public.dds_logs (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date, owner text, daily_topic text, completed_work text, issues text,
  next_actions text, daily_result text, status text default 'open', created_at timestamptz default now()
);
create table if not exists public.spy_items (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  category text not null, name text not null, platform text, country text, main_url text, description text, notes text,
  status text default 'novo' check (status in ('novo','analisando','modelado','testado','descartado')),
  priority text default 'média' check (priority in ('baixa','média','alta')), tags text[], source_document_url text,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique(user_id, main_url)
);
alter table public.users add column if not exists role text default 'user';
alter table public.users add column if not exists must_change_password boolean default false;
alter table public.spy_items add column if not exists subcategory text;
alter table public.spy_items add column if not exists source text;
alter table public.spy_items add column if not exists updated_at timestamptz default now();
create table if not exists public.drive_creatives (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  drive_file_id text not null, file_name text not null, file_type text, drive_url text, preview_url text, thumbnail_url text,
  status text default 'para modelar', niche text, country text, notes text, imported_at timestamptz default now(),
  unique(user_id, drive_file_id)
);
create table if not exists public.operation_pages (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, page_type text, country text, niche text, file_url text, preview_url text, download_url text,
  drive_url text, status text default 'novo', notes text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.influencers (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  handle text not null, name text, platform text, country text, niche text, followers integer default 0,
  avg_views integer default 0, avg_likes integer default 0, engagement_rate numeric default 0, profile_url text,
  whatsapp text, email text, price numeric default 0,
  status text default 'prospectar' check (status in ('prospectar','contatado','negociando','fechado','rejeitado','testado')),
  notes text, last_contact date, next_action text, proposal text, contact_history jsonb default '[]'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now(), unique(user_id, handle)
);
create table if not exists public.influencer_contacts (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  influencer_id uuid not null references public.influencers(id) on delete cascade, contact_date timestamptz default now(),
  channel text, notes text, proposal text, next_action text, created_at timestamptz default now()
);
create table if not exists public.operation_budgets (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null default 0, currency text not null default 'BRL', notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.integrations (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'meta_ads_read_only', name text not null, access_token_encrypted text,
  business_manager_id text, ad_account_id text, pixel_id text, status text default 'disconnected',
  last_sync_at timestamptz, notes text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.integration_sync_logs (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade, provider text not null default 'meta_ads_read_only',
  sync_type text default 'insights_read_only', status text not null, message text, imported_campaigns integer default 0,
  imported_ads integer default 0, date_from date, date_to date, created_at timestamptz default now()
);
create table if not exists public.meta_ads_metrics (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  integration_id uuid not null references public.integrations(id) on delete cascade, date date not null,
  campaign_id text, campaign_name text, adset_id text, adset_name text, ad_id text, ad_name text,
  impressions integer default 0, clicks integer default 0, ctr numeric default 0, cpc numeric default 0,
  cpm numeric default 0, spend numeric default 0, reach integer default 0, frequency numeric default 0,
  leads integer default 0, registrations integer default 0, pixel_events jsonb default '{}'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.workspace_boards (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Central de Operações', description text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.workspace_columns (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid not null references public.workspace_boards(id) on delete cascade, name text not null, slug text not null,
  position integer not null default 0, color text, created_at timestamptz default now(), unique(board_id, slug)
);
create table if not exists public.workspace_cards (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid references public.workspace_boards(id) on delete cascade,
  column_id uuid references public.workspace_columns(id) on delete cascade,
  title text not null, description text, category text, priority text default 'Média', owner text,
  deadline date, tags text[], attachments jsonb default '[]'::jsonb, links jsonb default '[]'::jsonb, notes text,
  related_type text, related_id text, related_url text, position integer not null default 0,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.workspace_cards add column if not exists status text default 'Ideias';
create table if not exists public.workspace_checklists (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.workspace_cards(id) on delete cascade, text text not null, done boolean default false,
  position integer not null default 0, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.workspace_notes (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid references public.workspace_boards(id) on delete cascade, content text, note_type text default 'brain_dump',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.workspace_goals (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid references public.workspace_boards(id) on delete cascade, name text not null,
  target_value numeric default 0, current_value numeric default 0, deadline date, notes text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.offers (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, operator text, country text, commission text, affiliate_link text,
  offer_type text check (offer_type in ('CPA','RevShare','Híbrido')), status text default 'Ativa',
  generated_revenue numeric default 0, notes text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.campaign_creatives (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade, creative_id uuid not null references public.creatives(id) on delete cascade,
  created_at timestamptz default now(), unique(campaign_id, creative_id)
);
create table if not exists public.campaign_pages (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade, page_id uuid not null references public.operation_pages(id) on delete cascade,
  created_at timestamptz default now(), unique(campaign_id, page_id)
);
create table if not exists public.campaign_offers (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade, offer_id uuid not null references public.offers(id) on delete cascade,
  created_at timestamptz default now(), unique(campaign_id, offer_id)
);
create table if not exists public.campaign_budgets (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  daily_budget numeric default 0, total_budget numeric default 0, spent numeric default 0, target_cpa numeric default 0,
  target_roi numeric default 0, projected_spend numeric default 0, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.campaign_tests (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade, creative_id uuid references public.creatives(id) on delete set null,
  page_id uuid references public.operation_pages(id) on delete set null, offer_id uuid references public.offers(id) on delete set null,
  start_date date default current_date, end_date date, spend numeric default 0, cpa numeric default 0, roi numeric default 0,
  status text default 'Em teste', created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.spy_sources (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, source_type text not null, source_url text not null, status text default 'active',
  last_processed_at timestamptz, notes text, created_at timestamptz default now(), updated_at timestamptz default now(),
  unique(user_id, source_url)
);
create table if not exists public.creative_folders (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, folder_type text not null, drive_url text not null, drive_folder_id text,
  status text default 'active', last_processed_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now(),
  unique(user_id, drive_url)
);
create table if not exists public.creative_assets (
  id uuid primary key default uuid_generate_v4(), user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.creative_folders(id) on delete set null, drive_file_id text not null, file_name text not null,
  file_type text, drive_url text, preview_url text, thumbnail_url text, origin_folder text, category text,
  country text, niche text, status text, notes text, imported_at timestamptz default now(),
  created_at timestamptz default now(), updated_at timestamptz default now(), unique(user_id, drive_file_id)
);
alter table public.campaigns add column if not exists objective text;
alter table public.campaigns add column if not exists pixel_id text;
alter table public.campaigns add column if not exists ad_account_id text;
alter table public.campaigns add column if not exists campaign_type text;
alter table public.campaigns add column if not exists total_budget numeric default 0;
alter table public.campaigns add column if not exists spent_amount numeric default 0;
alter table public.campaigns add column if not exists creative_ids text[] default array[]::text[];
alter table public.campaigns add column if not exists page_id text;
alter table public.campaigns add column if not exists offer_id text;
alter table public.financial_records add column if not exists currency text not null default 'BRL';
alter table public.financial_records add column if not exists ads_total numeric default 0;
alter table public.financial_records add column if not exists opened_link integer default 0;
alter table public.financial_records add column if not exists registrations integer default 0;
alter table public.financial_records add column if not exists ftd integer default 0;
alter table public.financial_records add column if not exists deposits numeric default 0;
alter table public.financial_records add column if not exists withdrawals numeric default 0;
alter table public.financial_records add column if not exists gross_revenue numeric default 0;
alter table public.financial_records add column if not exists tools_cost numeric default 0;
alter table public.financial_records add column if not exists total_commission numeric default 0;
alter table public.integrations add column if not exists api_url text;
alter table public.integrations add column if not exists affiliate_id text;
alter table public.integrations add column if not exists subid_param text;

alter table public.users enable row level security;
alter table public.campaigns enable row level security;
alter table public.creatives enable row level security;
alter table public.spy_ads enable row level security;
alter table public.daily_metrics enable row level security;
alter table public.financial_records enable row level security;
alter table public.dds_logs enable row level security;
alter table public.spy_items enable row level security;
alter table public.drive_creatives enable row level security;
alter table public.operation_pages enable row level security;
alter table public.influencers enable row level security;
alter table public.influencer_contacts enable row level security;
alter table public.operation_budgets enable row level security;
alter table public.integrations enable row level security;
alter table public.integration_sync_logs enable row level security;
alter table public.meta_ads_metrics enable row level security;
alter table public.workspace_boards enable row level security;
alter table public.workspace_columns enable row level security;
alter table public.workspace_cards enable row level security;
alter table public.workspace_checklists enable row level security;
alter table public.workspace_notes enable row level security;
alter table public.workspace_goals enable row level security;
alter table public.offers enable row level security;
alter table public.campaign_creatives enable row level security;
alter table public.campaign_pages enable row level security;
alter table public.campaign_offers enable row level security;
alter table public.campaign_budgets enable row level security;
alter table public.campaign_tests enable row level security;
alter table public.spy_sources enable row level security;
alter table public.creative_folders enable row level security;
alter table public.creative_assets enable row level security;

do $$
declare t text;
begin
  foreach t in array array['users','campaigns','creatives','spy_ads','daily_metrics','financial_records','dds_logs','spy_items','drive_creatives','operation_pages','influencers','influencer_contacts','operation_budgets','integrations','integration_sync_logs','meta_ads_metrics','workspace_boards','workspace_columns','workspace_cards','workspace_checklists','workspace_notes','workspace_goals','offers','campaign_creatives','campaign_pages','campaign_offers','campaign_budgets','campaign_tests','spy_sources','creative_folders','creative_assets']
  loop
    execute format('drop policy if exists "own_data" on public.%I', t);
    execute format('create policy "own_data" on public.%I for all using (auth.uid() = %s) with check (auth.uid() = %s)', t,
      case when t = 'users' then 'id' else 'user_id' end,
      case when t = 'users' then 'id' else 'user_id' end);
  end loop;
end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, full_name, role, must_change_password)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Novo usuário'), coalesce(new.raw_user_meta_data->>'role', 'user'), coalesce((new.raw_user_meta_data->>'role') = 'admin', false));
  insert into public.operation_budgets (user_id, amount, currency, notes) values (new.id, 500, 'BRL', 'investimento inicial da operação');
  insert into public.spy_sources (user_id, name, source_type, source_url, notes)
  values (new.id, 'SPY IGAMING CHILE', 'google_docs', 'https://docs.google.com/document/d/1rWTk54TMAvXxBmtcX19LYx_Vcoe-FP2voB_Y9Riisns/edit?tab=t.0', 'Documento SPY principal');
  insert into public.creative_folders (user_id, name, folder_type, drive_url, drive_folder_id)
  values
    (new.id, 'Drive - Criativos Prontos', 'pronto', 'https://drive.google.com/drive/folders/1ik_S2JepbqR-MdNVbtytF0SPV8POtbGh?usp=sharing', '1ik_S2JepbqR-MdNVbtytF0SPV8POtbGh'),
    (new.id, 'Drive - Criativos Para Modelar', 'para_modelar', 'https://drive.google.com/drive/folders/1oJ5Dgs63qLlCUjYvxq-sg0-_YUOA6i9c', '1oJ5Dgs63qLlCUjYvxq-sg0-_YUOA6i9c');
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.claim_existing_spy_and_creative_data() returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_user_role text;
  spy_items_count integer;
  spy_sources_count integer;
  creative_assets_count integer;
  drive_creatives_count integer;
  creative_folders_count integer;
begin
  if current_user_id is null then
    raise exception 'Usuário autenticado obrigatório.';
  end if;

  select role into current_user_role from public.users where id = current_user_id;
  if coalesce(current_user_role, '') <> 'admin' then
    raise exception 'Apenas administradores podem vincular dados existentes.';
  end if;

  update public.spy_items set user_id = current_user_id where user_id <> current_user_id;
  get diagnostics spy_items_count = row_count;
  update public.spy_sources set user_id = current_user_id where user_id <> current_user_id;
  get diagnostics spy_sources_count = row_count;
  update public.creative_assets set user_id = current_user_id where user_id <> current_user_id;
  get diagnostics creative_assets_count = row_count;
  update public.drive_creatives set user_id = current_user_id where user_id <> current_user_id;
  get diagnostics drive_creatives_count = row_count;
  update public.creative_folders set user_id = current_user_id where user_id <> current_user_id;
  get diagnostics creative_folders_count = row_count;

  return jsonb_build_object(
    'spy_items', spy_items_count,
    'spy_sources', spy_sources_count,
    'creative_assets', creative_assets_count,
    'drive_creatives', drive_creatives_count,
    'creative_folders', creative_folders_count
  );
end;
$$;
revoke all on function public.claim_existing_spy_and_creative_data() from public;
grant execute on function public.claim_existing_spy_and_creative_data() to authenticated;
