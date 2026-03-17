import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Dumbbell, Target, Zap, ImageOff, VideoOff } from "lucide-react";
import { useLocation } from "wouter";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  advanced: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function ExerciseDetail({ id }: { id: number }) {
  const [, setLocation] = useLocation();
  const { data: exercise, isLoading } = trpc.exercises.get.useQuery({ id });
  const media = trpc.exercises.mediaByName.useQuery(
    { name: exercise?.name ?? "" },
    { enabled: !!exercise?.name }
  );

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Exercise not found.</p>
        <Button variant="outline" onClick={() => setLocation("/exercises")} className="mt-4">
          Back to Library
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Button variant="ghost" onClick={() => setLocation("/exercises")} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to Library
      </Button>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{exercise.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{exercise.workoutType.replace("_", " ")}</Badge>
              <Badge variant="outline" className={DIFFICULTY_COLORS[exercise.difficulty] ?? ""}>
                {exercise.difficulty}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="h-64 w-full rounded-lg overflow-hidden bg-secondary/50">
            {media.data?.imageUrl ? (
              <img src={media.data.imageUrl} alt={`${exercise.name} demonstration`} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground gap-2">
                <ImageOff className="h-4 w-4" />
                <span className="text-sm">No image available</span>
              </div>
            )}
          </div>
          {media.data?.reason === "missing_api_key" && (
            <p className="text-xs text-amber-400">
              ExerciseDB API key is missing. Set `EXERCISEDB_API_KEY` in your server environment.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exercise Video</CardTitle>
        </CardHeader>
        <CardContent>
          {media.data?.videoUrl ? (
            <video
              controls
              preload="metadata"
              className="w-full rounded-lg bg-black"
              src={media.data.videoUrl}
            />
          ) : (
            <div className="h-40 w-full rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground gap-2">
              <VideoOff className="h-4 w-4" />
              <span className="text-sm">No video available</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{exercise.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{exercise.instructions}</p>
        </CardContent>
      </Card>

      {Array.isArray(exercise.muscleGroups) && exercise.muscleGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Muscle Groups Targeted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(exercise.muscleGroups as string[]).map((mg: string) => (
                <Badge key={mg} variant="secondary" className="text-sm capitalize">
                  {String(mg).replace("_", " ")}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {exercise.equipment && exercise.equipment !== "none" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipment Required</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-sm capitalize">
              {exercise.equipment.replace("_", " ")}
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
