alter table public.zp_clientes add constraint zp_clientes_id_empresa_unique unique (id,empresa_id);
create table public.zp_ordens_servico (
 id uuid primary key default gen_random_uuid(),
 empresa_id uuid not null references public.zp_empresas(id) on delete cascade,
 cliente_id uuid,
 descricao text not null check(length(btrim(descricao)) between 1 and 3000),
 endereco text not null default '' check(length(endereco)<=500),
 referencia text not null default '' check(length(referencia)<=500),
 localizacao text not null default '' check(length(localizacao)<=1000),
 tecnico text not null default '' check(length(tecnico)<=120),
 agendado_em timestamptz,
 valor numeric(12,2) not null default 0 check(valor>=0),
 situacao text not null default 'aberta' check(situacao in ('aberta','agendada','em_andamento','concluida','cancelada')),
 created_at timestamptz not null default now(),
 foreign key (cliente_id,empresa_id) references public.zp_clientes(id,empresa_id)
);
create index zp_ordens_servico_empresa_created on public.zp_ordens_servico(empresa_id,created_at desc);
alter table public.zp_ordens_servico enable row level security;
revoke all on public.zp_ordens_servico from anon, authenticated;
grant select,insert,update,delete on public.zp_ordens_servico to authenticated;
create policy zp_ordens_servico_empresa on public.zp_ordens_servico for all to authenticated
using (exists (select 1 from public.zp_empresas e where e.id=empresa_id and e.owner_id=(select auth.uid())))
with check (exists (select 1 from public.zp_empresas e where e.id=empresa_id and e.owner_id=(select auth.uid())));