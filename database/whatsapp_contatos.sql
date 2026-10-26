create table public.zp_whatsapp_contatos (
 id uuid primary key default gen_random_uuid(),
 empresa_id uuid not null references public.zp_empresas(id) on delete cascade,
 slot smallint not null check (slot between 1 and 4),
 jid text not null check (length(jid) between 1 and 100),
 nome text not null default '', telefone text not null default '',
 atualizado_em timestamptz not null default now(),
 unique (empresa_id,slot,jid)
);
create index zp_whatsapp_contatos_empresa on public.zp_whatsapp_contatos(empresa_id,slot);
alter table public.zp_whatsapp_contatos enable row level security;
revoke all on public.zp_whatsapp_contatos from anon, authenticated;
grant select, insert, update, delete on public.zp_whatsapp_contatos to authenticated;
create policy zp_whatsapp_contatos_owner on public.zp_whatsapp_contatos for all to authenticated
using (exists (select 1 from public.zp_empresas e where e.id=empresa_id and e.owner_id=(select auth.uid())))
with check (exists (select 1 from public.zp_empresas e where e.id=empresa_id and e.owner_id=(select auth.uid())));