import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { Tooltip } from "./tooltip";

interface DownloadButtonProps {
  label: string;
  description?: string;
  url: string;
  filename?: string;
}

export const DownloadButton = ({ label, description, url, filename }: DownloadButtonProps) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || url.split("/").pop() || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs w-full font-mono">
        <label className="capitalize text-base-content/80 inline-flex justify-center items-center gap-1">
          {label}
          <Tooltip description={description || ""} />
        </label>
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-2 h-8 px-3 bg-base-100/10 border border-base-content/10 rounded-lg text-base-content/80 hover:bg-base-content/20 transition-colors cursor-pointer"
        >
          <DownloadSimpleIcon weight="bold" size={14} />
          <span className="text-xs">Download Sprite</span>
        </button>
      </div>
    </div>
  );
};
