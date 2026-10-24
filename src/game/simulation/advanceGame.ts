import {
  epochMilliseconds,
  type EpochMilliseconds,
  type GameState,
  type Seconds,
} from '../domain/types';
import { advanceStreamerChannel } from './streamerInteractions';

/** Active and offline growth share this path so the channel earns consistently. */
export function advanceGameSimulation(
  initialState: GameState,
  elapsed: Seconds,
  now: EpochMilliseconds = epochMilliseconds(Date.now()),
): GameState {
  const advanced = advanceStreamerChannel(initialState, elapsed);
  return { ...advanced, lastActiveAt: now };
}
