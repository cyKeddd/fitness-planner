import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bookmark, Play, Trash2, Dumbbell, Calendar, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Templates() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: templates, isLoading } = trpc.templates.list.useQuery(undefined, { enabled: isAuthenticated });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [startingId, setStartingId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const deleteTemplate = trpc.templates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted");
      setDeleteId(null);
      utils.templates.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const startSession = trpc.templates.startSession.useMutation({
    onSuccess: (data) => {
      toast.success("Workout started from template!");
      utils.sessions.active.invalidate();
      // Navigate to active workout with the session and template exercises
      setLocation(`/workout/${data.session.id}?templateId=${data.session.id}`);
    },
    onError: (err) => {
      toast.error("Failed to start workout", { description: err.message });
      setStartingId(null);
    },
  });

  const handleStartFromTemplate = (templateId: number) => {
    setStartingId(templateId);
    startSession.mutate({ templateId });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Workout Templates</h1>
        <p className="text-muted-foreground mt-1">
          Saved workouts you can quickly re-start anytime
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onStart={() => handleStartFromTemplate(template.id)}
              onDelete={() => setDeleteId(template.id)}
              isStarting={startingId === template.id}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Templates Yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Complete a workout and save it as a template from the session detail page. Templates let you quickly re-start your favorite workouts.
            </p>
            <Button variant="outline" onClick={() => setLocation("/")} className="mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this workout template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteTemplate.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TemplateCard({
  template,
  onStart,
  onDelete,
  isStarting,
}: {
  template: any;
  onStart: () => void;
  onDelete: () => void;
  isStarting: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const { data: detail } = trpc.templates.get.useQuery(
    { id: template.id },
    { enabled: isAuthenticated }
  );

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            {template.name}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {template.description && (
          <p className="text-sm text-muted-foreground">{template.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {detail?.exercises && detail.exercises.length > 0 ? (
          <div className="space-y-1.5">
            {detail.exercises.map((ex: any) => (
              <div key={ex.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground flex items-center gap-1.5">
                  <Dumbbell className="h-3 w-3 text-muted-foreground" />
                  {ex.exerciseName}
                </span>
                <span className="text-muted-foreground text-xs">
                  {ex.sets} × {ex.reps}{ex.weightKg ? ` @ ${ex.weightKg}kg` : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Skeleton className="h-16" />
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Created {new Date(template.createdAt).toLocaleDateString()}
          </span>
          <Button
            size="sm"
            onClick={onStart}
            disabled={isStarting}
            className="gap-1.5"
          >
            {isStarting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Start Workout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
