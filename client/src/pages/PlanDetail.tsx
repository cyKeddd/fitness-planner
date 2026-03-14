import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Play, Dumbbell, Clock, Sparkles, Calendar, Pencil, Plus, Trash2, Check, X } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function PlanDetail({ id }: { id: number }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [exerciseToDelete, setExerciseToDelete] = useState<{ id: number; name: string } | null>(null);
  const utils = trpc.useUtils();
  const { data: plan, isLoading } = trpc.plans.get.useQuery({ id }, { enabled: isAuthenticated });
  const { data: exerciseList } = trpc.exercises.list.useQuery({ limit: 100 }, { enabled: isAuthenticated });

  const startSession = trpc.sessions.start.useMutation({
    onSuccess: (session) => {
      if (session) {
        toast.success("Workout started!");
        setLocation("/workout");
      }
    },
  });

  const updatePlan = trpc.plans.update.useMutation({
    onSuccess: () => {
      utils.plans.get.invalidate({ id });
      utils.plans.list.invalidate();
      toast.success("Plan updated");
      setIsEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const addExercise = trpc.plans.addExercise.useMutation({
    onSuccess: () => {
      utils.plans.get.invalidate({ id });
      toast.success("Exercise added");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateExercise = trpc.plans.updateExercise.useMutation({
    onSuccess: () => {
      utils.plans.get.invalidate({ id });
      toast.success("Exercise updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteExercise = trpc.plans.deleteExercise.useMutation({
    onSuccess: () => {
      utils.plans.get.invalidate({ id });
      toast.success("Exercise removed");
      setExerciseToDelete(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const addDay = trpc.plans.addDay.useMutation({
    onSuccess: () => {
      utils.plans.get.invalidate({ id });
      toast.success("Day added");
    },
    onError: (err) => toast.error(err.message),
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

  const handleSavePlan = () => {
    if (!editName.trim()) return;
    updatePlan.mutate({
      id: plan.id,
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });
  };

  const handleStartEdit = () => {
    setEditName(plan.name);
    setEditDescription(plan.description ?? "");
    setIsEditing(true);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Button variant="ghost" onClick={() => setLocation("/plans")} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to Plans
      </Button>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="plan-name">Plan Name</Label>
                  <Input
                    id="plan-name"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="plan-desc">Description</Label>
                  <Textarea
                    id="plan-desc"
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSavePlan} disabled={updatePlan.isPending} className="gap-1">
                    <Check className="h-4 w-4" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="gap-1">
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground">{plan.name}</h1>
                {plan.description && <p className="text-muted-foreground mt-1">{plan.description}</p>}
              </>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {plan.isAiGenerated && (
                <Badge variant="secondary" className="gap-1"><Sparkles className="h-3 w-3" /> AI Generated</Badge>
              )}
              {plan.daysPerWeek && (
                <Badge variant="outline" className="gap-1"><Calendar className="h-3 w-3" /> {plan.daysPerWeek} days/week</Badge>
              )}
              {plan.goalFocus && <Badge variant="outline">{plan.goalFocus}</Badge>}
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={handleStartEdit} className="gap-1 -ml-2">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="space-y-4">
        {plan.days.map((day) => (
          <PlanDayCard
            key={day.id}
            day={day}
            exerciseList={exerciseList?.exercises ?? []}
            onStart={handleStartDay}
            onAddExercise={addExercise}
            onDeleteExercise={(ex) => setExerciseToDelete(ex)}
            startSessionPending={startSession.isPending}
          />
        ))}
        <AddDayCard
          planId={plan.id}
          nextDayNumber={plan.days.length + 1}
          onAdd={addDay}
        />
      </div>

      <AlertDialog open={exerciseToDelete !== null} onOpenChange={() => setExerciseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove exercise?</AlertDialogTitle>
            <AlertDialogDescription>
              {exerciseToDelete && `"${exerciseToDelete.name}" will be removed from this day.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => exerciseToDelete && deleteExercise.mutate({ id: exerciseToDelete.id })}
              disabled={deleteExercise.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {plan.days.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">This plan has no workout days yet.</p>
        </div>
      )}
    </div>
  );
}

function PlanDayCard({
  day,
  exerciseList,
  onStart,
  onAddExercise,
  onDeleteExercise,
  startSessionPending,
}: {
  day: { id: number; planId?: number; dayNumber: number; name: string; description: string | null; exercises: Array<{ id: number; planDayId?: number; exerciseId?: number | null; exerciseName: string; sets: number; reps: string; restSeconds: number; notes: string | null; orderIndex?: number }> };
  exerciseList: Array<{ id: number; name: string }>;
  onStart: (day: any) => void;
  onAddExercise: ReturnType<typeof trpc.plans.addExercise.useMutation>;
  onDeleteExercise: (ex: { id: number; name: string }) => void;
  startSessionPending: boolean;
}) {
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExSets, setNewExSets] = useState("3");
  const [newExReps, setNewExReps] = useState("10");
  const [newExRest, setNewExRest] = useState("90");

  const handleAddExercise = () => {
    if (!newExName.trim()) {
      toast.error("Enter an exercise name");
      return;
    }
    onAddExercise.mutate({
      planDayId: day.id,
      exerciseName: newExName.trim(),
      sets: Number(newExSets) || 3,
      reps: newExReps || "10",
      restSeconds: Number(newExRest) || 90,
      orderIndex: day.exercises.length,
    });
    setNewExName("");
    setShowAddExercise(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {day.dayNumber}
            </div>
            {day.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onStart(day)}
              disabled={startSessionPending}
              className="gap-1"
            >
              <Play className="h-4 w-4" /> Start
            </Button>
          </div>
        </div>
        {day.description && <p className="text-sm text-muted-foreground mt-1">{day.description}</p>}
      </CardHeader>
      <CardContent className="space-y-2">
        {day.exercises.map((ex, idx) => (
          <div key={ex.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 group">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">{idx + 1}</span>
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{ex.exerciseName}</p>
                {ex.notes && <p className="text-xs text-muted-foreground truncate">{ex.notes}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">{ex.sets} x {ex.reps}</span>
                <span className="text-muted-foreground">{ex.restSeconds}s</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDeleteExercise({ id: ex.id, name: ex.exerciseName })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {showAddExercise ? (
          <div className="p-3 rounded-lg border border-dashed space-y-3">
            <Input
              placeholder="Exercise name"
              value={newExName}
              onChange={e => setNewExName(e.target.value)}
              list="plan-exercise-list"
            />
            <datalist id="plan-exercise-list">
              {exerciseList.map(ex => (
                <option key={ex.id} value={ex.name} />
              ))}
            </datalist>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Sets</Label>
                <Input type="number" value={newExSets} onChange={e => setNewExSets(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Reps</Label>
                <Input value={newExReps} onChange={e => setNewExReps(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs">Rest (s)</Label>
                <Input type="number" value={newExRest} onChange={e => setNewExRest(e.target.value)} className="h-9" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddExercise} disabled={onAddExercise.isPending} className="gap-1">
                <Check className="h-4 w-4" /> Add
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddExercise(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={() => setShowAddExercise(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Exercise
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function AddDayCard({
  planId,
  nextDayNumber,
  onAdd,
}: {
  planId: number;
  nextDayNumber: number;
  onAdd: ReturnType<typeof trpc.plans.addDay.useMutation>;
}) {
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd.mutate({
      planId,
      dayNumber: nextDayNumber,
      name: name.trim(),
    });
    setShow(false);
  };

  if (!show) {
    return (
      <Button
        variant="outline"
        className="w-full border-dashed py-8"
        onClick={() => {
          setShow(true);
          setName(`Day ${nextDayNumber}`);
        }}
      >
        <Plus className="h-4 w-4 mr-2" /> Add Day
      </Button>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="p-4 space-y-3">
        <div>
          <Label>Day Name</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Push Day"
            className="mt-1"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAdd} disabled={onAdd.isPending}>
            Add Day
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShow(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
