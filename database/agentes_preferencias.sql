alter table public.zp_agentes add column preferencias jsonb not null default '{}'::jsonb check (jsonb_typeof(preferencias) = 'object');
