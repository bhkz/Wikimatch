-- ============================================================================
-- atlas.apply_group_fracture — application atomique de la Grande Fracture
-- (fin de phase de groupes, spec §16.5).
-- ============================================================================

create or replace function atlas.apply_group_fracture(
  p_events jsonb,
  p_nation_updates jsonb
) returns int
language plpgsql
security definer
set search_path = atlas, public
as $$
declare
  v_ev jsonb;
  v_nu jsonb;
  v_count int := 0;
begin
  perform pg_advisory_xact_lock(20260612);

  if exists (
    select 1
    from atlas.ingest_state
    where key = 'group_stage_finalized'
      and coalesce((value->>'ok')::boolean, false) = true
  ) then
    return 0;
  end if;

  for v_ev in select * from jsonb_array_elements(p_events) loop
    insert into atlas.hex_events
      (hex_id, match_id, type, from_owner, to_owner, from_state, to_state, narrative)
    values
      ((v_ev->>'hex_id')::int,
       nullif(v_ev->>'match_id', '')::int,
       v_ev->>'type',
       v_ev->>'from_owner',
       v_ev->>'to_owner',
       v_ev->>'from_state',
       v_ev->>'to_state',
       v_ev->>'narrative');

    update atlas.hexes
       set owner = v_ev->>'to_owner',
           state = v_ev->>'to_state',
           conquered = case
             when v_ev->>'type' in ('captured','inherited','neutral_claimed') then true
             else conquered
           end
     where id = (v_ev->>'hex_id')::int;

    v_count := v_count + 1;
  end loop;

  for v_nu in select * from jsonb_array_elements(p_nation_updates) loop
    update atlas.nations
       set status = v_nu->>'status',
           eliminated_at = now(),
           eliminated_by_match = null
     where code = v_nu->>'code'
       and status <> 'eliminated';
  end loop;

  insert into atlas.ingest_state (key, value)
  values ('group_stage_finalized', jsonb_build_object('ok', true, 'at', now(), 'events', v_count))
  on conflict (key) do update set value = excluded.value;

  return v_count;
end;
$$;

revoke execute on function atlas.apply_group_fracture(jsonb, jsonb) from public, anon, authenticated;
grant execute on function atlas.apply_group_fracture(jsonb, jsonb) to service_role;
