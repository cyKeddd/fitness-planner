import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Exercises from "./pages/Exercises";
import ExerciseDetail from "./pages/ExerciseDetail";
import Plans from "./pages/Plans";
import PlanDetail from "./pages/PlanDetail";
import GeneratePlan from "./pages/GeneratePlan";
import ActiveWorkout from "./pages/ActiveWorkout";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";
import SessionDetail from "./pages/SessionDetail";
import Templates from "./pages/Templates";

function Router() {
  return (
    <Switch>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/">
        <DashboardLayout><Home /></DashboardLayout>
      </Route>
      <Route path="/exercises">
        <DashboardLayout><Exercises /></DashboardLayout>
      </Route>
      <Route path="/exercises/:id">
        {(params) => <DashboardLayout><ExerciseDetail id={Number(params.id)} /></DashboardLayout>}
      </Route>
      <Route path="/plans">
        <DashboardLayout><Plans /></DashboardLayout>
      </Route>
      <Route path="/plans/:id">
        {(params) => <DashboardLayout><PlanDetail id={Number(params.id)} /></DashboardLayout>}
      </Route>
      <Route path="/generate">
        <DashboardLayout><GeneratePlan /></DashboardLayout>
      </Route>
      <Route path="/workout">
        <DashboardLayout><ActiveWorkout /></DashboardLayout>
      </Route>
      <Route path="/workout/:id">
        {(params) => <DashboardLayout><ActiveWorkout sessionId={Number(params.id)} /></DashboardLayout>}
      </Route>
      <Route path="/templates">
        <DashboardLayout><Templates /></DashboardLayout>
      </Route>
      <Route path="/progress">
        <DashboardLayout><Progress /></DashboardLayout>
      </Route>
      <Route path="/profile">
        <DashboardLayout><Profile /></DashboardLayout>
      </Route>
      <Route path="/sessions/:id">
        {(params) => <DashboardLayout><SessionDetail id={Number(params.id)} /></DashboardLayout>}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
