import { useAuth } from "@/_core/hooks/useAuth";
import { useUnit } from "@/hooks/useUnit";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Play, Pause, Square, Clock, Dumbbell, Plus, Check, X,
  ChevronDown, ChevronUp, Timer, SkipForward, Trophy, Zap, Bookmark
} from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { buildExerciseImageNameMap, normalizeExerciseName } from "@shared/exerciseImages";

// ==================== REST TIMER ====================
function RestTimer({
  initialSeconds,
  onComplete,
  onSkip,
}: {
  initialSeconds: number;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(initialSeconds);
    setIsPaused(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused || remaining <= 0) {
      if (remaining <= 0) onComplete();
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, remaining, onComplete]);

  const progress = ((initialSeconds - remaining) / initialSeconds) * 100;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center">
      <div className="text-center space-y-8 p-8 max-w-sm w-full">
        <div className="space-y-2">
          <Timer className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Rest Time</h2>
        </div>
        <div className="relative">
          <div className="text-7xl font-black text-foreground tabular-nums tracking-tight">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </div>
          <Progress value={progress} className="h-2 mt-4" />
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" size="lg" onClick={() => setIsPaused(!isPaused)} className="gap-2">
            {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button size="lg" onClick={onSkip} className="gap-2">
            <SkipForward className="h-5 w-5" /> Skip
          </Button>
        </div>
      </div>
    </div>
  );
}

// Helper: detect if target reps string indicates time-based exercise (e.g. "30s", "60s", "1min")
function isTimeBasedReps(targetReps: string): boolean {
  if (!targetReps) return false;
  const t = targetReps.toLowerCase().trim();
  return /\d+\s*s(econd)?s?$/i.test(t) || /\d+\s*min(ute)?s?$/i.test(t) || /^\d+s$/.test(t) || /^\d+min$/.test(t);
}

// ==================== EXERCISE SET ROW (reps x weight) ====================
function SetRow({
  setNumber,
  onLog,
  isPending,
  previousData,
  targetReps,
  weightUnit,
  previousWeightDisplay,
}: {
  setNumber: number;
  onLog: (reps: number, weightInUserUnit: number) => void;
  isPending: boolean;
  previousData?: { reps?: number | null; weightKg?: number | null };
  targetReps?: string;
  weightUnit: "kg" | "lbs";
  previousWeightDisplay: string;
}) {
  const defaultReps = previousData?.reps?.toString() ?? (targetReps ? targetReps.split("-")[0].replace(/\D/g, "") : "");
  const [reps, setReps] = useState(defaultReps);
  const [weight, setWeight] = useState(previousWeightDisplay);

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm font-mono text-muted-foreground w-8 shrink-0">#{setNumber}</span>
      <div className="flex-1 flex items-center gap-2">
        <Input type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} className="w-20 h-9 text-center" />
        <span className="text-muted-foreground text-xs">x</span>
        <Input type="number" placeholder={weightUnit} value={weight} onChange={e => setWeight(e.target.value)} className="w-24 h-9 text-center" step="0.5" />
      </div>
      <Button size="sm" onClick={() => onLog(Number(reps) || 0, Number(weight) || 0)} disabled={isPending} className="gap-1 h-9">
        <Check className="h-4 w-4" /> Log
      </Button>
    </div>
  );
}

// ==================== TIME-BASED SET ROW ====================
function TimeSetRow({
  setNumber,
  onLog,
  isPending,
  previousData,
  targetReps,
  weightUnit,
  previousWeightDisplay,
}: {
  setNumber: number;
  onLog: (durationSeconds: number, weightInUserUnit: number) => void;
  isPending: boolean;
  previousData?: { durationSeconds?: number | null; weightKg?: number | null };
  targetReps?: string;
  weightUnit: "kg" | "lbs";
  previousWeightDisplay: string;
}) {
  const defaultDuration = previousData?.durationSeconds?.toString() ?? "";
  const [duration, setDuration] = useState(defaultDuration);
  const [weight, setWeight] = useState(previousWeightDisplay);

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm font-mono text-muted-foreground w-8 shrink-0">#{setNumber}</span>
      <div className="flex-1 flex items-center gap-2">
        <Input
          type="number"
          placeholder="Sec"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          className="w-20 h-9 text-center"
        />
        <span className="text-muted-foreground text-xs">sec</span>
        <Input
          type="number"
          placeholder={weightUnit}
          value={weight}
          onChange={e => setWeight(e.target.value)}
          className="w-24 h-9 text-center"
          step="0.5"
        />
      </div>
      <Button
        size="sm"
        onClick={() => onLog(Number(duration) || 0, Number(weight) || 0)}
        disabled={isPending}
        className="gap-1 h-9"
      >
        <Check className="h-4 w-4" /> Log
      </Button>
    </div>
  );
}

// ==================== EXERCISE CARD ====================
function ExerciseBlock({
  exerciseName,
  targetSets,
  targetReps,
  restSeconds,
  notes,
  sessionId,
  onSetLogged,
  loggedSets,
  formatWeight,
  inputToKg,
  weightUnit,
  kgToDisplay,
  imageUrl,
}: {
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  notes?: string;
  sessionId: number;
  onSetLogged: (restSecs: number) => void;
  loggedSets: Array<{ setNumber: number; reps?: number | null; weightKg?: number | null; durationSeconds?: number | null }>;
  formatWeight: (kg: number | null | undefined) => string;
  inputToKg: (value: number) => number;
  weightUnit: "kg" | "lbs";
  kgToDisplay: (kg: number) => number;
  imageUrl?: string | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const utils = trpc.useUtils();
  const logSet = trpc.sessions.logSet.useMutation({
    onSuccess: (data: any) => {
      utils.sessions.get.invalidate();
      if (data?.newPR) {
        toast.success(`🏆 New Personal Record! ${exerciseName}: ${formatWeight(data.prWeight)}`, { duration: 5000 });
        utils.prs.getAll.invalidate();
      }
      onSetLogged(restSeconds);
    },
  });

  const completedSets = loggedSets.length;
  const nextSetNumber = completedSets + 1;
  const allDone = completedSets >= targetSets;
  const timeBased = isTimeBasedReps(targetReps);

  return (
    <Card className={allDone ? "border-primary/30 bg-primary/5" : ""}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${allDone ? "bg-primary/20" : "bg-secondary"}`}>
              {imageUrl ? (
                <img src={imageUrl} alt={`${exerciseName} demo`} className="h-8 w-8 rounded-lg object-cover" />
              ) : allDone ? (
                <Trophy className="h-4 w-4 text-primary" />
              ) : (
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{exerciseName}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {completedSets}/{targetSets} sets &middot; {timeBased ? targetReps : `${targetReps} reps`} &middot; {restSeconds}s rest
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={allDone ? "default" : "outline"} className="text-xs">
              {completedSets}/{targetSets}
            </Badge>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          {notes && <p className="text-xs text-muted-foreground italic mb-3">{notes}</p>}
          {loggedSets.map(log => (
            <div key={log.setNumber} className="flex items-center gap-3 py-2 opacity-70">
              <span className="text-sm font-mono text-muted-foreground w-8">#{log.setNumber}</span>
              <div className="flex-1 text-sm text-foreground">
                {log.durationSeconds != null
                  ? `${log.durationSeconds} sec${log.weightKg ? ` x ${formatWeight(log.weightKg)}` : ""}`
                  : `${log.reps ?? 0} reps x ${formatWeight(log.weightKg ?? null)}`}
              </div>
              <Check className="h-4 w-4 text-primary" />
            </div>
          ))}
          {!allDone && (timeBased ? (
            <TimeSetRow
              setNumber={nextSetNumber}
              targetReps={targetReps}
              onLog={(durationSeconds, weightInUserUnit) => {
                logSet.mutate({
                  sessionId,
                  exerciseName,
                  setNumber: nextSetNumber,
                  durationSeconds: durationSeconds || undefined,
                  weightKg: weightInUserUnit > 0 ? inputToKg(weightInUserUnit) : undefined,
                  completed: true,
                });
              }}
              isPending={logSet.isPending}
              previousData={loggedSets[loggedSets.length - 1]}
              weightUnit={weightUnit}
              previousWeightDisplay={
                loggedSets[loggedSets.length - 1]?.weightKg != null
                  ? String(kgToDisplay(loggedSets[loggedSets.length - 1]!.weightKg!))
                  : ""
              }
            />
          ) : (
            <SetRow
              setNumber={nextSetNumber}
              targetReps={targetReps}
              onLog={(reps, weightInUserUnit) => {
                logSet.mutate({
                  sessionId,
                  exerciseName,
                  setNumber: nextSetNumber,
                  reps,
                  weightKg: inputToKg(weightInUserUnit),
                  completed: true,
                });
              }}
              isPending={logSet.isPending}
              previousData={loggedSets[loggedSets.length - 1]}
              weightUnit={weightUnit}
              previousWeightDisplay={
                loggedSets[loggedSets.length - 1]?.weightKg != null
                  ? String(kgToDisplay(loggedSets[loggedSets.length - 1]!.weightKg!))
                  : ""
              }
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

// ==================== MAIN COMPONENT ====================
export default function ActiveWorkout({ sessionId }: { sessionId?: number }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { formatWeight, inputToKg, weightUnit, kgToDisplay } = useUnit();
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const utils = trpc.useUtils();

  const activeSession = trpc.sessions.active.useQuery(undefined, { enabled: isAuthenticated && !sessionId });
  const currentSessionId = sessionId ?? activeSession.data?.id;

  const sessionDetail = trpc.sessions.get.useQuery(
    { id: currentSessionId ?? 0 },
    { enabled: isAuthenticated && !!currentSessionId, refetchInterval: 5000 }
  );
  const session = sessionDetail.data;

  // Fetch plan day exercises when session has a planDayId
  const planDayExercises = trpc.planDay.getExercises.useQuery(
    { planDayId: session?.planDayId ?? 0 },
    { enabled: isAuthenticated && !!session?.planDayId }
  );

  // Template exercises stored in state (populated when starting from template)
  const [templateExercises, setTemplateExercises] = useState<Array<{ exerciseName: string; sets: number; reps: string; weightKg: number | null; restSeconds: number; orderIndex: number }>>([]);

  const plans = trpc.plans.list.useQuery(undefined, { enabled: isAuthenticated });
  const templates = trpc.templates.list.useQuery(undefined, { enabled: isAuthenticated });
  const exerciseLibrary = trpc.exercises.list.useQuery({ limit: 100 }, { enabled: isAuthenticated });

  const startFromTemplate = trpc.templates.startSession.useMutation({
    onSuccess: (data) => {
      utils.sessions.active.invalidate();
      setTemplateExercises(data.exercises);
      toast.success("Workout started from template!");
    },
  });

  const startSession = trpc.sessions.start.useMutation({
    onSuccess: () => {
      utils.sessions.active.invalidate();
      toast.success("Workout started!");
    },
  });

  const [showSaveTemplatePrompt, setShowSaveTemplatePrompt] = useState(false);
  const [justCompletedSession, setJustCompletedSession] = useState<{ id: number; name: string } | null>(null);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

  const completeSession = trpc.sessions.complete.useMutation({
    onSuccess: (updatedSession) => {
      utils.sessions.active.invalidate();
      utils.sessions.get.invalidate();
      toast.success("Workout completed! Great job!");
      const hasLogs = (session?.logs?.length ?? 0) > 0;
      if (updatedSession && hasLogs) {
        setJustCompletedSession({ id: updatedSession.id, name: updatedSession.name });
        setShowSaveTemplatePrompt(true);
      } else {
        setLocation("/");
      }
    },
  });

  const handleSkipSaveTemplate = () => {
    setShowSaveTemplatePrompt(false);
    setJustCompletedSession(null);
    setLocation("/");
  };

  const saveTemplate = trpc.templates.createFromSession.useMutation({
    onSuccess: () => {
      toast.success("Template saved! You can start new workouts from it anytime.");
      setShowSaveTemplatePrompt(false);
      setJustCompletedSession(null);
      utils.templates.list.invalidate();
      setLocation("/");
    },
    onError: (err) => {
      toast.error("Failed to save template", { description: err.message });
    },
  });

  const abandonSession = trpc.sessions.abandon.useMutation({
    onSuccess: () => {
      utils.sessions.active.invalidate();
      toast.info("Workout abandoned.");
      setLocation("/");
    },
  });

  // Elapsed timer
  useEffect(() => {
    if (session?.status === "active") {
      const start = new Date(session.startedAt).getTime();
      const update = () => setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
      update();
      timerRef.current = setInterval(update, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [session?.status, session?.startedAt]);

  const handleSetLogged = useCallback((restSecs: number) => {
    setRestDuration(restSecs);
    setShowRestTimer(true);
  }, []);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Group logs by exercise name
  const logsByExercise = useMemo(() => {
    if (!session?.logs) return {};
    return session.logs.reduce<Record<string, Array<{ setNumber: number; reps?: number | null; weightKg?: number | null; durationSeconds?: number | null }>>>((acc, log) => {
      if (!acc[log.exerciseName]) acc[log.exerciseName] = [];
      acc[log.exerciseName].push({ setNumber: log.setNumber, reps: log.reps, weightKg: log.weightKg, durationSeconds: log.durationSeconds });
      return acc;
    }, {});
  }, [session?.logs]);

  // Build the exercise list: plan exercises OR template exercises
  const planExercises = useMemo(() => {
    // First check plan day exercises
    if (planDayExercises.data && planDayExercises.data.length > 0) {
      return planDayExercises.data.map(ex => ({
        name: ex.exerciseName,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.restSeconds,
        notes: ex.notes ?? undefined,
      }));
    }
    // Then check template exercises
    if (templateExercises.length > 0) {
      return templateExercises.map(ex => ({
        name: ex.exerciseName,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.restSeconds,
        notes: undefined,
      }));
    }
    return [];
  }, [planDayExercises.data, templateExercises]);

  const imageByExerciseName = useMemo(
    () => buildExerciseImageNameMap(exerciseLibrary.data?.exercises ?? []),
    [exerciseLibrary.data?.exercises]
  );

  // No active session - show start options
  if (!currentSessionId || !session || session.status !== "active") {
    return (
      <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Start a Workout</h1>
          <p className="text-muted-foreground mt-1">Choose a plan to start or begin a quick workout</p>
        </div>

        <Button
          onClick={() => startSession.mutate({ name: "Quick Workout" })}
          disabled={startSession.isPending}
          className="w-full glow-primary gap-2"
          size="lg"
        >
          <Play className="h-5 w-5" /> Start Quick Workout
        </Button>

        {templates.data && templates.data.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Start from a Template</h2>
            <p className="text-xs text-muted-foreground">Saved workouts with exercises pre-loaded</p>
            {templates.data.map(template => (
              <Card
                key={template.id}
                className="hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => startFromTemplate.mutate({ templateId: template.id })}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bookmark className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{template.name}</p>
                      {template.description && <p className="text-xs text-muted-foreground">{template.description}</p>}
                    </div>
                  </div>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {plans.data && plans.data.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Start from a Plan</h2>
            <p className="text-xs text-muted-foreground">Go to a plan to start a specific day</p>
            {plans.data.map(plan => (
              <Card key={plan.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setLocation(`/plans/${plan.id}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.daysPerWeek} days/week</p>
                    </div>
                  </div>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showSaveTemplatePrompt} onOpenChange={(open) => !open && handleSkipSaveTemplate()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Template?</DialogTitle>
            <DialogDescription>
              Save this workout as a reusable template? You can start new sessions from it anytime with all exercises pre-loaded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleSkipSaveTemplate}>
              Skip
            </Button>
            <Button
              onClick={() => {
                if (justCompletedSession) {
                  saveTemplate.mutate({
                    sessionId: justCompletedSession.id,
                    name: justCompletedSession.name,
                  });
                }
              }}
              disabled={saveTemplate.isPending || !justCompletedSession}
              className="gap-2"
            >
              {saveTemplate.isPending ? (
                <>Saving...</>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" /> Save as Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
    );
  }

  // Determine if this is a plan-based or template-based workout
  const isPlanWorkout = planExercises.length > 0;

  // Calculate overall progress for plan workouts
  const totalPlanSets = planExercises.reduce((sum, ex) => sum + ex.sets, 0);
  const totalLoggedSets = session.logs?.length ?? 0;
  const overallProgress = totalPlanSets > 0 ? Math.min((totalLoggedSets / totalPlanSets) * 100, 100) : 0;

  return (
    <div className="space-y-4">
      {showRestTimer && (
        <RestTimer
          initialSeconds={restDuration}
          onComplete={() => setShowRestTimer(false)}
          onSkip={() => setShowRestTimer(false)}
        />
      )}

      {/* Session Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{session.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" /> {formatTime(elapsedSeconds)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {totalLoggedSets} sets logged
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAbandonConfirm(true)}
            className="gap-1 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" /> Abandon
          </Button>
          <Button
            size="sm"
            onClick={() => completeSession.mutate({ sessionId: session.id })}
            disabled={completeSession.isPending}
            className="gap-1 glow-primary"
          >
            <Square className="h-4 w-4" /> Finish
          </Button>
        </div>
      </div>

      {/* Overall Progress Bar for plan workouts */}
      {isPlanWorkout && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Workout Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      )}

      {/* Plan Exercises (auto-populated) */}
      {isPlanWorkout && (
        <div className="space-y-4">
          {planExercises.map((ex, idx) => (
            <ExerciseBlock
              key={`plan-${ex.name}-${idx}`}
              exerciseName={ex.name}
              targetSets={ex.sets}
              targetReps={ex.reps}
              restSeconds={ex.rest}
              notes={ex.notes}
              sessionId={session.id}
              onSetLogged={handleSetLogged}
              loggedSets={logsByExercise[ex.name] ?? []}
              formatWeight={formatWeight}
              inputToKg={inputToKg}
              weightUnit={weightUnit}
              kgToDisplay={kgToDisplay}
              imageUrl={imageByExerciseName[normalizeExerciseName(ex.name)]?.imageUrl ?? null}
            />
          ))}
        </div>
      )}

      {/* For quick workouts OR extra exercises added manually */}
      <ManualExerciseSection
        sessionId={session.id}
        onSetLogged={handleSetLogged}
        logsByExercise={logsByExercise}
        planExerciseNames={planExercises.map(e => e.name)}
        isQuickWorkout={!isPlanWorkout}
        formatWeight={formatWeight}
        inputToKg={inputToKg}
        weightUnit={weightUnit}
        kgToDisplay={kgToDisplay}
        imageByExerciseName={imageByExerciseName}
      />

      {/* Abandon confirmation */}
      <AlertDialog open={showAbandonConfirm} onOpenChange={setShowAbandonConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abandon this workout?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will not be saved. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => abandonSession.mutate({ sessionId: session.id })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Abandon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Post-workout Save as Template prompt (also here in case refetch is delayed) */}
      <Dialog open={showSaveTemplatePrompt} onOpenChange={(open) => !open && handleSkipSaveTemplate()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Template?</DialogTitle>
            <DialogDescription>
              Save this workout as a reusable template? You can start new sessions from it anytime with all exercises pre-loaded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleSkipSaveTemplate}>
              Skip
            </Button>
            <Button
              onClick={() => {
                if (justCompletedSession) {
                  saveTemplate.mutate({
                    sessionId: justCompletedSession.id,
                    name: justCompletedSession.name,
                  });
                }
              }}
              disabled={saveTemplate.isPending || !justCompletedSession}
              className="gap-2"
            >
              {saveTemplate.isPending ? (
                <>Saving...</>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" /> Save as Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== MANUAL EXERCISE SECTION ====================
function ManualExerciseSection({
  sessionId,
  onSetLogged,
  logsByExercise,
  planExerciseNames,
  isQuickWorkout,
  formatWeight,
  inputToKg,
  weightUnit,
  kgToDisplay,
  imageByExerciseName,
}: {
  sessionId: number;
  onSetLogged: (restSecs: number) => void;
  logsByExercise: Record<string, Array<{ setNumber: number; reps?: number | null; weightKg?: number | null; durationSeconds?: number | null }>>;
  planExerciseNames: string[];
  isQuickWorkout: boolean;
  formatWeight: (kg: number | null | undefined) => string;
  inputToKg: (value: number) => number;
  weightUnit: "kg" | "lbs";
  kgToDisplay: (kg: number) => number;
  imageByExerciseName: Record<string, { imageUrl: string | null; imageUrls: string[] }>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [targetSets, setTargetSets] = useState("3");
  const [targetReps, setTargetReps] = useState("10");
  const [restSeconds, setRestSeconds] = useState("90");
  const [manualExercises, setManualExercises] = useState<Array<{ name: string; sets: number; reps: string; rest: number; notes?: string }>>([]);

  const { data: exerciseList } = trpc.exercises.list.useQuery({ limit: 100 });

  const addExercise = () => {
    if (!exerciseName.trim()) {
      toast.error("Enter an exercise name");
      return;
    }
    setManualExercises(prev => [...prev, {
      name: exerciseName.trim(),
      sets: Number(targetSets) || 3,
      reps: targetReps || "10",
      rest: Number(restSeconds) || 90,
    }]);
    setExerciseName("");
    setShowAdd(false);
  };

  // For quick workouts, also show exercises that were logged but not in manual list
  const orphanExerciseNames = isQuickWorkout
    ? Object.keys(logsByExercise).filter(name => !manualExercises.some(e => e.name === name))
    : Object.keys(logsByExercise).filter(name => !planExerciseNames.includes(name) && !manualExercises.some(e => e.name === name));

  return (
    <div className="space-y-4">
      {/* Orphan logged exercises (from previous session state) */}
      {orphanExerciseNames.map(name => (
        <ExerciseBlock
          key={`orphan-${name}`}
          exerciseName={name}
          targetSets={99}
          targetReps="--"
          restSeconds={90}
          sessionId={sessionId}
          onSetLogged={onSetLogged}
          loggedSets={logsByExercise[name] ?? []}
          formatWeight={formatWeight}
          inputToKg={inputToKg}
          weightUnit={weightUnit}
          kgToDisplay={kgToDisplay}
          imageUrl={imageByExerciseName[normalizeExerciseName(name)]?.imageUrl ?? null}
        />
      ))}

      {/* Manually added exercises */}
      {manualExercises.map((ex, idx) => (
        <ExerciseBlock
          key={`manual-${ex.name}-${idx}`}
          exerciseName={ex.name}
          targetSets={ex.sets}
          targetReps={ex.reps}
          restSeconds={ex.rest}
          notes={ex.notes}
          sessionId={sessionId}
          onSetLogged={onSetLogged}
          loggedSets={logsByExercise[ex.name] ?? []}
          formatWeight={formatWeight}
          inputToKg={inputToKg}
          weightUnit={weightUnit}
          kgToDisplay={kgToDisplay}
          imageUrl={imageByExerciseName[normalizeExerciseName(ex.name)]?.imageUrl ?? null}
        />
      ))}

      {/* Add Exercise Button */}
      {showAdd ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              <Input
                placeholder="Exercise name (e.g., Bench Press)"
                value={exerciseName}
                onChange={e => setExerciseName(e.target.value)}
                list="exercise-suggestions"
                autoFocus
              />
              <datalist id="exercise-suggestions">
                {exerciseList?.exercises.map(ex => (
                  <option key={ex.id} value={ex.name} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Sets</label>
                <Input type="number" value={targetSets} onChange={e => setTargetSets(e.target.value)} className="h-9" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Reps</label>
                <Input value={targetReps} onChange={e => setTargetReps(e.target.value)} className="h-9" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Rest (s)</label>
                <Input type="number" value={restSeconds} onChange={e => setRestSeconds(e.target.value)} className="h-9" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addExercise} className="flex-1 gap-1"><Check className="h-4 w-4" /> Add</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setShowAdd(true)} className="w-full gap-2 border-dashed">
          <Plus className="h-4 w-4" /> Add Custom Exercise
        </Button>
      )}
    </div>
  );
}
