import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GardenProvider } from "@/contexts/GardenContext";
import { BottomNav } from "@/components/BottomNav";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AdModal } from "@/components/AdModal";
import { initRichAds } from "@/lib/adManager";
import { useEffect } from "react";
import Garden from "./pages/Garden";
import Market from "./pages/Market";
import Tasks from "./pages/Tasks";
import Referral from "./pages/Referral";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import Lottery from "./pages/Lottery";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initRichAds();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <GardenProvider>
          <div className="min-h-screen bg-background pb-20">
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Garden />} />
              <Route path="/market" element={<Market />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/referral" element={<Referral />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
            <AdModal />
          </div>
        </GardenProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
