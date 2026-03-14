import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Dumbbell } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const GOAL_OPTIONS = [
  { value: "muscle_gain", label: "Muscle Gain / Hypertrophy" },
  { value: "fat_loss", label: "Fat Loss / Weight Loss" },
  { value: "strength", label: "Strength Building" },
  { value: "endurance", label: "Endurance / Stamina" },
  { value: "general_fitness", label: "General Fitness" },
  { value: "athletic_performance", label: "Athletic Performance" },
  { value: "flexibility", label: "Flexibility & Mobility" },
];

export default function GeneratePlan() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [goalFocus, setGoalFocus] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("4");
  const [sessionDuration, setSessionDuration] = useState("60");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const generatePlan = trpc.ai.generatePlan.useMutation({
    onSuccess: (result) => {
      toast.success(`Plan "${result.name}" created!`);
      setLocation(`/plans/${result.planId}`);
    },
    onError: (err) => {
      toast.error("Failed to generate plan: " + err.message);
    },
  });

  const handleGenerate = () => {
    if (!goalFocus) {
      toast.error("Please select a goal focus");
      return;
    }
    generatePlan.mutate({
      goalFocus,
      daysPerWeek: Number(daysPerWeek),
      sessionDuration: Number(sessionDuration),
      additionalNotes: additionalNotes || undefined,
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">AI Workout Generator</h1>
        <p className="text-muted-foreground">
          Tell us your goals and we'll create a personalized workout plan using AI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Settings</CardTitle>
          <CardDescription>Configure your ideal workout plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Primary Goal *</Label>
            <Select value={goalFocus} onValueChange={setGoalFocus}>
              <SelectTrigger>
                <SelectValue placeholder="Select your primary goal" />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Days per Week</Label>
              <Select value={daysPerWeek} onValueChange={setDaysPerWeek}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} day{n > 1 ? "s" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Session Duration (min)</Label>
              <Input
                type="number"
                value={sessionDuration}
                onChange={e => setSessionDuration(e.target.value)}
                min={15}
                max={180}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Additional Notes (optional)</Label>
            <Textarea
              placeholder="e.g., Focus on upper body, prefer compound movements, avoid overhead pressing..."
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generatePlan.isPending || !goalFocus}
            className="w-full glow-primary gap-2"
            size="lg"
          >
            {generatePlan.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating your plan...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Workout Plan
              </>
            )}
          </Button>

          {generatePlan.isPending && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Our AI is crafting a personalized plan based on your profile and goals. This may take 15-30 seconds.
              </p>
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="p-4 flex items-center gap-3">
          <Dumbbell className="h-5 w-5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            The AI uses your profile data (fitness level, body type, equipment, injuries) to create a safe and effective plan.
            Make sure your profile is up to date for the best results.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
