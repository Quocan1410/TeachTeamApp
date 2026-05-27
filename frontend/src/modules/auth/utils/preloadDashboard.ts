/**
 * Preload route JS chunks before navigation (router.prefetch only warms the route shell).
 */
export async function preloadDashboardRoute(path: string): Promise<void> {
  switch (path) {
    case "/lecturer":
      await import("@/app/lecturer/LecturerDashboardClient");
      break;
    case "/tutor":
      // Tutor page is a single client bundle; importing the module warms the chunk.
      await import("@/app/tutor/page");
      break;
    default:
      break;
  }
}
