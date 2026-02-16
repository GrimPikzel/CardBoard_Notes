import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from 'react';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
/* import DotGridCanvas from '@/components/grid/DotGridCanvas'; */
 
const queryClient = new QueryClient();

const App = () => {
  const [wallpaper, setWallpaper] = useState('#171717');

  useEffect(() => {
    // Load saved wallpaper from localStorage
    const savedWallpaper = localStorage.getItem('app-wallpaper');
    if (savedWallpaper) {
      setWallpaper(savedWallpaper);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Main app container with wallpaper background */}
        <div 
          className="app-container w-screen h-screen relative overflow-hidden"
          style={{
            background: wallpaper.startsWith('#') 
              ? wallpaper 
              : `url(${wallpaper}) center/cover`
          }}
        >
          {/* Optional DotGridCanvas overlay - adjust opacity or remove */}
          <DotGridCanvas className="absolute inset-0 pointer-events-none opacity-30" />
          
          {/* Router content */}
          <div className="relative z-10 w-full h-full">
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </div>

        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
