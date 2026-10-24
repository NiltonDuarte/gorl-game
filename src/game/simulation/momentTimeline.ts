import {
  momentId,
  seconds,
  type MomentTemplate,
  type Seconds,
  type StreamDefinition,
  type StreamMoment,
  type StreamSession,
} from '../domain/types';

const MOMENT_ID_SEPARATOR = ':moment:';
const MAX_STORED_MOMENTS = 40;
const INTERVAL_RANDOM_SALT = 0x4f1bbcdc;
const TEMPLATE_RANDOM_SALT = 0x6d2b79f5;

export interface StreamAdvance {
  readonly session: StreamSession;
  readonly generatedMoments: readonly StreamMoment[];
}

/** Create a stream clock. Its first event arrives sooner than its normal pace. */
export function createStreamSession(
  stream: StreamDefinition,
  seed: number,
): StreamSession {
  return {
    streamId: stream.id,
    seed: seed >>> 0,
    elapsedSeconds: seconds(0),
    nextMomentAtSeconds: stream.pace.firstMomentDelaySeconds,
    nextSequence: 0,
    moments: [],
  };
}

/** Advance a stream deterministically; equal inputs always produce equal moments. */
export function advanceStreamSession(
  current: StreamSession,
  stream: StreamDefinition,
  templates: readonly MomentTemplate[],
  elapsed: Seconds,
  detectionBonus = 0,
): StreamAdvance {
  if (current.streamId !== stream.id) {
    throw new Error(`Session ${current.streamId} cannot advance stream ${stream.id}.`);
  }

  const streamTemplates = templates.filter((template) => template.streamId === stream.id);
  if (streamTemplates.length === 0) {
    throw new Error(`Stream ${stream.id} has no moment templates.`);
  }

  const targetTime = current.elapsedSeconds + elapsed;
  let nextMomentAtSeconds: number = current.nextMomentAtSeconds;
  let nextSequence = current.nextSequence;
  const generatedMoments: StreamMoment[] = [];

  while (nextMomentAtSeconds <= targetTime) {
    const template = chooseTemplate(streamTemplates, current.seed, nextSequence);
    generatedMoments.push({
      id: momentId(`${stream.id}${MOMENT_ID_SEPARATOR}${nextSequence}`),
      streamId: stream.id,
      templateId: template.id,
      occurredAtSeconds: seconds(nextMomentAtSeconds),
      sequence: nextSequence,
    });

    nextSequence += 1;
    nextMomentAtSeconds += chooseNextInterval(stream, current.seed, nextSequence, detectionBonus);
  }

  const allMoments = [...current.moments, ...generatedMoments];
  return {
    session: {
      ...current,
      elapsedSeconds: seconds(targetTime),
      nextMomentAtSeconds: seconds(nextMomentAtSeconds),
      nextSequence,
      moments: allMoments.slice(-MAX_STORED_MOMENTS),
    },
    generatedMoments,
  };
}

function chooseTemplate(
  templates: readonly MomentTemplate[],
  seed: number,
  sequence: number,
): MomentTemplate {
  const totalWeight = templates.reduce(
    (total, template) => total + Math.max(0, template.appearanceWeight),
    0,
  );

  if (totalWeight <= 0) {
    return templates[0];
  }

  let roll = randomUnit(seed, sequence, TEMPLATE_RANDOM_SALT) * totalWeight;
  for (const template of templates) {
    roll -= Math.max(0, template.appearanceWeight);
    if (roll < 0) {
      return template;
    }
  }

  return templates[templates.length - 1];
}

function chooseNextInterval(
  stream: StreamDefinition,
  seed: number,
  sequence: number,
  detectionBonus: number,
): number {
  const minimum = stream.pace.minimumMomentIntervalSeconds;
  const maximum = stream.pace.maximumMomentIntervalSeconds;
  const range = Math.max(0, maximum - minimum);
  const baseInterval = minimum + randomUnit(seed, sequence, INTERVAL_RANDOM_SALT) * range;
  const interval = baseInterval / (1 + Math.max(0, detectionBonus));
  return Math.max(1, interval);
}

function randomUnit(seed: number, sequence: number, salt: number): number {
  let value = seed ^ Math.imul(sequence + 1, salt);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value ^= value >>> 16;
  return (value >>> 0) / 0x1_0000_0000;
}
