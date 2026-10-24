import { GAME_CATALOG } from '../data/catalog';
import { GIFT_ITEMS, STREAM_SCENES } from '../data/interactionCatalog';
import {
  epochMilliseconds,
  type Clip,
  type GameState,
  type SaveData,
} from '../domain/types';

export const SAVE_STORAGE_KEY = 'gorl-reactor.save';
export const SAVE_SCHEMA_VERSION = 2;

export type SaveLoadResult =
  | { readonly status: 'new-game' }
  | { readonly status: 'loaded'; readonly state: GameState; readonly savedAt: number }
  | { readonly status: 'invalid'; readonly reason: 'malformed' | 'unsupported-version' }
  | { readonly status: 'unavailable' };

export function loadGameState(storage?: Storage): SaveLoadResult {
  const saveStorage = resolveStorage(storage);
  if (!saveStorage) {
    return { status: 'unavailable' };
  }

  try {
    const serialized = saveStorage.getItem(SAVE_STORAGE_KEY);
    if (!serialized) {
      return { status: 'new-game' };
    }
    const parsed: unknown = JSON.parse(serialized);
    if (isRecord(parsed) && parsed.schemaVersion === 1 && isRecord(parsed.state)) {
      const legacyState = parsed.state;
      const migrated = {
        ...parsed,
        schemaVersion: SAVE_SCHEMA_VERSION,
        state: {
          ...legacyState,
          currentSceneId: STREAM_SCENES[0]!.id,
          streamerAttributes: { comfort: 50, style: 50, energy: 50, mood: 50 },
          deliveredItemIds: [],
        },
      };
      if (isSaveData(migrated)) {
        return { status: 'loaded', state: migrated.state, savedAt: migrated.savedAt };
      }
    }
    if (isRecord(parsed) && typeof parsed.schemaVersion === 'number' && parsed.schemaVersion !== SAVE_SCHEMA_VERSION) {
      return { status: 'invalid', reason: 'unsupported-version' };
    }
    if (!isSaveData(parsed)) {
      return { status: 'invalid', reason: 'malformed' };
    }
    return { status: 'loaded', state: parsed.state, savedAt: parsed.savedAt };
  } catch {
    return { status: 'invalid', reason: 'malformed' };
  }
}

export function saveGameState(
  state: GameState,
  savedAt = epochMilliseconds(Date.now()),
  storage?: Storage,
): boolean {
  const saveStorage = resolveStorage(storage);
  if (!saveStorage) {
    return false;
  }

  const save: SaveData = {
    format: 'gorl-reactor-save',
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAt,
    state,
  };
  try {
    saveStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

function resolveStorage(storage?: Storage): Storage | null {
  if (storage) {
    return storage;
  }
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isSaveData(value: unknown): value is SaveData {
  return (
    isRecord(value) &&
    value.format === 'gorl-reactor-save' &&
    value.schemaVersion === SAVE_SCHEMA_VERSION &&
    isNonNegativeNumber(value.savedAt) &&
    isGameState(value.state)
  );
}

function isGameState(value: unknown): value is GameState {
  if (!isRecord(value)) {
    return false;
  }

  const streamIds = new Set<string>(GAME_CATALOG.streams.map((stream) => stream.id));
  const upgradeIds = new Set<string>(GAME_CATALOG.upgrades.map((upgrade) => upgrade.id));
  const helperIds = new Set<string>(GAME_CATALOG.helpers.map((helper) => helper.id));
  const milestoneIds = new Set<string>(GAME_CATALOG.milestones.map((milestone) => milestone.id));
  const trendIds = new Set<string>(GAME_CATALOG.trends.map((trend) => trend.id));
  const sceneIds = new Set<string>(STREAM_SCENES.map((scene) => scene.id));
  const itemIds = new Set<string>(GIFT_ITEMS.map((item) => item.id));

  return (
    isString(value.currentSceneId) && sceneIds.has(value.currentSceneId) &&
    isStreamerAttributes(value.streamerAttributes) &&
    isKnownStringArray(value.deliveredItemIds, itemIds) &&
    isString(value.selectedStreamId) && streamIds.has(value.selectedStreamId) &&
    isMomentSelection(value.momentSelection) &&
    isNonNegativeNumber(value.views) &&
    isNonNegativeNumber(value.totalViewsEarned) &&
    isNonNegativeNumber(value.fans) &&
    isSessionRecord(value.streamSessions, streamIds) &&
    isClipRecord(value.clips, streamIds) &&
    isStringArray(value.publishingQueue) &&
    value.publishingQueue.every((id) => isRecord(value.clips) && isQueuedClip(value.clips[id])) &&
    isPositiveInteger(value.publishingCapacity) &&
    isKnownStringArray(value.unlockedStreamIds, streamIds) &&
    isKnownStringArray(value.claimedMilestoneIds, milestoneIds) &&
    isKnownStringArray(value.purchasedUpgradeIds, upgradeIds) &&
    isKnownStringArray(value.unlockedHelperIds, helperIds) &&
    (value.activeTrendId === null || (isString(value.activeTrendId) && trendIds.has(value.activeTrendId))) &&
    isNonNegativeNumber(value.lastActiveAt)
  );
}

function isStreamerAttributes(value: unknown): boolean {
  return isRecord(value) && ['comfort', 'style', 'energy', 'mood'].every((key) =>
    isNonNegativeNumber(value[key]) && (value[key] as number) <= 100,
  );
}

function isMomentSelection(value: unknown): boolean {
  return value === null || (
    isRecord(value) &&
    isString(value.momentId) &&
    isRecord(value.trim) &&
    isNonNegativeNumber(value.trim.startSeconds) &&
    isNonNegativeNumber(value.trim.endSeconds) &&
    value.trim.endSeconds > value.trim.startSeconds
  );
}

function isSessionRecord(value: unknown, streamIds: ReadonlySet<string>): boolean {
  return isRecord(value) && Object.values(value).every((session) =>
    isRecord(session) &&
    isString(session.streamId) && streamIds.has(session.streamId) &&
    isNonNegativeNumber(session.seed) &&
    isNonNegativeNumber(session.elapsedSeconds) &&
    isNonNegativeNumber(session.nextMomentAtSeconds) &&
    isNonNegativeNumber(session.nextSequence) &&
    Array.isArray(session.moments) && session.moments.every(isStreamMoment),
  );
}

function isStreamMoment(value: unknown): boolean {
  return isRecord(value) && isString(value.id) && isString(value.streamId) &&
    isString(value.templateId) && isNonNegativeNumber(value.occurredAtSeconds) &&
    isNonNegativeNumber(value.sequence);
}

function isClipRecord(value: unknown, streamIds: ReadonlySet<string>): boolean {
  return isRecord(value) && Object.values(value).every((clip) => isClip(clip, streamIds));
}

function isClip(value: unknown, streamIds: ReadonlySet<string>): value is Clip {
  return isRecord(value) &&
    isString(value.id) && isString(value.sourceMomentId) && isString(value.sourceTemplateId) &&
    isString(value.sourceStreamId) && streamIds.has(value.sourceStreamId) &&
    (value.creator === 'player' || value.creator === 'helper') &&
    (value.status === 'draft' || value.status === 'queued' || value.status === 'published') &&
    isRecord(value.trim) && isNonNegativeNumber(value.trim.startSeconds) &&
    isNonNegativeNumber(value.trim.endSeconds) && value.trim.endSeconds > value.trim.startSeconds &&
    isNonNegativeNumber(value.quality) && value.quality <= 100 &&
    isClipPerformance(value.performance) &&
    isNonNegativeNumber(value.views) && isNonNegativeNumber(value.publishedElapsedSeconds) &&
    isNonNegativeNumber(value.pendingViewFraction) && value.pendingViewFraction < 1 &&
    isNonNegativeNumber(value.createdAt) &&
    (value.publishedAt === null || isNonNegativeNumber(value.publishedAt));
}

function isClipPerformance(value: unknown): boolean {
  return isRecord(value) && isNonNegativeNumber(value.score) &&
    isNonNegativeNumber(value.initialViewsPerSecond) &&
    isNonNegativeNumber(value.tailViewsPerSecond) &&
    isNonNegativeNumber(value.audienceMatch) && value.audienceMatch <= 1 &&
    Array.isArray(value.reasons) && value.reasons.every((reason) =>
      isRecord(reason) && isString(reason.factor) && isString(reason.label) &&
      (reason.impact === 'boost' || reason.impact === 'steady' || reason.impact === 'weak'),
    );
}

function isQueuedClip(value: unknown): boolean {
  return isRecord(value) && value.status === 'queued';
}

function isKnownStringArray(value: unknown, knownIds: ReadonlySet<string>): boolean {
  return isStringArray(value) && value.every((id) => knownIds.has(id));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === 'number' && value > 0;
}
