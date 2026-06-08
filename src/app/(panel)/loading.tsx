import { Card } from "@/components/ui";
import { Skeleton } from "@/components/Skeleton";

// Shown instantly on every panel navigation while the dynamic page streams in.
export default function PanelLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-52" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <div className="space-y-3 p-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
