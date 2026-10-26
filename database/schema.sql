-- Base inicial: empresas do proprietário, clientes e agenda.
-- Execute apenas em um projeto Supabase escolhido para o Grupo Zamprest.
begin;
create table public.zp_empresas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  nome text not null check (length(trim(nome)) between 1 and 120),
  created_at timestamptz not null default now()
);
create table public.zp_clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.zp_empresas(id) on delete cascade,
  nome text not null check (length(trim(nome)) between 1 and 120),
  telefone text not null default '', email text not null default '',
  observacoes text not null default '', created_at timestamptz not null default now()
);
create table public.zp_agenda (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.zp_empresas(id) on delete cascade,
  titulo text not null check (length(trim(titulo)) between 1 and 160),
  inicio timestamptz not null, observacoes text not null default '',
  created_at timestamptz not null default now()
);
create index zp_empresas_owner_idx on public.zp_empresas(owner_id);
create index zp_clientes_empresa_idx on public.zp_clientes(empresa_id);
create index zp_agenda_empresa_inicio_idx on public.zp_agenda(empresa_id, inicio);
alter table public.zp_empresas enable row level security;
alter table public.zp_clientes enable row level security;
alter table public.zp_agenda enable row level security;
revoke all on public.zp_empresas, public.zp_clientes, public.zp_agenda from anon, authenticated;
grant select, insert, update, delete on public.zp_empresas, public.zp_clientes, public.zp_agenda to authenticated;
create policy zp_empresas_owner on public.zp_empresas for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy zp_clientes_owner on public.zp_clientes for all to authenticated
  using (exists (select 1 from public.zp_empresas e where e.id = empresa_id and e.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.zp_empresas e where e.id = empresa_id and e.owner_id = (select auth.uid())));
create policy zp_agenda_owner on public.zp_agenda for all to authenticated
  using (exists (select 1 from public.zp_empresas e where e.id = empresa_id and e.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.zp_empresas e where e.id = empresa_id and e.owner_id = (select auth.uid())));
commit;
