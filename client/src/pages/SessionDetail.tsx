import { useAuth } from "@/_core/hooks/useAuth";
import { useUnit } from "@/hooks/useUnit";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { ArrowLeft, Clock, Dumbbell, Calendar, Bookmark, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function SessionDetail({ id }: { id: number }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { formatWeight } = useUnit();
  const { data: session, isLoading } = trpc.sessions.get.useQuery({ id }, { enabled: isAuthenticated });
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");

  const utils = trpc.useUtils();
  const saveTemplate = trpc.templates.createFromSession.useMutation({
    onSuccess: () => {
      toast.success("Template saved!", { description: "You can start new workouts from this template anytime." });
      setShowTemplateDialog(false);
      setTemplateName("");
      setTemplateDesc("");
      utils.templates.list.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to save template", { description: err.message });
    },
  });

  if (isLoading) return <div className="max-w-2xl space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  if (!session) return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Session not found.</p>
      <Button variant="outline" onClick={() => setLocation("/")} className="mt-4">Back to Dashboard</Button>
    </div>
  );

  // Group logs by exercise
  const grouped = session.logs.reduce<Record<string, typeof session.logs>>((acc, log) => {
    if (!acc[log.exerciseName]) acc[log.exerciseName] = [];
    acc[log.exerciseName].push(log);
    return acc;
  }, {});

  const handleOpenTemplateDialog = () => {
    setTemplateName(session.name);
    setTemplateDesc("");
    setShowTemplateDialog(true);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    saveTemplate.mutate({
      sessionId: session.id,
      name: templateName.trim(),
      description: templateDesc.trim() || undefined,
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {session.status === "completed" && session.logs.length > 0 && (
          <Button variant="outline" onClick={handleOpenTemplateDialog} className="gap-2">
            <Bookmark className="h-4 w-4" /> Save as Template
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{session.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <Badge variant={session.status === "completed" ? "default" : session.status === "active" ? "secondary" : "outline"}>
            {session.status}
          </Badge>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(session.startedAt).toLocaleDateString()}
          </span>
          {session.durationSeconds && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {Math.round(session.durationSeconds / 60)} min
            </span>
          )}
        </div>
      </div>

      {Object.entries(grouped).map(([name, logs]) => (
        <Card key={name}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" /> {name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium pb-2 border-b border-border">
                <span>Set</span><span>Reps / Duration</span><span>Weight</span><span>Status</span>
              </div>
              {logs.map(log => (
                <div key={log.id} className="grid grid-cols-4 gap-2 text-sm py-2">
                  <span className="text-foreground">{log.setNumber}</span>
                  <span className="text-foreground">
                    {log.durationSeconds != null ? `${log.durationSeconds} sec` : (log.reps ?? "—")}
                  </span>
                  <span className="text-foreground">{formatWeight(log.weightKg ?? null)}</span>
                  <span>{log.completed ? <Badge variant="secondary" className="text-xs">Done</Badge> : <Badge variant="outline" className="text-xs">Skipped</Badge>}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {session.logs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No exercises logged in this session.</p>
        </div>
      )}

      {session.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">{session.notes}</p></CardContent>
        </Card>
      )}

      {/* Save as Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this workout as a reusable template. You can start new sessions from it anytime with all exercises pre-loaded.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="e.g., Push Day, Full Body Friday"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-desc">Description (optional)</Label>
              <Input
                id="template-desc"
                value={templateDesc}
                onChange={e => setTemplateDesc(e.target.value)}
                placeholder="Brief description of this workout"
              />
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground font-medium mb-2">Exercises included:</p>
              <div className="space-y-1">
                {Object.entries(grouped).map(([name, logs]) => (
                  <p key={name} className="text-sm text-foreground">
                    {name} — {logs.length} set{logs.length !== 1 ? "s" : ""}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim() || saveTemplate.isPending}
              className="gap-2"
            >
              {saveTemplate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
