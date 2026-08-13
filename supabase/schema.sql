-- =====================================================================
-- TORNEO DE TRUCO — Schema completo para Supabase (PostgreSQL)
-- =====================================================================
-- Pegar y ejecutar completo en: Supabase → SQL Editor → New query
-- Podés correrlo todo de una, o bloque por bloque si querés revisar
-- cada parte antes de seguir.
--
-- El usuario administrador NO se crea acá: se crea a mano desde
-- Supabase → Authentication → Users → Add user.
-- =====================================================================


-- =====================================================================
-- BLOQUE 1: TABLAS
-- =====================================================================

create table public.players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

comment on table public.players is 'Lista general de jugadores, persiste entre torneos.';

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'finished', 'cancelled')),
  start_date date,
  end_date date,
  points_per_win numeric(10,2) not null default 1,
  points_per_loss numeric(10,2) not null default 0,
  minimum_points_per_matchday numeric(10,2) not null default 0
    check (minimum_points_per_matchday >= 0),
  winner_player_id uuid references public.players(id) on delete restrict,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  closed_by uuid references auth.users(id) on delete set null,
  check (end_date is null or start_date is null or end_date >= start_date)
);

comment on table public.tournaments is 'Torneo general, con sus parámetros de puntaje.';

create table public.matchdays (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  number integer not null check (number > 0),
  played_at date,
  status text not null default 'draft'
    check (status in ('draft', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  unique (tournament_id, number)
);

comment on table public.matchdays is 'Jornada (juntada) dentro de un torneo.';

create table public.matchday_results (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references public.matchdays(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  matches_won integer not null default 0 check (matches_won >= 0),
  matches_lost integer not null default 0 check (matches_lost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  unique (matchday_id, player_id),
  check (matches_won + matches_lost > 0)
);

comment on table public.matchday_results is 'Resultado de un jugador en una jornada.';


-- =====================================================================
-- BLOQUE 2: RESTRICCIONES ADICIONALES E ÍNDICES
-- =====================================================================

-- Nombre de jugador único (sin importar mayúsculas ni espacios extra)
create unique index players_display_name_unique_idx
  on public.players (lower(trim(display_name)));

-- Un solo torneo activo a la vez, garantizado a nivel de base
create unique index tournaments_single_active_idx
  on public.tournaments (status)
  where status = 'active';

-- Índices de consulta frecuente
create index tournaments_status_idx on public.tournaments (status);
create index matchdays_tournament_id_idx on public.matchdays (tournament_id);
create index matchdays_status_idx on public.matchdays (status);
create index matchday_results_matchday_id_idx on public.matchday_results (matchday_id);
create index matchday_results_player_id_idx on public.matchday_results (player_id);


-- =====================================================================
-- BLOQUE 3: FUNCIONES Y TRIGGERS
-- =====================================================================

-- 3.1: updated_at / created_by / updated_by automáticos
create or replace function public.set_audit_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.created_by := coalesce(new.created_by, auth.uid());
    new.updated_at := now();
    new.updated_by := auth.uid();
  elsif tg_op = 'UPDATE' then
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_at := now();
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

create trigger players_audit
  before insert or update on public.players
  for each row execute function public.set_audit_fields();

create trigger tournaments_audit
  before insert or update on public.tournaments
  for each row execute function public.set_audit_fields();

create trigger matchdays_audit
  before insert or update on public.matchdays
  for each row execute function public.set_audit_fields();

create trigger matchday_results_audit
  before insert or update on public.matchday_results
  for each row execute function public.set_audit_fields();

-- 3.2: reglas de cierre / reapertura de torneo
create or replace function public.validate_tournament_status_change()
returns trigger
language plpgsql
as $$
begin
  -- Cierre del torneo
  if new.status = 'finished' and old.status is distinct from 'finished' then

    if not exists (
      select 1 from public.matchdays
      where tournament_id = new.id and status = 'completed'
    ) then
      raise exception 'No se puede cerrar un torneo sin jornadas completadas';
    end if;

    if new.winner_player_id is not null and not exists (
      select 1
      from public.matchday_results mr
      join public.matchdays m on m.id = mr.matchday_id
      where m.tournament_id = new.id and mr.player_id = new.winner_player_id
    ) then
      raise exception 'El ganador debe haber participado en el torneo';
    end if;

    new.closed_at := coalesce(new.closed_at, now());
    new.closed_by := coalesce(new.closed_by, auth.uid());
  end if;

  -- Reapertura del torneo
  if new.status = 'active' and old.status = 'finished' then

    if exists (
      select 1 from public.tournaments
      where status = 'active' and id <> new.id
    ) then
      raise exception 'Ya existe otro torneo activo. Cerralo antes de reabrir este.';
    end if;

    new.winner_player_id := null;
    new.closed_at := null;
    new.closed_by := null;
  end if;

  return new;
end;
$$;

create trigger tournaments_status_change
  before update on public.tournaments
  for each row execute function public.validate_tournament_status_change();


-- =====================================================================
-- BLOQUE 4: VISTAS
-- =====================================================================

-- 4.1: resultados de jornada con puntos ya calculados
create or replace view public.matchday_results_with_points
with (security_invoker = true) as
select
  t.id as tournament_id,
  t.name as tournament_name,
  m.id as matchday_id,
  m.number as matchday_number,
  m.played_at,
  m.status as matchday_status,
  p.id as player_id,
  p.display_name as player_name,
  mr.matches_won,
  mr.matches_lost,
  (mr.matches_won + mr.matches_lost) as total_matches,
  greatest(
    t.minimum_points_per_matchday,
    mr.matches_won * t.points_per_win + mr.matches_lost * t.points_per_loss
  ) as points,
  m.notes as matchday_notes
from public.matchday_results mr
join public.matchdays m on m.id = mr.matchday_id
join public.tournaments t on t.id = m.tournament_id
join public.players p on p.id = mr.player_id;

-- 4.2: tabla general / ranking del torneo (solo jornadas completed)
create or replace view public.tournament_standings
with (security_invoker = true) as
with completed_matchdays as (
  select tournament_id, count(*) as total_completed
  from public.matchdays
  where status = 'completed'
  group by tournament_id
),
player_points as (
  select
    m.tournament_id,
    mr.player_id,
    count(distinct m.id) as matchdays_played,
    sum(mr.matches_won) as matches_won,
    sum(mr.matches_lost) as matches_lost,
    sum(mr.matches_won + mr.matches_lost) as total_matches,
    sum(
      greatest(
        t.minimum_points_per_matchday,
        mr.matches_won * t.points_per_win + mr.matches_lost * t.points_per_loss
      )
    ) as total_points
  from public.matchday_results mr
  join public.matchdays m on m.id = mr.matchday_id and m.status = 'completed'
  join public.tournaments t on t.id = m.tournament_id
  group by m.tournament_id, mr.player_id
)
select
  pp.tournament_id,
  pp.player_id,
  p.display_name as player_name,
  row_number() over (
    partition by pp.tournament_id
    order by
      pp.total_points desc,
      pp.matches_won desc,
      case when pp.total_matches > 0
           then pp.matches_won::numeric / pp.total_matches
           else 0 end desc,
      pp.matchdays_played desc,
      p.display_name asc
  ) as position,
  pp.matchdays_played,
  pp.matches_won,
  pp.matches_lost,
  pp.total_matches,
  pp.total_points,
  round(pp.total_points / nullif(pp.matchdays_played, 0), 2) as average_points,
  round(100.0 * pp.matches_won / nullif(pp.total_matches, 0), 2) as win_percentage,
  round(100.0 * pp.matchdays_played / nullif(cm.total_completed, 0), 2) as attendance_percentage
from player_points pp
join public.players p on p.id = pp.player_id
join completed_matchdays cm on cm.tournament_id = pp.tournament_id;

-- 4.3: resumen para tarjetas / listado de torneos
create or replace view public.tournament_summary
with (security_invoker = true) as
select
  t.id as tournament_id,
  t.name as tournament_name,
  t.status,
  t.start_date,
  t.end_date,
  t.closed_at,
  t.winner_player_id,
  wp.display_name as winner_name,
  (select count(*) from public.matchdays m
     where m.tournament_id = t.id and m.status = 'completed') as completed_matchdays,
  (select count(distinct mr.player_id)
     from public.matchday_results mr
     join public.matchdays m on m.id = mr.matchday_id
     where m.tournament_id = t.id and m.status = 'completed') as participant_count,
  (select coalesce(sum(md_totals.max_matches), 0)
     from (
       select mr.matchday_id, max(mr.matches_won + mr.matches_lost) as max_matches
       from public.matchday_results mr
       join public.matchdays m on m.id = mr.matchday_id
       where m.tournament_id = t.id and m.status = 'completed'
       group by mr.matchday_id
     ) md_totals) as total_matches_registered,
  ts.player_id as leader_player_id,
  ts.player_name as leader_name,
  ts.total_points as leader_points,
  t.description
from public.tournaments t
left join public.players wp on wp.id = t.winner_player_id
left join public.tournament_standings ts
  on ts.tournament_id = t.id and ts.position = 1;


-- =====================================================================
-- BLOQUE 5: SEGURIDAD (RLS)
-- =====================================================================

alter table public.players enable row level security;
alter table public.tournaments enable row level security;
alter table public.matchdays enable row level security;
alter table public.matchday_results enable row level security;

-- Lectura pública (anon + authenticated)
create policy players_select_public on public.players
  for select using (true);
create policy tournaments_select_public on public.tournaments
  for select using (true);
create policy matchdays_select_public on public.matchdays
  for select using (true);
create policy matchday_results_select_public on public.matchday_results
  for select using (true);

-- Escritura solo para usuarios autenticados (el/los administrador/es)
create policy players_insert_auth on public.players
  for insert to authenticated with check (true);
create policy players_update_auth on public.players
  for update to authenticated using (true) with check (true);
create policy players_delete_auth on public.players
  for delete to authenticated using (true);

create policy tournaments_insert_auth on public.tournaments
  for insert to authenticated with check (true);
create policy tournaments_update_auth on public.tournaments
  for update to authenticated using (true) with check (true);
create policy tournaments_delete_auth on public.tournaments
  for delete to authenticated using (true);

create policy matchdays_insert_auth on public.matchdays
  for insert to authenticated with check (true);
create policy matchdays_update_auth on public.matchdays
  for update to authenticated using (true) with check (true);
create policy matchdays_delete_auth on public.matchdays
  for delete to authenticated using (true);

create policy matchday_results_insert_auth on public.matchday_results
  for insert to authenticated with check (true);
create policy matchday_results_update_auth on public.matchday_results
  for update to authenticated using (true) with check (true);
create policy matchday_results_delete_auth on public.matchday_results
  for delete to authenticated using (true);

-- Permisos de tabla (además de las políticas RLS)
grant usage on schema public to anon, authenticated;

grant select on
  public.players, public.tournaments, public.matchdays, public.matchday_results
  to anon, authenticated;

grant insert, update, delete on
  public.players, public.tournaments, public.matchdays, public.matchday_results
  to authenticated;

grant select on
  public.matchday_results_with_points, public.tournament_standings, public.tournament_summary
  to anon, authenticated;


-- =====================================================================
-- BLOQUE 6 (OPCIONAL): DATOS Y CONSULTAS DE PRUEBA
-- Descomentar y correr manualmente después de crear tu usuario admin
-- en Authentication → Users, para verificar que todo funciona.
-- =====================================================================

-- insert into public.players (display_name) values
--   ('Juan'), ('Pedro'), ('Lucía');

-- insert into public.tournaments (name, points_per_win, points_per_loss, minimum_points_per_matchday, status)
-- values ('Apertura 2026', 1, -0.5, 0.5, 'active');

-- insert into public.matchdays (tournament_id, number, status)
-- select id, 1, 'completed' from public.tournaments where name = 'Apertura 2026';

-- insert into public.matchday_results (matchday_id, player_id, matches_won, matches_lost)
-- select m.id, p.id, 4, 2
-- from public.matchdays m, public.players p
-- where m.number = 1 and p.display_name = 'Juan';

-- select * from public.matchday_results_with_points;
-- select * from public.tournament_standings;
-- select * from public.tournament_summary;
