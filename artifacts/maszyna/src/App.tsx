import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/lib/i18n/context";
import { AuthProvider } from "@/lib/auth-context";
import { PartnerColorsProvider } from "@/lib/partner-colors-context";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/auth/login";
import SignUpPage from "@/pages/auth/sign-up";
import SignUpSuccessPage from "@/pages/auth/sign-up-success";
import AuthErrorPage from "@/pages/auth/error";
import AuthCallbackPage from "@/pages/auth/callback";
import AppPage from "@/pages/app";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">404 - Page Not Found</h1>
        <a href="/" className="mt-4 inline-block text-primary hover:underline">Go Home</a>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/sign-up" component={SignUpPage} />
      <Route path="/auth/sign-up-success" component={SignUpSuccessPage} />
      <Route path="/auth/error" component={AuthErrorPage} />
      <Route path="/auth/callback" component={AuthCallbackPage} />
      <Route path="/app" component={AppPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <PartnerColorsProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </PartnerColorsProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
