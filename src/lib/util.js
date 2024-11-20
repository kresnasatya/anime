export const NO_LOOP = 0;
export const LOOP_CURRENT_VIDEO = 1;
export const LOOP_PLAYLIST = 2;

/**
 * @param {number} duration
 */
export function formatTime(duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}