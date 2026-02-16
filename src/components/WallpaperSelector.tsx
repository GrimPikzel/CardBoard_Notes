import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image } from 'lucide-react';

export const WallpaperSelector = () => {
  const [wallpaper, setWallpaper] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setWallpaper(imageUrl);
        localStorage.setItem('app-wallpaper', imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const presetWallpapers = [
    { name: 'Solid Dark', color: '#171717' },
    { name: 'Deep Purple', color: '#1a0f2e' },
    { name: 'Night Blue', color: '#0a1628' },
    { name: '8-Bit Green', color: '#0f380f' },
    { name: 'Retro Pink', color: '#2d1b2e' },
  ];

  const handlePresetSelect = (color: string) => {
    setWallpaper(color);
    localStorage.setItem('app-wallpaper', color);
  };

  return (
    <div className="wallpaper-selector p-4 space-y-4">
      <h3 className="text-lg font-semibold">Wallpaper Settings</h3>
      
      {/* Preset Colors */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Preset Themes</p>
        <div className="grid grid-cols-5 gap-2">
          {presetWallpapers.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset.color)}
              className="aspect-square rounded-lg border-2 border-border hover:border-primary transition-colors"
              style={{ backgroundColor: preset.color }}
              title={preset.name}
            />
          ))}
        </div>
      </div>

      {/* Custom Image Upload */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Custom Image</p>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button variant="outline" className="w-full" asChild>
            <span>
              <Upload className="w-4 h-4 mr-2" />
              Upload Wallpaper
            </span>
          </Button>
        </label>
      </div>

      {/* Preview */}
      {wallpaper && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Preview</p>
          <div 
            className="w-full h-32 rounded-lg border border-border"
            style={{
              background: wallpaper.startsWith('#') 
                ? wallpaper 
                : `url(${wallpaper}) center/cover`
            }}
          />
        </div>
      )}
    </div>
  );
};
