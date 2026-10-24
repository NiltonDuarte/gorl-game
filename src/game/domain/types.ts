type Brand<Value, Name extends string> = Value & { readonly __brand: Name };

export type StreamId = Brand<string, 'StreamId'>;
export type MomentTemplateId = Brand<string, 'MomentTemplateId'>;
export type MomentId = Brand<string, 'MomentId'>;
export type ClipId = Brand<string, 'ClipId'>;
export type UpgradeId = Brand<string, 'UpgradeId'>;
export type HelperId = Brand<string, 'HelperId'>;
export type TrendId = Brand<string, 'TrendId'>;
export type MilestoneId = Brand<string, 'MilestoneId'>;
export type SceneId = Brand<string, 'SceneId'>;
export type ItemId = Brand<string, 'ItemId'>;
export type Seconds = Brand<number, 'Seconds'>;
export type Views = Brand<number, 'Views'>;
export type Fans = Brand<number, 'Fans'>;
export type EpochMilliseconds = Brand<number, 'EpochMilliseconds'>;
export type ClipQuality = Brand<number, 'ClipQuality'>;

export const streamId = (value: string): StreamId => value as StreamId;
export const momentTemplateId = (value: string): MomentTemplateId =>
  value as MomentTemplateId;
export const momentId = (value: string): MomentId => value as MomentId;
export const clipId = (value: string): ClipId => value as ClipId;
export const upgradeId = (value: string): UpgradeId => value as UpgradeId;
export const helperId = (value: string): HelperId => value as HelperId;
export const trendId = (value: string): TrendId => value as TrendId;
export const milestoneId = (value: string): MilestoneId => value as MilestoneId;
export const sceneId = (value: string): SceneId => value as SceneId;
export const itemId = (value: string): ItemId => value as ItemId;

export const seconds = (value: number): Seconds =>
  Math.max(0, Number.isFinite(value) ? value : 0) as Seconds;
export const views = (value: number): Views =>
  Math.max(0, Number.isFinite(value) ? value : 0) as Views;
export const fans = (value: number): Fans =>
  Math.max(0, Number.isFinite(value) ? value : 0) as Fans;
export const epochMilliseconds = (value: number): EpochMilliseconds =>
  Math.max(0, Number.isFinite(value) ? value : 0) as EpochMilliseconds;
export const clipQuality = (value: number): ClipQuality =>
  Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0)) as ClipQuality;

export type AudienceTag = 'cozy' | 'curious' | 'chaotic' | 'observant';
export type MomentCategory =
  | 'ordinary'
  | 'funny'
  | 'surprising'
  | 'wholesome'
  | 'awkward'
  | 'lore-heavy';
export type MomentRarity = 'routine' | 'notable' | 'rare';
export type ContentApproval = 'placeholder' | 'approved';

export interface AudienceProfile {
  readonly tags: readonly AudienceTag[];
  readonly description: string;
}

export interface StreamPace {
  readonly firstMomentDelaySeconds: Seconds;
  readonly minimumMomentIntervalSeconds: Seconds;
  readonly maximumMomentIntervalSeconds: Seconds;
}

export interface StreamDefinition {
  readonly id: StreamId;
  readonly name: string;
  readonly description: string;
  readonly audience: AudienceProfile;
  readonly pace: StreamPace;
  readonly contentApproval: ContentApproval;
}

export interface MomentTemplate {
  readonly id: MomentTemplateId;
  readonly streamId: StreamId;
  readonly title: string;
  readonly setup: string;
  readonly payoff: string;
  readonly durationSeconds: Seconds;
  readonly idealClipDurationSeconds: Seconds;
  readonly category: MomentCategory;
  readonly rarity: MomentRarity;
  readonly audienceTags: readonly AudienceTag[];
  /** Relative chance of appearing in this stream's feed. */
  readonly appearanceWeight: number;
  readonly contentApproval: ContentApproval;
}

export interface StreamMoment {
  readonly id: MomentId;
  readonly streamId: StreamId;
  readonly templateId: MomentTemplateId;
  readonly occurredAtSeconds: Seconds;
  readonly sequence: number;
}

export interface StreamSession {
  readonly streamId: StreamId;
  readonly seed: number;
  readonly elapsedSeconds: Seconds;
  readonly nextMomentAtSeconds: Seconds;
  readonly nextSequence: number;
  readonly moments: readonly StreamMoment[];
}

export type ClipStatus = 'draft' | 'queued' | 'published';
export type ClipCreator = 'player' | 'helper';

export interface TrimWindow {
  readonly startSeconds: Seconds;
  readonly endSeconds: Seconds;
}

export interface MomentSelection {
  readonly momentId: MomentId;
  readonly trim: TrimWindow;
}

export interface PerformanceReason {
  readonly factor: 'rarity' | 'trim' | 'audience';
  readonly label: string;
  readonly impact: 'boost' | 'steady' | 'weak';
}

export interface ClipPerformance {
  readonly score: number;
  readonly initialViewsPerSecond: number;
  readonly tailViewsPerSecond: number;
  readonly audienceMatch: number;
  readonly reasons: readonly PerformanceReason[];
}

export interface Clip {
  readonly id: ClipId;
  readonly sourceMomentId: MomentId;
  readonly sourceTemplateId: MomentTemplateId;
  readonly sourceStreamId: StreamId;
  readonly creator: ClipCreator;
  readonly status: ClipStatus;
  readonly trim: TrimWindow;
  readonly quality: ClipQuality;
  readonly performance: ClipPerformance;
  readonly views: Views;
  readonly publishedElapsedSeconds: Seconds;
  readonly pendingViewFraction: number;
  readonly createdAt: EpochMilliseconds;
  readonly publishedAt: EpochMilliseconds | null;
}

export type UpgradeEffect =
  | { readonly kind: 'moment-detection'; readonly bonus: number }
  | { readonly kind: 'trim-quality'; readonly bonus: number }
  | { readonly kind: 'publishing-capacity'; readonly additionalSlots: number };

export interface UpgradeDefinition {
  readonly id: UpgradeId;
  readonly name: string;
  readonly description: string;
  readonly cost: Views;
  readonly effect: UpgradeEffect;
}

export interface HelperDefinition {
  readonly id: HelperId;
  readonly name: string;
  readonly description: string;
  readonly cost: Views;
  readonly task: 'catch-routine-moments' | 'trim-clips' | 'publish-clips';
}

export interface MilestoneDefinition {
  readonly id: MilestoneId;
  readonly name: string;
  readonly description: string;
  readonly requiredFans: Fans;
  readonly reward: { readonly kind: 'unlock-stream'; readonly streamId: StreamId };
}

export interface TrendDefinition {
  readonly id: TrendId;
  readonly name: string;
  readonly description: string;
  readonly audienceTags: readonly AudienceTag[];
  readonly category: MomentCategory;
}

export type StreamerAttribute = 'comfort' | 'style' | 'energy' | 'mood';

export interface StreamerAttributes {
  readonly comfort: number;
  readonly style: number;
  readonly energy: number;
  readonly mood: number;
}

export interface SceneDefinition {
  readonly id: SceneId;
  readonly name: string;
  readonly description: string;
  readonly attribute: StreamerAttribute;
  readonly increase: number;
  readonly color: number;
}

export interface GiftItemDefinition {
  readonly id: ItemId;
  readonly name: string;
  readonly description: string;
  readonly kind: 'food' | 'wearable' | 'comfort';
  readonly cost: Views;
  readonly attribute: StreamerAttribute;
  readonly increase: number;
  readonly color: number;
}

export interface GameState {
  readonly currentSceneId: SceneId;
  readonly streamerAttributes: StreamerAttributes;
  readonly deliveredItemIds: readonly ItemId[];
  readonly selectedStreamId: StreamId;
  readonly momentSelection: MomentSelection | null;
  readonly views: Views;
  readonly totalViewsEarned: Views;
  readonly fans: Fans;
  readonly streamSessions: Readonly<Record<string, StreamSession>>;
  readonly clips: Readonly<Record<string, Clip>>;
  readonly publishingQueue: readonly ClipId[];
  readonly publishingCapacity: number;
  readonly unlockedStreamIds: readonly StreamId[];
  readonly claimedMilestoneIds: readonly MilestoneId[];
  readonly purchasedUpgradeIds: readonly UpgradeId[];
  readonly unlockedHelperIds: readonly HelperId[];
  readonly activeTrendId: TrendId | null;
  readonly lastActiveAt: EpochMilliseconds;
}

export interface SaveData {
  readonly format: 'gorl-reactor-save';
  readonly schemaVersion: 2;
  readonly savedAt: EpochMilliseconds;
  readonly state: GameState;
}
