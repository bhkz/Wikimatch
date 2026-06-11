-- ============================================================================
-- atlas.apply_resolution — application ATOMIQUE d'une résolution (spec §18.2).
-- Tout passe ou rien : resolution + hex_events + hexes + nations + game_over.
-- Advisory lock transactionnel : deux workers ne peuvent pas résoudre en même
-- temps. Idempotence : PK resolutions(match_id) → si déjà résolue, no-op (false).
-- Appelée uniquement par le worker (service role).
-- ============================================================================

create or replace function atlas.apply_resolution(
  p_resolution jsonb,   -- ligne atlas.resolutions
  p_events jsonb,       -- tableau de hex_events (ordonné)
  p_nation_updates jsonb, -- [{code, status, eliminated_by_match}] (peut être vide)
  p_game_over boolean default false
) returns boolean
language plpgsql
security definer
set search_path = atlas, public
as $$
declare
  v_match_id int := (p_resolution->>'match_id')::int;
  v_ev jsonb;
  v_nu jsonb;
begin
  -- Sérialise toutes les résolutions (clé arbitraire stable du projet).
  perform pg_advisory_xact_lock(20260611);

  -- Idempotence : déjà résolue → no-op.
  if exists (select 1 from atlas.resolutions where match_id = v_match_id) then
    return false;
  end if;

  insert into atlas.resolutions
    (match_id, winner, loser, is_draw, goal_diff, base_gain, m_overext,
     final_gain, hexes_taken, inherited_hexes, narrative, engine_version)
  values
    (v_match_id,
     p_resolution->>'winner',
     p_resolution->>'loser',
     (p_resolution->>'is_draw')::bool,
     (p_resolution->>'goal_diff')::int,
     (p_resolution->>'base_gain')::int,
     (p_resolution->>'m_overext')::numeric,
     (p_resolution->>'final_gain')::int,
     (select coalesce(array_agg(x::int), '{}') from jsonb_array_elements_text(p_resolution->'hexes_taken') x),
     (select coalesce(array_agg(x::int), '{}') from jsonb_array_elements_text(p_resolution->'inherited_hexes') x),
     p_resolution->>'narrative',
     p_resolution->>'engine_version');

  for v_ev in select * from jsonb_array_elements(p_events) loop
    insert into atlas.hex_events
      (hex_id, match_id, type, from_owner, to_owner, from_state, to_state, narrative)
    values
      ((v_ev->>'hex_id')::int,
       (v_ev->>'match_id')::int,
       v_ev->>'type',
       v_ev->>'from_owner',
       v_ev->>'to_owner',
       v_ev->>'from_state',
       v_ev->>'to_state',
       v_ev->>'narrative');

    -- L'event est LA source de vérité : l'état hexes en découle mécaniquement.
    update atlas.hexes
       set owner = v_ev->>'to_owner',
           state = v_ev->>'to_state',
           conquered = case
             when v_ev->>'type' in ('captured','inherited','neutral_claimed') then true
             else conquered
           end
     where id = (v_ev->>'hex_id')::int;
  end loop;

  for v_nu in select * from jsonb_array_elements(p_nation_updates) loop
    update atlas.nations
       set status = v_nu->>'status',
           eliminated_at = case when v_nu->>'status' = 'eliminated' then now() else eliminated_at end,
           eliminated_by_match = case
             when v_nu->>'status' = 'eliminated' then (v_nu->>'eliminated_by_match')::int
             else eliminated_by_match
           end
     where code = v_nu->>'code';
  end loop;

  if p_game_over then
    insert into atlas.game_config (key, value) values ('game_over', 'true')
    on conflict (key) do update set value = 'true', updated_at = now();
  end if;

  return true;
end;
$$;

revoke execute on function atlas.apply_resolution(jsonb, jsonb, jsonb, boolean) from public, anon, authenticated;
grant execute on function atlas.apply_resolution(jsonb, jsonb, jsonb, boolean) to service_role;
