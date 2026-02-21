// src/App.tsx

import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

type WallpaperMode = "cover" | "tile";

function App() {
  // Can be a hex colour or an image URL/path (served by the app)
  const [wallpaper, setWallpaper] = useState("#171717");
  const [wallpaperInput, setWallpaperInput] = useState("#171717");
  const [wallpaperMode, setWallpaperMode] = useState<WallpaperMode>("cover");

  // Load saved wallpaper + mode
  useEffect(() => {
    try {
      const saved = localStorage.getItem("app-wallpaper");
      if (saved) {
        setWallpaper(saved);
        setWallpaperInput(saved);
      }

      const savedMode = localStorage.getItem(
        "app-wallpaper-mode",
      ) as WallpaperMode | null;
      if (savedMode === "cover" || savedMode === "tile") {
        setWallpaperMode(savedMode);
      }
    } catch (err) {
      console.error("Failed to load wallpaper from localStorage", err);
    }
  }, []);

  // Persist wallpaper when it changes
  useEffect(() => {
    try {
      localStorage.setItem("app-wallpaper", wallpaper);
    } catch (err) {
      console.error("Failed to save wallpaper to localStorage", err);
    }
  }, [wallpaper]);

  // Persist mode when it changes
  useEffect(() => {
    try {
      localStorage.setItem("app-wallpaper-mode", wallpaperMode);
    } catch (err) {
      console.error("Failed to save wallpaper mode to localStorage", err);
    }
  }, [wallpaperMode]);

  const applyWallpaper = () => {
    const next = wallpaperInput.trim();
    if (!next) return;
    setWallpaper(next);
  };

  // Build final style that Index uses behind the grid
const hasWallpaper = wallpaper.trim().length > 0;

const backgroundStyle = !hasWallpaper
  ? {}
  : wallpaper.startsWith("#")
  ? {
      background: wallpaper,
    }
  : wallpaperMode === "tile"
  ? {
      backgroundImage: `url(${wallpaper})`,
      backgroundRepeat: "repeat",
      backgroundSize: "auto",
      backgroundPosition: "top left",
      backgroundColor: "transparent",
    }
  : {
      backgroundImage: `url(${wallpaper})`,
      backgroundPosition: "center",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundColor: "transparent",
    };



  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="app-container w-screen h-screen relative overflow-hidden">
          {/* Wallpaper controls (can remove later if Settings is enough) */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-2 py-1 rounded bg-black/40 border border-white/10">
            <input
              type="text"
              value={wallpaperInput}
              onChange={(e) => setWallpaperInput(e.target.value)}
              className="bg-transparent text-[10px] text-neutral-200 outline-none border border-white/10 rounded px-1 py-[1px] w-56 placeholder:text-neutral-500"
              placeholder="#101010 or /wallpapers/bg.jpg"
            />
            <button
              type="button"
              onClick={applyWallpaper}
              className="px-2 py-[1px] rounded text-[10px] bg-white/10 hover:bg-white/20 text-neutral-100 transition-colors"
            >
              Set
            </button>

            {/* Mode toggle: Cover / Tile */}
            <div className="flex gap-1 ml-1">
              <button
                type="button"
                onClick={() => setWallpaperMode("cover")}
                className={`px-2 py-[1px] rounded text-[10px] border transition-colors ${
                  wallpaperMode === "cover"
                    ? "bg-white/30 border-white/60 text-neutral-900"
                    : "bg-white/5 border-white/20 text-neutral-100 hover:bg-white/15"
                }`}
              >
                Cover
              </button>
              <button
                type="button"
                onClick={() => setWallpaperMode("tile")}
                className={`px-2 py-[1px] rounded text-[10px] border transition-colors ${
                  wallpaperMode === "tile"
                    ? "bg-white/30 border-white/60 text-neutral-900"
                    : "bg-white/5 border-white/20 text-neutral-100 hover:bg-white/15"
                }`}
              >
                Tile
              </button>
            </div>
          </div>

          {/* Main app content */}
          <div className="relative z-10 w-full h-full">
            <BrowserRouter>
              <Routes>
                <Route
                  path="/"
                  element={
                    <Index
                      wallpaperStyle={backgroundStyle}
                      wallpaper={wallpaper}
                      wallpaperMode={wallpaperMode}
                      setWallpaper={(value) => {
                        setWallpaper(value);
                        setWallpaperInput(value); // keep debug input in sync
                      }}
                      setWallpaperMode={setWallpaperMode}
                    />
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>

            <Toaster />
            <Sonner />
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
