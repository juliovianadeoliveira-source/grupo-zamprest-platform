create table public.zp_revendas (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 nome text not null check (length(btrim(nome)) between 1 and 120), telefone text not null default '',
 inicio date not null default current_date, vencimento date not null,
 valor numeric(12,2) not null default 0 check (valor >= 0),
 pagamento text not null default 'pendente' check (pagamento in ('pendente','pago')),
 created_at timestamptz not null default now()
);
create index zp_revendas_owner on public.zp_revendas(owner_id);
alter table public.zp_revendas enable row level security;
revoke all on public.zp_revendas from anon, authenticated;
grant select, insert, update, delete on public.zp_revendas to authenticated;
create policy zp_revendas_owner on public.zp_revendas for all to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
