// src/pages/Index.tsx

import React, { CSSProperties } from "react";
import GridPlayground from "@/components/grid/GridPlayground";

type WallpaperMode = "cover" | "tile";

interface IndexProps {
  wallpaperStyle: CSSProperties;
  wallpaper: string;
  wallpaperMode: WallpaperMode;
  setWallpaper: (value: string) => void;
  setWallpaperMode: (mode: WallpaperMode) => void;
}

const Index: React.FC<IndexProps> = ({
  wallpaperStyle,
  wallpaper,
  wallpaperMode,
  setWallpaper,
  setWallpaperMode,
}) => {
  return (
    <div
      className="w-screen h-screen relative overflow-hidden"
      style={wallpaperStyle}
    >
      <GridPlayground
        wallpaper={wallpaper}
        wallpaperMode={wallpaperMode}
        setWallpaper={setWallpaper}
        setWallpaperMode={setWallpaperMode}
      />
    </div>
  );
};

export default Index;
