
export const HORSE_PIN_END = 0.8;
export const SECOND_TILT_LEN = 0.15;

// Z2 completes right at the end of the scroll
export const Z2_SCROLL_START = HORSE_PIN_END + SECOND_TILT_LEN; // 0.95
export const Z2_SCROLL_LEN = 0.43;
export const Z2_SCROLL_DISTANCE = 114;

// Final crossfade/scrub window for the video - align with Z2 exactly
export const VIDEO_START = Z2_SCROLL_START; // 0.95
export const VIDEO_LEN = 0.35;

// Max camera Z speed during Z2 (units/sec). Lower to slow the pass through the train.
export const Z2_MAX_Z_SPEED = 10;