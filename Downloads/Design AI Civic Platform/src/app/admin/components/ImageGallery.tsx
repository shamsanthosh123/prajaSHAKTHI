import { useState } from "react";
import { Download, Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { getComplaintImages } from "../../lib/firebaseData";
import type { Complaint } from "../../types";

interface ImageGalleryProps {
  complaint: Complaint;
}

export function ImageGallery({ complaint }: ImageGalleryProps) {
  const images = getComplaintImages(complaint);
  const [selected, setSelected] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  if (images.length === 0) {
    return (
      <div className="bg-card border border-white/10 rounded-2xl p-5 text-sm text-gray-500">
        No images uploaded.
      </div>
    );
  }

  const current = images[selected] ?? images[0];

  const download = () => {
    const link = document.createElement("a");
    link.href = current;
    link.download = `complaint-${complaint.id}-${selected + 1}.jpg`;
    link.click();
  };

  return (
    <>
      <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Evidence Images ({images.length})</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFullscreen(true)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={download}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden bg-black/20 flex items-center justify-center min-h-[240px] max-h-[360px]">
          <img
            src={current}
            alt={`Evidence ${selected + 1}`}
            className="max-w-full max-h-[360px] object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>

        {images.length > 1 && (
          <div className="p-3 flex gap-2 overflow-x-auto border-t border-white/10">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelected(index);
                  setZoom(1);
                }}
                className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  selected === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img src={image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-gray-400">
              Image {selected + 1} of {images.length}
            </span>
            <div className="flex gap-2">
              <button onClick={download} className="p-2 rounded-lg bg-white/10">
                <Download className="w-5 h-5" />
              </button>
              <button onClick={() => setFullscreen(false)} className="p-2 rounded-lg bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={current} alt="" className="max-w-full max-h-full object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
