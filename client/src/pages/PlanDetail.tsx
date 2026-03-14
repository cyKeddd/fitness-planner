import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Play, Dumbbell, Clock, Sparkles, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function PlanDetail({ id }: { id: number }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: plan, isLoading } = trpc.plans.get.useQuery({ id }, { enabled: isAuthenticated });
  const startSession = trpc.sessions.start.useMutation({
    onSuccess: (session) => {
      if (session) {
        toast.success("Workout started!");
        setLocation("/workout");
      }
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Plan not found.</p>
        <Button variant="outline" onClick={() => setLocation("/plans")} className="mt-4">Back to Plans</Button>
      </div>
    );
  }

  const handleStartDay = (day: typeof plan.days[0]) => {
    startSession.mutate({
      planDayId: day.id,
      name: `${plan.name} - ${day.name}`,
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Button variant="ghost" onClick={() => setLocation("/plans")} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to Plans
      </Button>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{plan.name}</h1>
            {plan.description && <p className="text-muted-foreground mt-1">{plan.description}</p>}
            <div className="flex items-center gap-2 mt-2">
              {plan.isAiGenerated && (
                <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> AI Generated</Badge>
              )}
              {plan.daysPerWeek && (
                <Badge variant="outline" className="gap-1"><Calendar className="h-3 w-3" /> {plan.daysPerWeek} days/week</Badge>
              )}
              {plan.goalFocus && <Badge variant="outline">{plan.goalFocus}</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="space-y-4">
        {plan.days.map((day) => (
          <Card key={day.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {day.dayNumber}
                  </div>
                  {day.name}
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => handleStartDay(day)}
                  disabled={startSession.isPending}
                  className="gap-1"
                >
                  <Play className="h-4 w-4" /> Start
                </Button>
              </div>
              {day.description && <p className="text-sm text-muted-foreground mt-1">{day.description}</p>}
            </CardHeader>
            <CardContent className="space-y-2">
              {day.exercises.map((ex, idx) => (
                <div key={ex.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{ex.exerciseName}</p>
                      {ex.notes && <p className="text-xs text-muted-foreground truncate">{ex.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Dumbbell className="h-3 w-3" />
                      <span>{ex.sets} x {ex.reps}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{ex.restSeconds}s</span>
                    </div>
                  </div>
                </div>
              ))}
              {day.exercises.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No exercises in this day.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {plan.days.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">This plan has no workout days yet.</p>
        </div>
      )}
    </div>
  );
}
