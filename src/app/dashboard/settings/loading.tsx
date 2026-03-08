import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="space-y-6">
        {/* Tabs Skeleton */}
        <div className="flex gap-2 w-full max-w-xl h-12 p-1 bg-muted/50 rounded-xl">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="flex-1 h-full rounded-lg" />
          ))}
        </div>

        <Card className="border-primary/10">
          <CardHeader className="p-6 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
            <Skeleton className="h-32 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
