import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Dumbbell, Filter, ImageOff } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

const WORKOUT_TYPES = [
  { value: "all", label: "All Types" },
  { value: "weights", label: "Weight Training" },
  { value: "plyometrics", label: "Plyometrics" },
  { value: "cardio", label: "Cardio" },
  { value: "hiit", label: "HIIT" },
  { value: "yoga", label: "Yoga" },
  { value: "stretching", label: "Stretching" },
  { value: "calisthenics", label: "Calisthenics" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "crossfit", label: "CrossFit" },
  { value: "sport_specific", label: "Sport Specific" },
];

const DIFFICULTIES = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  intermediate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  advanced: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function Exercises() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [workoutType, setWorkoutType] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const filters = useMemo(() => ({
    search: search || undefined,
    workoutType: workoutType !== "all" ? workoutType : undefined,
    difficulty: difficulty !== "all" ? difficulty : undefined,
    limit: 100,
  }), [search, workoutType, difficulty]);

  const { data, isLoading } = trpc.exercises.list.useQuery(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Exercise Library</h1>
        <p className="text-muted-foreground mt-1">Browse and discover exercises for your workouts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={workoutType} onValueChange={setWorkoutType}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WORKOUT_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTIES.map(d => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {data && (
        <p className="text-sm text-muted-foreground">
          Showing {data.exercises.length} of {data.total} exercises
        </p>
      )}

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-24" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.exercises.map(exercise => (
            <Card
              key={exercise.id}
              className="hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => setLocation(`/exercises/${exercise.id}`)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="h-36 w-full rounded-lg overflow-hidden bg-secondary/50">
                  {exercise.imageUrl ? (
                    <img
                      src={exercise.imageUrl}
                      alt={`${exercise.name} demo`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground gap-2">
                      <ImageOff className="h-4 w-4" />
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Dumbbell className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {exercise.name}
                    </h3>
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${DIFFICULTY_COLORS[exercise.difficulty] ?? ""}`}>
                    {exercise.difficulty}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{exercise.description}</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">{exercise.workoutType.replace("_", " ")}</Badge>
                  {exercise.equipment && exercise.equipment !== "none" && (
                    <Badge variant="outline" className="text-xs">{exercise.equipment.replace("_", " ")}</Badge>
                  )}
                </div>
                {Array.isArray(exercise.muscleGroups) && exercise.muscleGroups.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(exercise.muscleGroups as string[]).slice(0, 3).map((mg: string) => (
                      <span key={mg} className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        {String(mg).replace("_", " ")}
                      </span>
                    ))}
                    {(exercise.muscleGroups as string[]).length > 3 && (
                      <span className="text-xs text-muted-foreground">+{(exercise.muscleGroups as string[]).length - 3}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data?.exercises.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No exercises found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
