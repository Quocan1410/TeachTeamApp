/** 1 = forward to chat, -1 = back to overview */
export type DetailNavDirection = 1 | -1;

const easeOutSoft = [0.33, 1, 0.68, 1] as const;

export const detailViewVariants = {
  initial: (direction: DetailNavDirection) => ({
    opacity: 0,
    x: direction * 20,
    scale: 0.992,
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: (direction: DetailNavDirection) => ({
    opacity: 0,
    x: direction * -14,
    scale: 0.996,
  }),
};

export function getDetailViewTransition(reduceMotion: boolean | null) {
  if (reduceMotion) {
    return { duration: 0.22, ease: easeOutSoft };
  }
  return {
    opacity: { duration: 0.44, ease: easeOutSoft },
    x: { type: "spring", stiffness: 210, damping: 28, mass: 0.92 },
    scale: { duration: 0.44, ease: easeOutSoft },
  };
}
