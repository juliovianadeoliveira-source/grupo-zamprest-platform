-- Base de relacionamento: criação de usuários e bloqueio efetivo ainda não implementados.
create table public.zp_revenda_vinculos (
 id uuid primary key default gen_random_uuid(),
 parent_user_id uuid not null references auth.users(id) on delete restrict,
 child_user_id uuid not null unique references auth.users(id) on delete restrict,
 estado text not null default 'ativo' check (estado in ('ativo','bloqueado')),
 created_at timestamptz not null default now(),
 check (parent_user_id <> child_user_id)
);
create index zp_revenda_vinculos_parent_idx on public.zp_revenda_vinculos(parent_user_id);
alter table public.zp_revenda_vinculos enable row level security;
revoke all on public.zp_revenda_vinculos from public, anon, authenticated;
grant select on public.zp_revenda_vinculos to authenticated;
create policy zp_revenda_vinculos_visualizar on public.zp_revenda_vinculos for select to authenticated using (parent_user_id=(select auth.uid()) or child_user_id=(select auth.uid()));
