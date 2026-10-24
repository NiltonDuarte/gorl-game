import {
  clipId,
  clipQuality,
  seconds,
  views,
  type Clip,
  type ClipCreator,
  type ClipPerformance,
  type EpochMilliseconds,
  type GameState,
  type MomentSelection,
  type MomentTemplate,
  type StreamDefinition,
  type StreamMoment,
  type TrimWindow,
} from '../domain/types';

const MINIMUM_CLIP_DURATION_SECONDS = 3;
const QUALITY_PENALTY_PER_SECOND = 15;

export type TrimEdge = 'start' | 'end';
export type TrimDirection = -1 | 1;

export function selectMomentForClipping(
  state: GameState,
  moment: StreamMoment,
  template: MomentTemplate,
): GameState {
  if (
    moment.streamId !== state.selectedStreamId ||
    moment.templateId !== template.id ||
    !state.streamSessions[moment.streamId]?.moments.some((item) => item.id === moment.id)
  ) {
    return state;
  }

  return {
    ...state,
    momentSelection: {
      momentId: moment.id,
      trim: {
        startSeconds: seconds(0),
        endSeconds: template.durationSeconds,
      },
    },
  };
}

export function adjustSelectedTrim(
  selection: MomentSelection,
  template: MomentTemplate,
  edge: TrimEdge,
  direction: TrimDirection,
): MomentSelection {
  const { startSeconds, endSeconds } = selection.trim;
  const minimumEnd = startSeconds + MINIMUM_CLIP_DURATION_SECONDS;

  if (edge === 'start') {
    return {
      ...selection,
      trim: {
        startSeconds: seconds(
          Math.min(endSeconds - MINIMUM_CLIP_DURATION_SECONDS, Math.max(0, startSeconds + direction)),
        ),
        endSeconds,
      },
    };
  }

  return {
    ...selection,
    trim: {
      startSeconds,
      endSeconds: seconds(
        Math.min(template.durationSeconds, Math.max(minimumEnd, endSeconds + direction)),
      ),
    },
  };
}

export function calculateClipQuality(
  trim: TrimWindow,
  template: MomentTemplate,
  qualityBonus = 0,
) {
  const duration = trim.endSeconds - trim.startSeconds;
  const distanceFromIdeal = Math.abs(duration - template.idealClipDurationSeconds);
  return clipQuality(100 - distanceFromIdeal * QUALITY_PENALTY_PER_SECOND + qualityBonus * 100);
}

export function calculateClipPerformance(
  template: MomentTemplate,
  stream: StreamDefinition,
  quality: number,
): ClipPerformance {
  const rarityMultiplier = {
    routine: 0.8,
    notable: 1.25,
    rare: 1.8,
  }[template.rarity];
  const matchingAudienceTags = template.audienceTags.filter((tag) =>
    stream.audience.tags.includes(tag),
  );
  const audienceMatch = matchingAudienceTags.length / Math.max(1, template.audienceTags.length);
  const qualityMultiplier = 0.55 + (quality / 100) * 0.45;
  const score = rarityMultiplier * qualityMultiplier * (0.85 + audienceMatch * 0.3);
  const baseRate = {
    routine: 3,
    notable: 5,
    rare: 9,
  }[template.rarity];

  return {
    score,
    initialViewsPerSecond: baseRate * qualityMultiplier * (0.85 + audienceMatch * 0.3),
    tailViewsPerSecond: baseRate * qualityMultiplier * (0.85 + audienceMatch * 0.3) * 0.16,
    audienceMatch,
    reasons: [
      {
        factor: 'rarity',
        label: {
          routine: 'Routine moments build steady reach',
          notable: 'Notable moments draw stronger discovery',
          rare: 'Rare moments can spark a view spike',
        }[template.rarity],
        impact: template.rarity === 'routine' ? 'steady' : 'boost',
      },
      {
        factor: 'trim',
        label:
          quality >= 90
            ? 'Tight trim keeps the setup and payoff'
            : quality >= 65
              ? 'Solid trim keeps most of the payoff'
              : `Shorten toward ${template.idealClipDurationSeconds}s for a cleaner cut`,
        impact: quality >= 90 ? 'boost' : quality >= 65 ? 'steady' : 'weak',
      },
      {
        factor: 'audience',
        label:
          audienceMatch >= 0.5
            ? 'Strong match for this stream’s audience'
            : audienceMatch > 0
              ? 'Some viewers are a natural audience match'
              : 'Limited overlap with this stream’s audience',
        impact: audienceMatch >= 0.5 ? 'boost' : audienceMatch > 0 ? 'steady' : 'weak',
      },
    ],
  };
}

export function createDraftClip(
  state: GameState,
  createdAt: EpochMilliseconds,
  templates: readonly MomentTemplate[],
  streams: readonly StreamDefinition[],
  qualityBonus = 0,
): { readonly state: GameState; readonly clip: Clip } | null {
  const selection = state.momentSelection;
  if (!selection) {
    return null;
  }

  const session = state.streamSessions[state.selectedStreamId];
  const sourceMoment = session?.moments.find((moment) => moment.id === selection.momentId);
  if (!sourceMoment) {
    return null;
  }

  const template = findMomentTemplate(sourceMoment, templates);
  if (!template) {
    return null;
  }
  const stream = streams.find((candidate) => candidate.id === state.selectedStreamId);
  if (!stream) {
    return null;
  }

  return createDraftClipForMoment(
    { ...state, momentSelection: null },
    sourceMoment,
    template,
    stream,
    selection.trim,
    createdAt,
    qualityBonus,
  );
}

export function createDraftClipForMoment(
  state: GameState,
  sourceMoment: StreamMoment,
  template: MomentTemplate,
  stream: StreamDefinition,
  trim: TrimWindow,
  createdAt: EpochMilliseconds,
  qualityBonus = 0,
  creator: ClipCreator = 'player',
): { readonly state: GameState; readonly clip: Clip } | null {
  const sourceExists = state.streamSessions[sourceMoment.streamId]?.moments.some(
    (moment) => moment.id === sourceMoment.id && moment.templateId === template.id,
  );
  if (!sourceExists || template.streamId !== stream.id) {
    return null;
  }

  const quality = calculateClipQuality(trim, template, qualityBonus);
  const clip: Clip = {
    id: clipId(`clip-${Object.keys(state.clips).length + 1}`),
    sourceMomentId: sourceMoment.id,
    sourceTemplateId: template.id,
    sourceStreamId: sourceMoment.streamId,
    creator,
    status: 'draft',
    trim,
    quality,
    performance: calculateClipPerformance(template, stream, quality),
    views: views(0),
    publishedElapsedSeconds: seconds(0),
    pendingViewFraction: 0,
    createdAt,
    publishedAt: null,
  };

  return {
    clip,
    state: {
      ...state,
      clips: { ...state.clips, [clip.id]: clip },
    },
  };
}

export function queueClipForPublishing(
  state: GameState,
  id: Clip['id'],
): GameState | null {
  const clip = state.clips[id];
  if (!clip || clip.status !== 'draft') {
    return null;
  }

  return {
    ...state,
    clips: {
      ...state.clips,
      [id]: { ...clip, status: 'queued' },
    },
    publishingQueue: [...state.publishingQueue, id],
  };
}

export function findMomentTemplate(
  moment: StreamMoment,
  templates: readonly MomentTemplate[],
): MomentTemplate | undefined {
  return templates.find((template) => template.id === moment.templateId);
}
