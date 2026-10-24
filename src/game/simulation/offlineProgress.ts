import { seconds, type EpochMilliseconds, type GameState } from '../domain/types';
import { advanceGameSimulation } from './advanceGame';

export const MAX_OFFLINE_PROGRESS_SECONDS = seconds(8 * 60 * 60);
export const MINIMUM_RECAP_SECONDS = seconds(10);

export interface OfflineProgressRecap {
  readonly elapsedSeconds: number;
  readonly viewsEarned: number;
}

export interface OfflineProgressResult {
  readonly state: GameState;
  readonly recap: OfflineProgressRecap | null;
}

export function resumeGameAfterOffline(previousState: GameState, now: EpochMilliseconds): OfflineProgressResult {
  const elapsedWallSeconds = Math.max(0, (Number(now) - previousState.lastActiveAt) / 1000);
  const elapsedSeconds = Math.min(elapsedWallSeconds, MAX_OFFLINE_PROGRESS_SECONDS);
  const progressed = advanceGameSimulation(previousState, seconds(elapsedSeconds), now);
  const viewsEarned = Math.max(0, progressed.totalViewsEarned - previousState.totalViewsEarned);
  const recap = elapsedSeconds < MINIMUM_RECAP_SECONDS || viewsEarned === 0
    ? null
    : { elapsedSeconds, viewsEarned };
  return { state: progressed, recap };
}
