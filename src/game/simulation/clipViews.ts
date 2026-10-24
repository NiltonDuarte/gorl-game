import { seconds, views, type Clip, type Seconds } from '../domain/types';

export const DISCOVERY_BURST_DURATION_SECONDS = seconds(12);

export interface ClipViewAdvance {
  readonly clip: Clip;
  readonly earnedViews: number;
}

/** Apply the same discovery burst and long tail for active and offline elapsed time. */
export function advancePublishedClip(clip: Clip, elapsed: Seconds): ClipViewAdvance {
  if (clip.status !== 'published' || elapsed <= 0) {
    return { clip, earnedViews: 0 };
  }

  const start = clip.publishedElapsedSeconds;
  const end = start + elapsed;
  const burstEnd = DISCOVERY_BURST_DURATION_SECONDS;
  const burstSeconds = Math.max(0, Math.min(end, burstEnd) - Math.min(start, burstEnd));
  const tailSeconds = Math.max(0, end - Math.max(start, burstEnd));
  const earned =
    clip.pendingViewFraction +
    burstSeconds * clip.performance.initialViewsPerSecond +
    tailSeconds * clip.performance.tailViewsPerSecond;
  const wholeViews = Math.floor(earned);

  return {
    clip: {
      ...clip,
      views: views(clip.views + wholeViews),
      publishedElapsedSeconds: seconds(end),
      pendingViewFraction: earned - wholeViews,
    },
    earnedViews: wholeViews,
  };
}
