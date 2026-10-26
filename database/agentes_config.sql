create table public.zp_agentes (
 id uuid primary key default gen_random_uuid(),
 empresa_id uuid not null unique references public.zp_empresas(id) on delete cascade,
 nome text not null default 'Ana' check(length(btrim(nome)) between 1 and 80),
 saudacao text not null default 'Olá! Eu sou a Ana, assistente virtual. Como posso ajudar você hoje?' check(length(saudacao)<=2000),
 tom text not null default 'Natural, educado e objetivo' check(length(tom)<=500),
 instrucoes text not null default '' check(length(instrucoes)<=5000),
 atualizado_em timestamptz not null default now()
);
alter table public.zp_agentes enable row level security;
revoke all on public.zp_agentes from anon,authenticated;
grant select,insert,update,delete on public.zp_agentes to authenticated;
create policy zp_agentes_empresa on public.zp_agentes for all to authenticated
using (exists (select 1 from public.zp_empresas e where e.id=empresa_id and e.owner_id=(select auth.uid())))
with check (exists (select 1 from public.zp_empresas e where e.id=empresa_id and e.owner_id=(select auth.uid())));