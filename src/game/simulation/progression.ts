import {
  views,
  type GameState,
  type HelperDefinition,
  type UpgradeDefinition,
  type UpgradeEffect,
} from '../domain/types';

export type PurchaseFailure = 'already-owned' | 'not-enough-views';
export type PurchaseResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly reason: PurchaseFailure };

export function purchaseUpgrade(
  state: GameState,
  upgrade: UpgradeDefinition,
): PurchaseResult {
  if (state.purchasedUpgradeIds.includes(upgrade.id)) {
    return { ok: false, reason: 'already-owned' };
  }
  if (state.views < upgrade.cost) {
    return { ok: false, reason: 'not-enough-views' };
  }

  return {
    ok: true,
    state: {
      ...state,
      views: views(state.views - upgrade.cost),
      purchasedUpgradeIds: [...state.purchasedUpgradeIds, upgrade.id],
      publishingCapacity:
        state.publishingCapacity +
        (upgrade.effect.kind === 'publishing-capacity' ? upgrade.effect.additionalSlots : 0),
    },
  };
}

export function purchaseHelper(
  state: GameState,
  helper: HelperDefinition,
): PurchaseResult {
  if (state.unlockedHelperIds.includes(helper.id)) {
    return { ok: false, reason: 'already-owned' };
  }
  if (state.views < helper.cost) {
    return { ok: false, reason: 'not-enough-views' };
  }

  return {
    ok: true,
    state: {
      ...state,
      views: views(state.views - helper.cost),
      unlockedHelperIds: [...state.unlockedHelperIds, helper.id],
    },
  };
}

export function ownedUpgradeBonus(
  state: GameState,
  upgrades: readonly UpgradeDefinition[],
  kind: UpgradeEffect['kind'],
): number {
  return upgrades.reduce((total, upgrade) => {
    if (
      !state.purchasedUpgradeIds.includes(upgrade.id) ||
      upgrade.effect.kind !== kind
    ) {
      return total;
    }

    return total + (upgrade.effect.kind === kind && 'bonus' in upgrade.effect ? upgrade.effect.bonus : 0);
  }, 0);
}
