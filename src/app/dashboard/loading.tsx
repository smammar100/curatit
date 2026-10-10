import { GridSkeleton, HeaderSkeleton } from "@/components/dashboard/Skeleton";

// Shown while the feed is on its way: the header and the masonry's shape
export default function DashboardLoading() {
  return (
    <div className="min-h-dvh bg-white">
      <HeaderSkeleton />
      <main className="px-4 pt-2 pb-24 sm:px-6">
        <GridSkeleton />
      </main>
    </div>
  );
}
