import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Dumbbell, Flame, Target, Calendar, Search, Trophy } from "lucide-react";
import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area,
} from "recharts";

export default function Progress() {
  const { isAuthenticated } = useAuth();
  const stats = trpc.progress.stats.useQuery(undefined, { enabled: isAuthenticated });
  const weeklyActivity = trpc.progress.weeklyActivity.useQuery(undefined, { enabled: isAuthenticated });
  const sessions = trpc.sessions.list.useQuery({ limit: 50 }, { enabled: isAuthenticated });
  const [selectedExercise, setSelectedExercise] = useState("");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const prs = trpc.prs.getAll.useQuery(undefined, { enabled: isAuthenticated });

  const exerciseHistory = trpc.progress.exerciseHistory.useQuery(
    { exerciseName: selectedExercise, limit: 30 },
    { enabled: isAuthenticated && !!selectedExercise }
  );

  // Get unique exercise names from sessions
  const exerciseNames = useMemo(() => {
    if (!sessions.data) return [];
    const names = new Set<string>();
    // We'll populate from the exercise list instead
    return Array.from(names);
  }, [sessions.data]);

  const exerciseList = trpc.exercises.list.useQuery({ limit: 100 }, { enabled: isAuthenticated });
  const filteredExercises = useMemo(() => {
    if (!exerciseList.data) return [];
    if (!exerciseSearch) return exerciseList.data.exercises.slice(0, 20);
    return exerciseList.data.exercises.filter(e =>
      e.name.toLowerCase().includes(exerciseSearch.toLowerCase())
    ).slice(0, 20);
  }, [exerciseList.data, exerciseSearch]);

  // Format weekly data for chart
  const weeklyData = useMemo(() => {
    if (!weeklyActivity.data) return [];
    return weeklyActivity.data.map((d: any) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      workouts: Number(d.count),
      duration: Math.round(Number(d.totalDuration) / 60),
    }));
  }, [weeklyActivity.data]);

  // Format exercise history for chart
  const exerciseData = useMemo(() => {
    if (!exerciseHistory.data) return [];
    return [...exerciseHistory.data].reverse().map((d: any) => ({
      date: new Date(d.sessionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      maxWeight: Number(d.maxWeight),
      maxReps: Number(d.maxReps),
    }));
  }, [exerciseHistory.data]);

  const chartTooltipStyle = {
    contentStyle: {
      backgroundColor: "oklch(0.17 0.012 260)",
      border: "1px solid oklch(0.25 0.012 260)",
      borderRadius: "8px",
      color: "oklch(0.95 0.005 260)",
      fontSize: "13px",
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Progress</h1>
        <p className="text-muted-foreground mt-1">Track your fitness journey over time</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Dumbbell className="h-5 w-5 text-primary" />}
          label="Total Workouts"
          value={stats.data?.totalSessions ?? 0}
          loading={stats.isLoading}
        />
        <StatCard
          icon={<Flame className="h-5 w-5 text-orange-400" />}
          label="Total Volume"
          value={stats.data?.totalVolume ? `${Math.round(Number(stats.data.totalVolume)).toLocaleString()} kg` : "0 kg"}
          loading={stats.isLoading}
        />
        <StatCard
          icon={<Target className="h-5 w-5 text-blue-400" />}
          label="Total Reps"
          value={stats.data?.totalReps ? Number(stats.data.totalReps).toLocaleString() : "0"}
          loading={stats.isLoading}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          label="Unique Exercises"
          value={stats.data?.uniqueExercises ?? 0}
          loading={stats.isLoading}
        />
      </div>

      {/* Weekly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Workout Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyActivity.isLoading ? (
            <Skeleton className="h-64" />
          ) : weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.012 260)" />
                <XAxis dataKey="date" stroke="oklch(0.6 0.015 260)" fontSize={12} />
                <YAxis stroke="oklch(0.6 0.015 260)" fontSize={12} />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey="workouts" fill="oklch(0.75 0.18 145)" radius={[4, 4, 0, 0]} name="Workouts" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>Complete some workouts to see your activity chart.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" /> Personal Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prs.isLoading ? (
            <Skeleton className="h-32" />
          ) : prs.data && prs.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {["Bench Press", "Back Squat", "Deadlift", "Leg Press", "Overhead Press"].map(name => {
                const pr = prs.data.find((p: any) => p.exerciseName === name);
                return (
                  <div key={name} className={`p-4 rounded-lg border ${pr ? "bg-secondary/50 border-primary/20" : "bg-secondary/20 border-border"}`}>
                    <p className="font-semibold text-sm text-foreground">{name}</p>
                    {pr ? (
                      <>
                        <p className="text-3xl font-black text-primary mt-2">{pr.maxWeightKg}<span className="text-sm font-normal text-muted-foreground ml-1">kg</span></p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {pr.repsAtMax} rep{pr.repsAtMax !== 1 ? "s" : ""} &middot; {new Date(pr.achievedAt).toLocaleDateString()}
                        </p>
                        {pr.previousMaxKg && (
                          <p className="text-xs text-emerald-400 mt-0.5">
                            +{(pr.maxWeightKg - pr.previousMaxKg).toFixed(1)} kg improvement
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">No PR yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <p>Log sets for Bench Press, Back Squat, Deadlift, Leg Press, or Overhead Press to track PRs.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercise Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Exercise Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for an exercise to view progress..."
              value={exerciseSearch}
              onChange={e => {
                setExerciseSearch(e.target.value);
                if (!e.target.value) setSelectedExercise("");
              }}
              className="pl-10"
            />
          </div>

          {/* Exercise suggestions */}
          {exerciseSearch && !selectedExercise && (
            <div className="flex flex-wrap gap-2">
              {filteredExercises.map(ex => (
                <Badge
                  key={ex.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors"
                  onClick={() => {
                    setSelectedExercise(ex.name);
                    setExerciseSearch(ex.name);
                  }}
                >
                  {ex.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Selected exercise info */}
          {selectedExercise && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{selectedExercise}</h3>
                <Badge
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => { setSelectedExercise(""); setExerciseSearch(""); }}
                >
                  Clear
                </Badge>
              </div>

              {exerciseHistory.isLoading ? (
                <Skeleton className="h-48" />
              ) : exerciseData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={exerciseData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.012 260)" />
                    <XAxis dataKey="date" stroke="oklch(0.6 0.015 260)" fontSize={12} />
                    <YAxis stroke="oklch(0.6 0.015 260)" fontSize={12} />
                    <Tooltip {...chartTooltipStyle} />
                    <Area
                      type="monotone"
                      dataKey="maxWeight"
                      stroke="oklch(0.75 0.18 145)"
                      fill="oklch(0.75 0.18 145 / 0.2)"
                      strokeWidth={2}
                      name="Max Weight (kg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <p>No data yet for this exercise. Start logging workouts to see progress.</p>
                </div>
              )}
            </div>
          )}

          {!selectedExercise && !exerciseSearch && (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              <p>Search for an exercise above to view your weight progression over time.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: string | number; loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">{icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            {loading ? <Skeleton className="h-6 w-16 mt-1" /> : <p className="text-lg font-bold text-foreground truncate">{value}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
