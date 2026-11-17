interface CaptionBox {
  top: number;
  width: number;
  height: number;
}

export function captionCeiling(
  stage: { top: number; height: number },
  captions: CaptionBox[],
): number | undefined {
  if (!Number.isFinite(stage.top) || !Number.isFinite(stage.height) || stage.height <= 0) {
    return undefined;
  }
  // visibility:hidden keeps upcoming captions' layout; display:none/empty does not.
  const tops = captions
    .filter(
      (box) =>
        box.width > 0 &&
        box.height > 0 &&
        box.top < stage.top + stage.height &&
        box.top + box.height > stage.top,
    )
    .map((box) => Math.max(0, box.top - stage.top));
  return tops.length ? Math.min(...tops) : undefined;
}

export function safeGlassY(
  desired: number,
  stageHeight: number,
  width: number,
  height: number,
  ceiling?: number,
): number {
  if (
    ceiling === undefined ||
    !Number.isFinite(ceiling) ||
    stageHeight <= 0 ||
    width <= 0 ||
    height <= 0
  ) {
    return desired;
  }
  // Half the diagonal contains every spin. In an impossibly short frame, allow
  // top-edge overhang rather than moving the sentences or covering their words.
  const radius = Math.hypot(width, height) / 2;
  return Math.min(desired, ((ceiling - radius - 8) / stageHeight) * 100);
}
