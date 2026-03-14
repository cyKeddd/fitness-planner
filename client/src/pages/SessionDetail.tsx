import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, Dumbbell, Calendar } from "lucide-react";
import { useLocation } from "wouter";

export default function SessionDetail({ id }: { id: number }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: session, isLoading } = trpc.sessions.get.useQuery({ id }, { enabled: isAuthenticated });

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

  return (
    <div className="max-w-2xl space-y-6">
      <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

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
                <span>Set</span><span>Reps</span><span>Weight</span><span>Status</span>
              </div>
              {logs.map(log => (
                <div key={log.id} className="grid grid-cols-4 gap-2 text-sm py-2">
                  <span className="text-foreground">{log.setNumber}</span>
                  <span className="text-foreground">{log.reps ?? "—"}</span>
                  <span className="text-foreground">{log.weightKg ? `${log.weightKg} kg` : "—"}</span>
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
    </div>
  );
}
