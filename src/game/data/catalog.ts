import {
  FIRST_CHANNEL_MILESTONE,
  HELPERS,
  MILESTONES,
  TRENDS,
  UPGRADES,
} from './progression';
import { MOMENT_TEMPLATES, STARTER_STREAM_IDS, STREAMS } from './streams';

export const GAME_CATALOG = {
  streams: STREAMS,
  starterStreamIds: STARTER_STREAM_IDS,
  moments: MOMENT_TEMPLATES,
  upgrades: UPGRADES,
  helpers: HELPERS,
  trends: TRENDS,
  milestones: MILESTONES,
} as const;

/** Fail early when content is mislinked so scenes and simulation stay data-driven. */
export function validateGameCatalog(): void {
  assertUniqueIds('stream', GAME_CATALOG.streams.map((item) => item.id));
  assertUniqueIds('moment template', GAME_CATALOG.moments.map((item) => item.id));
  assertUniqueIds('upgrade', GAME_CATALOG.upgrades.map((item) => item.id));
  assertUniqueIds('helper', GAME_CATALOG.helpers.map((item) => item.id));
  assertUniqueIds('trend', GAME_CATALOG.trends.map((item) => item.id));
  assertUniqueIds('milestone', GAME_CATALOG.milestones.map((item) => item.id));

  const streamIds = new Set(GAME_CATALOG.streams.map((stream) => stream.id));
  const templatesByStream = new Set(GAME_CATALOG.moments.map((template) => template.streamId));
  for (const stream of GAME_CATALOG.streams) {
    if (!templatesByStream.has(stream.id)) {
      throw new Error(`Stream ${stream.id} has no moment templates.`);
    }
    if (
      stream.pace.minimumMomentIntervalSeconds <= 0 ||
      stream.pace.maximumMomentIntervalSeconds < stream.pace.minimumMomentIntervalSeconds
    ) {
      throw new Error(`Stream ${stream.id} has invalid moment pacing.`);
    }
  }

  for (const template of GAME_CATALOG.moments) {
    if (!streamIds.has(template.streamId)) {
      throw new Error(`Moment template ${template.id} references an unknown stream.`);
    }
    if (template.appearanceWeight <= 0 || template.idealClipDurationSeconds <= 0) {
      throw new Error(`Moment template ${template.id} has invalid tuning values.`);
    }
  }

  for (const streamId of GAME_CATALOG.starterStreamIds) {
    if (!streamIds.has(streamId)) {
      throw new Error(`Starter stream ${streamId} is not in the stream catalog.`);
    }
  }
  for (const milestone of GAME_CATALOG.milestones) {
    if (milestone.reward.kind === 'unlock-stream' && !streamIds.has(milestone.reward.streamId)) {
      throw new Error(`Milestone ${milestone.id} unlocks an unknown stream.`);
    }
  }
}

function assertUniqueIds(kind: string, ids: readonly string[]): void {
  if (new Set(ids).size !== ids.length) {
    throw new Error(`The ${kind} catalog contains duplicate IDs.`);
  }
}

validateGameCatalog();
