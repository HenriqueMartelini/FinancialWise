import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";

// Pages
import Home from "./pages/Home";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Debts from "./pages/Debts";
import Accounts from "./pages/Accounts";
import Import from "./pages/Import";
import WhatsApp from "./pages/WhatsApp";
import Insights from "./pages/Insights";
import Notifications from "./pages/Notifications";
import Family from "./pages/Family";
import Settings from "./pages/Settings";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/budgets" component={Budgets} />
        <Route path="/goals" component={Goals} />
        <Route path="/debts" component={Debts} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/import" component={Import} />
        <Route path="/whatsapp" component={WhatsApp} />
        <Route path="/insights" component={Insights} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/family" component={Family} />
        <Route path="/settings" component={Settings} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
