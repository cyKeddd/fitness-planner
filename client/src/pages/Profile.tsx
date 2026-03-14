import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Save, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const GOALS = [
  { id: "muscle_gain", label: "Muscle Gain" },
  { id: "fat_loss", label: "Fat Loss" },
  { id: "strength", label: "Strength" },
  { id: "endurance", label: "Endurance" },
  { id: "general_fitness", label: "General Fitness" },
  { id: "athletic_performance", label: "Athletic Performance" },
];

const EQUIPMENT_OPTIONS = [
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

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { data: profile, isLoading } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  const [form, setForm] = useState({
    age: "", gender: "", heightCm: "", weightKg: "",
    fitnessLevel: "" as "" | "beginner" | "intermediate" | "advanced",
    bodyType: "", injuries: "",
    goals: [] as string[], equipment: [] as string[],
    preferredUnit: "kg" as "kg" | "lbs",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        age: profile.age?.toString() ?? "",
        gender: profile.gender ?? "",
        heightCm: profile.heightCm?.toString() ?? "",
        weightKg: profile.weightKg?.toString() ?? "",
        fitnessLevel: (profile.fitnessLevel ?? "") as any,
        bodyType: profile.bodyType ?? "",
        injuries: profile.injuries ?? "",
        goals: (profile.goals as string[]) ?? [],
        equipment: (profile.equipment as string[]) ?? [],
        preferredUnit: (profile.preferredUnit as "kg" | "lbs") ?? "kg",
      });
    }
  }, [profile]);

  const upsert = trpc.profile.upsert.useMutation({
    onSuccess: () => toast.success("Profile updated!"),
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    upsert.mutate({
      age: form.age ? Number(form.age) : undefined,
      gender: form.gender || undefined,
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      fitnessLevel: form.fitnessLevel || undefined,
      bodyType: form.bodyType || undefined,
      injuries: form.injuries || undefined,
      goals: form.goals,
      equipment: form.equipment,
      preferredUnit: form.preferredUnit,
      onboardingCompleted: true,
    });
  };

  const toggleGoal = (id: string) => setForm(p => ({
    ...p, goals: p.goals.includes(id) ? p.goals.filter(g => g !== id) : [...p.goals, id],
  }));
  const toggleEquipment = (id: string) => setForm(p => ({
    ...p, equipment: p.equipment.includes(id) ? p.equipment.filter(e => e !== id) : [...p.equipment, id],
  }));

  if (isLoading) return <div className="space-y-4 max-w-2xl"><Skeleton className="h-8 w-32" /><Skeleton className="h-96" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your fitness profile and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={upsert.isPending} className="gap-2">
          <Save className="h-4 w-4" /> {upsert.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Account</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm"><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{user?.name ?? "—"}</span></p>
          <p className="text-sm"><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{user?.email ?? "—"}</span></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Age</Label>
              <Input type="number" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} />
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
              <Input type="number" value={form.heightCm} onChange={e => setForm(p => ({ ...p, heightCm: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input type="number" value={form.weightKg} onChange={e => setForm(p => ({ ...p, weightKg: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Weight Unit (for workouts)</Label>
            <Select value={form.preferredUnit} onValueChange={(v: "kg" | "lbs") => setForm(p => ({ ...p, preferredUnit: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                <SelectItem value="lbs">Pounds (lbs)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fitness Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Fitness Level</Label>
            <Select value={form.fitnessLevel} onValueChange={v => setForm(p => ({ ...p, fitnessLevel: v as any }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Body Type</Label>
            <Select value={form.bodyType} onValueChange={v => setForm(p => ({ ...p, bodyType: v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ectomorph">Ectomorph</SelectItem>
                <SelectItem value="mesomorph">Mesomorph</SelectItem>
                <SelectItem value="endomorph">Endomorph</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Injuries / Limitations</Label>
            <Textarea value={form.injuries} onChange={e => setForm(p => ({ ...p, injuries: e.target.value }))} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Goals</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {GOALS.map(g => (
              <Badge
                key={g.id}
                variant={form.goals.includes(g.id) ? "default" : "outline"}
                className={`cursor-pointer py-2 px-3 ${form.goals.includes(g.id) ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => toggleGoal(g.id)}
              >
                {form.goals.includes(g.id) && <Check className="h-3 w-3 mr-1" />}
                {g.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Equipment</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map(eq => (
              <Badge
                key={eq}
                variant={form.equipment.includes(eq) ? "default" : "outline"}
                className={`cursor-pointer py-2 px-3 ${form.equipment.includes(eq) ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => toggleEquipment(eq)}
              >
                {form.equipment.includes(eq) && <Check className="h-3 w-3 mr-1" />}
                {EQUIPMENT_LABELS[eq] ?? eq}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
