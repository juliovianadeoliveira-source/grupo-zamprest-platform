alter table public.zp_ordens_servico add constraint zp_ordens_id_empresa_unique unique (id,empresa_id);
alter table public.zp_agenda add column ordem_id uuid;
alter table public.zp_agenda add constraint zp_agenda_ordem_unique unique (ordem_id);
alter table public.zp_agenda add constraint zp_agenda_ordem_empresa_fk foreign key (ordem_id,empresa_id) references public.zp_ordens_servico(id,empresa_id) on delete cascade;
create function public.zp_sincronizar_ordem_agenda() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.agendado_em is null or new.situacao='cancelada' then
   delete from public.zp_agenda where ordem_id=new.id and empresa_id=new.empresa_id;
 else
   insert into public.zp_agenda(empresa_id,ordem_id,titulo,inicio,observacoes)
   values(new.empresa_id,new.id,left('Visita: '||new.descricao,160),new.agendado_em,
     concat_ws(E'\n',nullif('Técnico: '||new.tecnico,'Técnico: '),nullif('Endereço: '||new.endereco,'Endereço: '),nullif('Referência: '||new.referencia,'Referência: '),nullif('Localização: '||new.localizacao,'Localização: '),'Situação: '||new.situacao))
   on conflict (ordem_id) do update set titulo=excluded.titulo,inicio=excluded.inicio,observacoes=excluded.observacoes;
 end if;
 return new;
end $$;
revoke all on function public.zp_sincronizar_ordem_agenda() from public,anon,authenticated;
create trigger zp_ordem_agenda_automatico after insert or update of agendado_em,descricao,tecnico,endereco,referencia,localizacao,situacao on public.zp_ordens_servico for each row execute function public.zp_sincronizar_ordem_agenda();