import { useAuth } from "@/_core/hooks/useAuth";
import { useUnit } from "@/hooks/useUnit";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dumbbell, TrendingUp, Clock, Flame, Sparkles, Play, ChevronRight, Target, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { formatWeight } = useUnit();
  const profile = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const stats = trpc.progress.stats.useQuery(undefined, { enabled: isAuthenticated });
  const activeSession = trpc.sessions.active.useQuery(undefined, { enabled: isAuthenticated });
  const plans = trpc.plans.list.useQuery(undefined, { enabled: isAuthenticated });
  const prs = trpc.prs.getAll.useQuery(undefined, { enabled: isAuthenticated });

  // Redirect to onboarding if profile not completed
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7782/ingest/ab464268-2ac5-4add-aaf6-705c2e3b12c1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'15fc60'},body:JSON.stringify({sessionId:'15fc60',location:'Home.tsx:useEffect',message:'Redirect check',data:{profileData:profile.data,onboardingCompleted:profile.data?.onboardingCompleted,profileDataUndefined:profile.data===undefined,willRedirect:profile.data!==undefined&&profile.data?.onboardingCompleted!==true&&!!isAuthenticated,isAuthenticated,isLoading:profile.isLoading,isFetching:profile.isFetching},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    if (profile.data !== undefined && profile.data?.onboardingCompleted !== true && isAuthenticated) {
      // #region agent log
      fetch('http://127.0.0.1:7782/ingest/ab464268-2ac5-4add-aaf6-705c2e3b12c1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'15fc60'},body:JSON.stringify({sessionId:'15fc60',location:'Home.tsx:redirecting',message:'Redirecting to onboarding',data:{onboardingCompleted:profile.data?.onboardingCompleted},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      setLocation("/onboarding");
    }
  }, [profile.data, isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {greeting()}, {user?.name?.split(" ")[0] ?? "Athlete"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to crush your workout today?
          </p>
        </div>
        <div className="flex gap-2">
          {activeSession.data ? (
            <Button onClick={() => setLocation("/workout")} className="glow-primary gap-2">
              <Play className="h-4 w-4" /> Resume Workout
            </Button>
          ) : (
            <Button onClick={() => setLocation("/generate")} className="glow-primary gap-2">
              <Sparkles className="h-4 w-4" /> Generate Plan
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<Dumbbell className="h-5 w-5 text-primary" />}
          label="Total Workouts"
          value={stats.data?.totalSessions ?? 0}
          loading={stats.isLoading}
        />
        <StatsCard
          icon={<Flame className="h-5 w-5 text-orange-400" />}
          label="Total Volume"
          value={stats.data?.totalVolume ? formatWeight(Number(stats.data.totalVolume)) : formatWeight(0)}
          loading={stats.isLoading}
        />
        <StatsCard
          icon={<Target className="h-5 w-5 text-blue-400" />}
          label="Total Reps"
          value={stats.data?.totalReps ? Number(stats.data.totalReps).toLocaleString() : "0"}
          loading={stats.isLoading}
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
          label="Exercises Done"
          value={stats.data?.uniqueExercises ?? 0}
          loading={stats.isLoading}
        />
      </div>

      {/* Active Session Banner */}
      {activeSession.data && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{activeSession.data.name}</p>
                <p className="text-sm text-muted-foreground">Workout in progress</p>
              </div>
            </div>
            <Button onClick={() => setLocation("/workout")} variant="outline" size="sm" className="gap-1">
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setLocation("/plans")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              My Workout Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plans.isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <p className="text-muted-foreground text-sm">
                {plans.data?.length ? `${plans.data.length} plan${plans.data.length > 1 ? "s" : ""} saved` : "No plans yet. Create one to get started!"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setLocation("/exercises")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Exercise Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Browse 90+ exercises with detailed instructions and filters.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Personal Records */}
      {prs.data && prs.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Personal Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {prs.data.map((pr: any) => (
                <div key={pr.id} className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="font-semibold text-sm text-foreground">{pr.exerciseName}</p>
                  <p className="text-2xl font-black text-primary mt-1">{formatWeight(pr.maxWeightKg)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pr.repsAtMax} rep{pr.repsAtMax !== 1 ? "s" : ""} &middot; {new Date(pr.achievedAt).toLocaleDateString()}
                  </p>
                  {pr.previousMaxKg && (
                    <p className="text-xs text-emerald-400 mt-0.5">
                      +{formatWeight(pr.maxWeightKg - pr.previousMaxKg)} from previous
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Workouts */}
      {stats.data?.recentSessions && stats.data.recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Workouts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.data.recentSessions.map((session: any) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                onClick={() => setLocation(`/sessions/${session.id}`)}
              >
                <div>
                  <p className="font-medium text-sm text-foreground">{session.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.startedAt).toLocaleDateString()} &middot;{" "}
                    {session.durationSeconds ? `${Math.round(session.durationSeconds / 60)} min` : "N/A"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatsCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: string | number; loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            {loading ? (
              <Skeleton className="h-6 w-16 mt-1" />
            ) : (
              <p className="text-lg font-bold text-foreground truncate">{value}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
