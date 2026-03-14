import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dumbbell, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const GOALS = [
  { id: "muscle_gain", label: "Muscle Gain", desc: "Build lean muscle mass" },
  { id: "fat_loss", label: "Fat Loss", desc: "Burn fat and lose weight" },
  { id: "strength", label: "Strength", desc: "Get stronger" },
  { id: "endurance", label: "Endurance", desc: "Improve stamina" },
  { id: "general_fitness", label: "General Fitness", desc: "Overall health" },
  { id: "athletic_performance", label: "Athletic Performance", desc: "Sport-specific gains" },
];

const EQUIPMENT = [
  "none", "dumbbells", "barbell", "kettlebell", "resistance_bands",
  "pull_up_bar", "dip_station", "machine", "cable_machine",
  "plyo_box", "yoga_mat", "jump_rope", "medicine_ball",
  "stationary_bike", "rowing_machine", "battle_ropes",
];

const EQUIPMENT_LABELS: Record<string, string> = {
  none: "No Equipment", dumbbells: "Dumbbells", barbell: "Barbell",
  kettlebell: "Kettlebell", resistance_bands: "Resistance Bands",
  pull_up_bar: "Pull-up Bar", dip_station: "Dip Station",
  machine: "Gym Machines", cable_machine: "Cable Machine",
  plyo_box: "Plyo Box", yoga_mat: "Yoga Mat", jump_rope: "Jump Rope",
  medicine_ball: "Medicine Ball", stationary_bike: "Stationary Bike",
  rowing_machine: "Rowing Machine", battle_ropes: "Battle Ropes",
};

export default function Onboarding() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    age: "",
    gender: "",
    heightCm: "",
    weightKg: "",
    fitnessLevel: "" as "" | "beginner" | "intermediate" | "advanced",
    bodyType: "",
    injuries: "",
    goals: [] as string[],
    equipment: [] as string[],
  });

  const upsertProfile = trpc.profile.upsert.useMutation({
    onSuccess: () => {
      toast.success("Profile saved! Let's build your fitness plan.");
      setLocation("/");
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Dumbbell className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Sign in to continue</h2>
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full glow-primary">Sign in</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const toggleGoal = (id: string) => {
    setForm(prev => ({
      ...prev,
      goals: prev.goals.includes(id) ? prev.goals.filter(g => g !== id) : [...prev.goals, id],
    }));
  };

  const toggleEquipment = (id: string) => {
    setForm(prev => ({
      ...prev,
      equipment: prev.equipment.includes(id) ? prev.equipment.filter(e => e !== id) : [...prev.equipment, id],
    }));
  };

  const handleFinish = () => {
    upsertProfile.mutate({
      age: form.age ? Number(form.age) : undefined,
      gender: form.gender || undefined,
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      fitnessLevel: form.fitnessLevel || undefined,
      bodyType: form.bodyType || undefined,
      injuries: form.injuries || undefined,
      goals: form.goals,
      equipment: form.equipment,
      onboardingCompleted: true,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <Dumbbell className="h-10 w-10 text-primary mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Let's set up your profile</h1>
          <p className="text-muted-foreground text-sm">Step {step + 1} of {totalSteps}</p>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardContent className="p-6">
            {step === 0 && (
              <div className="space-y-4">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Tell us about yourself</CardDescription>
                </CardHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input type="number" placeholder="25" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={form.gender} onValueChange={v => setForm(p => ({ ...p, gender: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input type="number" placeholder="175" value={form.heightCm} onChange={e => setForm(p => ({ ...p, heightCm: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input type="number" placeholder="70" value={form.weightKg} onChange={e => setForm(p => ({ ...p, weightKg: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Fitness Profile</CardTitle>
                  <CardDescription>Your current fitness status</CardDescription>
                </CardHeader>
                <div className="space-y-2">
                  <Label>Fitness Level</Label>
                  <Select value={form.fitnessLevel} onValueChange={v => setForm(p => ({ ...p, fitnessLevel: v as any }))}>
                    <SelectTrigger><SelectValue placeholder="Select your level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (0-1 year)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                      <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Body Type</Label>
                  <Select value={form.bodyType} onValueChange={v => setForm(p => ({ ...p, bodyType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select body type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ectomorph">Ectomorph (Lean/Long)</SelectItem>
                      <SelectItem value="mesomorph">Mesomorph (Muscular/Athletic)</SelectItem>
                      <SelectItem value="endomorph">Endomorph (Stocky/Round)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Injuries or Limitations</Label>
                  <Textarea
                    placeholder="e.g., Bad left knee, lower back pain, shoulder impingement..."
                    value={form.injuries}
                    onChange={e => setForm(p => ({ ...p, injuries: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Fitness Goals</CardTitle>
                  <CardDescription>Select all that apply</CardDescription>
                </CardHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GOALS.map(goal => (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        form.goals.includes(goal.id)
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-foreground">{goal.label}</span>
                        {form.goals.includes(goal.id) && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{goal.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <CardHeader className="p-0 pb-4">
                  <CardTitle>Available Equipment</CardTitle>
                  <CardDescription>Select what you have access to</CardDescription>
                </CardHeader>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT.map(eq => (
                    <Badge
                      key={eq}
                      variant={form.equipment.includes(eq) ? "default" : "outline"}
                      className={`cursor-pointer text-sm py-2 px-3 transition-all ${
                        form.equipment.includes(eq) ? "bg-primary text-primary-foreground" : "hover:border-primary/50"
                      }`}
                      onClick={() => toggleEquipment(eq)}
                    >
                      {EQUIPMENT_LABELS[eq] ?? eq}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} className="gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={upsertProfile.isPending} className="glow-primary gap-1">
              {upsertProfile.isPending ? "Saving..." : "Complete Setup"} <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
