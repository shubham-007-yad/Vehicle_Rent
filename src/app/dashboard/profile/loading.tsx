import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 pb-10 md:pb-0">
      <div className="px-1 md:px-0 space-y-2">
        <Skeleton className="h-8 md:h-10 w-48" />
        <Skeleton className="h-4 md:h-5 w-64" />
      </div>

      <Card className="border-primary/10 overflow-hidden shadow-lg mx-1 md:mx-0">
        <div className="h-24 md:h-32 bg-primary/5 flex items-center justify-center border-b border-primary/5 relative">
           <div className="absolute -bottom-12">
              <Skeleton className="size-24 md:size-32 rounded-full border-4 border-background shadow-xl" />
           </div>
        </div>
        
        <CardHeader className="pt-16 md:pt-20 flex flex-col items-center space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-6 w-20 rounded-full mt-2" />
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
            ))}
          </div>
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}
