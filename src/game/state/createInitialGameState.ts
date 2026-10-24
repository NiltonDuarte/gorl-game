import { STARTER_STREAM_IDS, STREAMS } from '../data/streams';
import { STREAM_SCENES } from '../data/interactionCatalog';
import {
  epochMilliseconds,
  fans,
  views,
  type EpochMilliseconds,
  type GameState,
  type StreamId,
} from '../domain/types';
import { createStreamSession } from '../simulation/momentTimeline';

export function createInitialGameState(
  startedAt: EpochMilliseconds = epochMilliseconds(Date.now()),
  worldSeed: number = Date.now(),
): GameState {
  const streamSessions = Object.fromEntries(
    STREAMS.map((stream) => [
      stream.id,
      createStreamSession(stream, seedForStream(worldSeed, stream.id)),
    ]),
  );

  return {
    currentSceneId: STREAM_SCENES[0]!.id,
    streamerAttributes: { comfort: 50, style: 50, energy: 50, mood: 50 },
    deliveredItemIds: [],
    selectedStreamId: STREAMS[0].id,
    momentSelection: null,
    views: views(50),
    totalViewsEarned: views(0),
    fans: fans(0),
    streamSessions,
    clips: {},
    publishingQueue: [],
    publishingCapacity: 1,
    unlockedStreamIds: STARTER_STREAM_IDS,
    claimedMilestoneIds: [],
    purchasedUpgradeIds: [],
    unlockedHelperIds: [],
    activeTrendId: null,
    lastActiveAt: startedAt,
  };
}

function seedForStream(worldSeed: number, id: StreamId): number {
  let seed = worldSeed >>> 0;
  for (let index = 0; index < id.length; index += 1) {
    seed = Math.imul(seed ^ id.charCodeAt(index), 0x45d9f3b);
  }
  return seed >>> 0;
}
