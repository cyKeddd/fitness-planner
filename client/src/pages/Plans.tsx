import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dumbbell, Plus, Sparkles, ChevronRight, Calendar, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Plans() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: plans, isLoading } = trpc.plans.list.useQuery(undefined, { enabled: isAuthenticated });
  const [planToDelete, setPlanToDelete] = useState<{ id: number; name: string } | null>(null);

  const deletePlan = trpc.plans.delete.useMutation({
    onSuccess: () => {
      utils.plans.list.invalidate();
      toast.success("Plan deleted");
      setPlanToDelete(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Workout Plans</h1>
          <p className="text-muted-foreground mt-1">Manage your workout routines</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation("/generate")} className="gap-2">
            <Sparkles className="h-4 w-4" /> AI Generate
          </Button>
          <Button onClick={() => {
            // Create a blank plan
            toast.info("Use AI Generate to create a new plan, or browse the exercise library to build one manually.");
            setLocation("/generate");
          }} className="gap-2">
            <Plus className="h-4 w-4" /> New Plan
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid gap-4">
          {plans.map(plan => (
            <Card
              key={plan.id}
              className="hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => setLocation(`/plans/${plan.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">{plan.description ?? "No description"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {plan.isAiGenerated && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Sparkles className="h-3 w-3" /> AI Generated
                          </Badge>
                        )}
                        {plan.daysPerWeek && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Calendar className="h-3 w-3" /> {plan.daysPerWeek} days/week
                          </Badge>
                        )}
                        {plan.goalFocus && (
                          <Badge variant="outline" className="text-xs">{plan.goalFocus}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlanToDelete({ id: plan.id, name: plan.name });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <AlertDialog open={planToDelete !== null} onOpenChange={() => setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              {planToDelete && `"${planToDelete.name}" will be permanently deleted. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => planToDelete && deletePlan.mutate({ id: planToDelete.id })}
              disabled={deletePlan.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!isLoading && (!plans || plans.length === 0) ? (
        <div className="text-center py-16">
          <Dumbbell className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No workout plans yet</h3>
          <p className="text-muted-foreground mb-6">Create your first plan with AI or build one manually.</p>
          <Button onClick={() => setLocation("/generate")} className="glow-primary gap-2">
            <Sparkles className="h-4 w-4" /> Generate with AI
          </Button>
        </div>
      ) : null}
    </div>
  );
}
