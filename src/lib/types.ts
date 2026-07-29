/**
 * Tipos que reflejan el esquema de la base (ver /supabase/schema.sql).
 * Los mantenemos a mano por ahora; mas adelante se pueden generar con
 * `supabase gen types typescript`.
 */

export type TournamentStatus = "draft" | "active" | "finished" | "cancelled";
export type MatchdayStatus = "draft" | "completed" | "cancelled";

export type Player = {
  id: string;
  display_name: string;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Tournament = {
  id: string;
  name: string;
  description: string | null;
  status: TournamentStatus;
  start_date: string | null;
  end_date: string | null;
  points_per_win: number;
  points_per_loss: number;
  minimum_points_per_matchday: number;
  winner_player_id: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Matchday = {
  id: string;
  tournament_id: string;
  number: number;
  played_at: string | null;
  status: MatchdayStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MatchdayResult = {
  id: string;
  matchday_id: string;
  player_id: string;
  matches_won: number;
  matches_lost: number;
  created_at: string;
  updated_at: string;
};

/** Vista tournament_standings */
export type Standing = {
  tournament_id: string;
  player_id: string;
  player_name: string;
  position: number;
  matchdays_played: number;
  matches_won: number;
  matches_lost: number;
  total_matches: number;
  total_points: number;
  average_points: number | null;
  win_percentage: number | null;
  attendance_percentage: number | null;
};

/** Vista tournament_summary */
export type TournamentSummary = {
  tournament_id: string;
  tournament_name: string;
  status: TournamentStatus;
  start_date: string | null;
  end_date: string | null;
  closed_at: string | null;
  winner_player_id: string | null;
  winner_name: string | null;
  completed_matchdays: number;
  participant_count: number;
  total_matches_registered: number;
  leader_player_id: string | null;
  leader_name: string | null;
  leader_points: number | null;
};

/** Vista matchday_results_with_points */
export type MatchdayResultWithPoints = {
  tournament_id: string;
  tournament_name: string;
  matchday_id: string;
  matchday_number: number;
  played_at: string | null;
  matchday_status: MatchdayStatus;
  player_id: string;
  player_name: string;
  matches_won: number;
  matches_lost: number;
  total_matches: number;
  points: number;
};
