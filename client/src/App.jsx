import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import TicketsIndex from "@/pages/tickets/index";
import NewTicket from "@/pages/tickets/new";
import TicketDetail from "@/pages/tickets/[id]";
import UsersIndex from "@/pages/users/index";
import OfficialsIndex from "@/pages/officials/index";
import ClientsIndex from "@/pages/clients/index";
import Settings from "@/pages/settings";
import AuthPage from "@/pages/auth-page";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/hooks/use-auth";
function MainLayout(_a) {
    var children = _a.children;
    var location = useLocation()[0];
    return (<div className="min-h-screen flex">
      <Sidebar currentPath={location}/>
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 overflow-auto p-6 bg-neutral-50">
          {children}
        </div>
      </div>
    </div>);
}
function AppContent() {
    var user = useAuth().user;
    // Definir título do documento com valor fixo para evitar loops de requisição
    useEffect(function () {
        document.title = "Oficina Muda - Sistema de Gestão de Chamados";
    }, []);
    return (<Switch>
      <Route path="/auth" component={AuthPage}/>
      
      <ProtectedRoute path="/" component={function () { return (<MainLayout>
          <Dashboard />
        </MainLayout>); }}/>
      
      <ProtectedRoute path="/tickets" component={function () { return (<MainLayout>
          <TicketsIndex />
        </MainLayout>); }}/>
      
      <ProtectedRoute path="/tickets/new" component={function () { return (<MainLayout>
          <NewTicket />
        </MainLayout>); }}/>
      
      <ProtectedRoute path="/tickets/:id" component={function () { return (<MainLayout>
          <TicketDetail />
        </MainLayout>); }}/>
      
      <ProtectedRoute path="/clients" component={function () { return (<MainLayout>
          <ClientsIndex />
        </MainLayout>); }}/>
      
      <ProtectedRoute path="/users" component={function () { return (<MainLayout>
          <UsersIndex />
        </MainLayout>); }}/>
      
      <ProtectedRoute path="/officials" component={function () { return (<MainLayout>
          <OfficialsIndex />
        </MainLayout>); }}/>
      
      <ProtectedRoute path="/settings" component={function () { return (<MainLayout>
          <Settings />
        </MainLayout>); }}/>
      
      <Route component={NotFound}/>
    </Switch>);
}
export default function App() {
    return (<QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>);
}
