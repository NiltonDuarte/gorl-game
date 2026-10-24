import { GIFT_ITEMS, STREAM_SCENES } from '../data/interactionCatalog';
import { fans, views, type GameState, type ItemId, type SceneId, type StreamerAttribute } from '../domain/types';

export type InteractionResult =
  | { readonly ok: true; readonly state: GameState; readonly attribute: StreamerAttribute; readonly increase: number }
  | { readonly ok: false; readonly reason: 'already-there' | 'not-enough-views' | 'attribute-maxed' | 'unknown-scene' | 'unknown-item' };

export function moveStreamerToScene(state: GameState, targetSceneId: SceneId): InteractionResult {
  const scene = STREAM_SCENES.find((item) => item.id === targetSceneId);
  if (!scene) return { ok: false, reason: 'unknown-scene' };
  if (state.currentSceneId === targetSceneId) return { ok: false, reason: 'already-there' };
  const attributeResult = increaseAttribute(state, scene.attribute, scene.increase);
  if (attributeResult.increase === 0) return { ok: false, reason: 'attribute-maxed' };
  return {
    ok: true,
    state: {
      ...state,
      currentSceneId: targetSceneId,
      streamerAttributes: attributeResult.attributes,
    },
    attribute: scene.attribute,
    increase: attributeResult.increase,
  };
}

export function giveStreamerItem(state: GameState, targetItemId: ItemId): InteractionResult {
  const item = GIFT_ITEMS.find((candidate) => candidate.id === targetItemId);
  if (!item) return { ok: false, reason: 'unknown-item' };
  const attributeResult = increaseAttribute(state, item.attribute, item.increase);
  if (attributeResult.increase === 0) return { ok: false, reason: 'attribute-maxed' };
  if (state.views < item.cost) return { ok: false, reason: 'not-enough-views' };
  return {
    ok: true,
    state: {
      ...state,
      views: views(state.views - item.cost),
      deliveredItemIds: [...state.deliveredItemIds, item.id],
      streamerAttributes: attributeResult.attributes,
    },
    attribute: item.attribute,
    increase: attributeResult.increase,
  };
}

/** Attribute score nudges steady channel discovery; fan count remains a separate audience measure. */
export function advanceStreamerChannel(state: GameState, elapsedSeconds: number): GameState {
  const { comfort, style, energy, mood } = state.streamerAttributes;
  const average = (comfort + style + energy + mood) / 4;
  const viewsPerSecond = 0.12 + average / 100 * 0.18;
  const earned = viewsPerSecond * Math.max(0, elapsedSeconds);
  const totalViewsEarned = views(state.totalViewsEarned + earned);
  return {
    ...state,
    views: views(state.views + earned),
    totalViewsEarned,
    fans: fans(Math.floor(totalViewsEarned / 100)),
  };
}

function increaseAttribute(
  state: GameState,
  key: StreamerAttribute,
  amount: number,
): { readonly attributes: GameState['streamerAttributes']; readonly increase: number } {
  const increase = Math.min(amount, 100 - state.streamerAttributes[key]);
  return {
    attributes: { ...state.streamerAttributes, [key]: state.streamerAttributes[key] + increase },
    increase,
  };
}
