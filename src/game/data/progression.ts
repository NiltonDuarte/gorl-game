import {
  helperId,
  fans,
  milestoneId,
  streamId,
  trendId,
  upgradeId,
  views,
  type HelperDefinition,
  type MilestoneDefinition,
  type TrendDefinition,
  type UpgradeDefinition,
} from '../domain/types';

export const UPGRADES: readonly UpgradeDefinition[] = [
  {
    id: upgradeId('moment-radar'),
    name: 'Moment Radar',
    description: 'Notice incoming stream moments sooner.',
    cost: views(100),
    effect: { kind: 'moment-detection', bonus: 0.1 },
  },
  {
    id: upgradeId('clean-cut-tools'),
    name: 'Clean Cut Tools',
    description: 'Make it easier to trim a moment cleanly.',
    cost: views(180),
    effect: { kind: 'trim-quality', bonus: 0.15 },
  },
  {
    id: upgradeId('second-upload-slot'),
    name: 'Second Upload Slot',
    description: 'Keep one more clip in the publishing queue.',
    cost: views(260),
    effect: { kind: 'publishing-capacity', additionalSlots: 1 },
  },
];

export const ROUTINE_CATCHER: HelperDefinition = {
  id: helperId('routine-catcher'),
  name: 'Routine Catcher',
  description: 'Automatically flag routine moments for your review.',
  cost: views(240),
  task: 'catch-routine-moments',
};

export const HELPERS: readonly HelperDefinition[] = [ROUTINE_CATCHER];

export const FIRST_CHANNEL_MILESTONE: MilestoneDefinition = {
  id: milestoneId('three-fan-club'),
  name: 'A Small, Loyal Crowd',
  description: 'Reach 3 fans to unlock a new stream.',
  requiredFans: fans(3),
  reward: {
    kind: 'unlock-stream',
    streamId: streamId('afterglow-observatory'),
  },
};

export const MILESTONES: readonly MilestoneDefinition[] = [FIRST_CHANNEL_MILESTONE];

export const TRENDS: readonly TrendDefinition[] = [
  {
    id: trendId('tiny-surprises'),
    name: 'Tiny Surprises',
    description: 'Viewers are sharing small unexpected moments.',
    audienceTags: ['curious', 'observant'],
    category: 'surprising',
  },
];
