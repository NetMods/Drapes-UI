'use client'
import { useState, useEffect } from "react";
import Dither, { DitherMode, BayerLevel, MediaType } from "./dither";

const VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";

export default function DitherShowcase() {
  const [ditherMode, setDitherMode] = useState<DitherMode>("none");
  const [bayerLevel, setBayerLevel] = useState<BayerLevel>(16);
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGrayscale, setIsGrayScale] = useState<boolean>(false);

  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [highlights, setHighlights] = useState(0);
  const [midtones, setMidtones] = useState(0);
  const [blur, setBlur] = useState(0);

  const resetFilters = () => {
    setBrightness(0);
    setContrast(0);
    setHighlights(0);
    setMidtones(0);
    setBlur(0);
  };

  const fetchWaifuImage = async () => {
    if (imageUrl) return;
    try {
      const response = await fetch("https://api.waifu.im/search?included_tags=waifu&height=>=1000");
      const data = await response.json();
      if (data.images && data.images[0]) {
        setImageUrl(data.images[0].url);
      }
    } catch (e) {
      console.error("Failed to fetch image", e);
    }
  };

  useEffect(() => { fetchWaifuImage(); }, []);

  const getBtnStyle = (isActive: boolean) =>
    `px-3 py-1 text-xs font-medium border outline-0 cursor-pointer transition-colors ${isActive
      ? "bg-blue-600 text-white border-blue-600"
      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
    }`;

  const Slider = ({ label, value, onChange, min, max }: any) => (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-[10px] uppercase text-gray-500 font-bold tracking-wider">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );

  return (
    <div className="relative w-full h-full">
      <Dither
        mediaType={mediaType}
        ditherMode={ditherMode}
        bayerLevel={bayerLevel}
        isGrayscale={isGrayscale}
        source={imageUrl || VIDEO_URL}
        brightness={brightness}
        contrast={contrast}
        highlights={highlights}
        midtones={midtones}
        blur={blur}
      />

      <div className="fixed top-4 right-4 z-50 flex flex-col gap-4 bg-white/95 p-4 border border-gray-200 w-64 rounded shadow-xl backdrop-blur-sm max-h-[90vh] overflow-y-auto">

        <div className="flex flex-col gap-2 border-b border-gray-100 pb-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Source</span>
          <div className="flex gap-2">
            <button onClick={() => setMediaType("image")} className={`flex-1 ${getBtnStyle(mediaType === "image")}`}>Image</button>
            <button onClick={() => setMediaType("video")} className={`flex-1 ${getBtnStyle(mediaType === "video")}`}>Video</button>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-b border-gray-100 pb-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dither Algorithm</span>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setDitherMode("none")} className={getBtnStyle(ditherMode === "none")}>None</button>
            <button onClick={() => setDitherMode("bayer")} className={getBtnStyle(ditherMode === "bayer")}>Bayer</button>
            <button onClick={() => setDitherMode("floyd")} className={getBtnStyle(ditherMode === "floyd")}>Floyd</button>
          </div>

          {ditherMode === "bayer" && (
            <div className="flex gap-1 mt-1">
              {([2, 4, 8, 16] as const).map((size) => (
                <button key={size} onClick={() => setBayerLevel(size)} className={`flex-1 ${getBtnStyle(bayerLevel === size)}`}>{size}x</button>
              ))}
            </div>
          )}
          {ditherMode !== "none" &&
            <button onClick={() => setIsGrayScale(!isGrayscale)} className={`mt-1 w-full ${getBtnStyle(isGrayscale)}`}>
              {isGrayscale ? "B/W Active" : "Enable B/W"}
            </button>
          }
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Adjustments</span>
            <button onClick={resetFilters} className="text-[10px] text-blue-500 hover:underline cursor-pointer">Reset</button>
          </div>

          <Slider label="Brightness" value={brightness} min={-100} max={100} onChange={setBrightness} />
          <Slider label="Contrast" value={contrast} min={-100} max={100} onChange={setContrast} />
          <Slider label="Midtones" value={midtones} min={-100} max={100} onChange={setMidtones} />
          <Slider label="Highlights" value={highlights} min={-100} max={100} onChange={setHighlights} />
          <Slider label="Blur" value={blur} min={0} max={20} onChange={setBlur} />
        </div>

      </div>
    </div>
  );
}
