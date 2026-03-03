"use client";

import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Save,
  Share2,
  Sofa,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import dynamic from "next/dynamic";
import FurniturePanel from "@/components/FurniturePanel";
import { FurnitureItem, FURNITURE_ITEMS } from "@/lib/furniture";
import SceneOverlay, { PlacedItem } from "@/components/SceneOverlay";
import { PanoramaViewerHandle } from "@/components/PanoramaViewer";
import { exportProjectToPdf } from "@/lib/exportPdf";

const BASE = "https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG";

type Scene = { 
  label: string; 
  src: string; 
  dimensions?: string;
  setupTimeline?: string;
  rentPrice?: number;
};

const EVENT_SCENES: Record<string, Scene[]> = {
  Wedding: [
    { label: "Dancing Hall",  src: `${BASE}/dancing_hall.jpg`, dimensions: "25m x 40m", setupTimeline: "24 Hours", rentPrice: 1500 },
    { label: "Music Hall",    src: `${BASE}/music_hall_02.jpg`, dimensions: "30m x 50m", setupTimeline: "36 Hours", rentPrice: 2200 },
    { label: "Pillared Hall", src: `${BASE}/solitude_interior.jpg`, dimensions: "20m x 30m", setupTimeline: "18 Hours", rentPrice: 1200 },
  ],
  Conference: [
    { label: "Main Theater",   src: `${BASE}/theater_02.jpg`, dimensions: "40m x 60m", setupTimeline: "48 Hours", rentPrice: 3500 },
    { label: "Stage Hall",     src: `${BASE}/theater_01.jpg`, dimensions: "35m x 45m", setupTimeline: "36 Hours", rentPrice: 2800 },
    { label: "Lecture Hall",   src: `${BASE}/school_hall.jpg`, dimensions: "20m x 25m", setupTimeline: "12 Hours", rentPrice: 800 },
    { label: "Screening Room", src: `${BASE}/cinema_hall.jpg`, dimensions: "15m x 20m", setupTimeline: "12 Hours", rentPrice: 600 },
  ],
  "Gala Dinner": [
    { label: "Grand Hall",    src: `${BASE}/old_hall.jpg`, dimensions: "45m x 70m", setupTimeline: "60 Hours", rentPrice: 4500 },
    { label: "Entrance Hall", src: `${BASE}/entrance_hall.jpg`, dimensions: "15m x 30m", setupTimeline: "24 Hours", rentPrice: 1000 },
    { label: "Long Gallery",  src: `${BASE}/large_corridor.jpg`, dimensions: "10m x 80m", setupTimeline: "36 Hours", rentPrice: 1800 },
  ],
};

const EVENT_LABELS: Record<string, string> = {
  Wedding:       "Wedding Venue",
  Conference:    "Conference Hall",
  "Gala Dinner": "Gala Dinner Hall",
};

const PanoramaViewer = dynamic(() => import("@/components/PanoramaViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
      <div className="text-white/60 text-sm font-medium animate-pulse">Loading 360° scene…</div>
    </div>
  ),
});

let uidCounter = 0;
function nextUid() { return `item-${++uidCounter}`; }

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");
  const { projects, token, user } = useAuth();

  const panoramaRef = useRef<PanoramaViewerHandle | null>(null);

  const [projectName, setProjectName] = useState("Untitled Project");
  const [eventType, setEventType] = useState("Wedding");
  const [sceneIndex, setSceneIndex] = useState(0);
    const [furniturePanelOpen, setFurniturePanelOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
  
    const [placedItemsMap, setPlacedItemsMap] = useState<Record<string, PlacedItem[]>>({});


  const sceneKey = `${eventType}::${sceneIndex}`;
  const placedItems: PlacedItem[] = placedItemsMap[sceneKey] ?? [];

  const setPlacedItems = useCallback(
    (items: PlacedItem[]) => {
      setPlacedItemsMap((prev) => ({ ...prev, [sceneKey]: items }));
    },
    [sceneKey]
  );

    const handleExportPdf = useCallback(async () => {
    setIsExportingPdf(true);
    try {
      const scenesData = (EVENT_SCENES[eventType] || []).map((scene, idx) => ({
        ...scene,
        items: (placedItemsMap[`${eventType}::${idx}`] || []).map(p => ({
          ...p,
          item: {
            ...p.item,
            // Ensure price is present even for older saved items or custom items
            price: p.item.price || FURNITURE_ITEMS.find(fi => fi.id === p.item.id)?.price || 0
          }
        }))
      }));
      
      const project = projects.find(p => p._id === projectId);
      
      await exportProjectToPdf({
        projectId: projectId || "unknown",
        projectName,
        clientName: project?.client || "Valued Client",
        agencyName: user?.agencyName || "EventVista Agency",
        eventType,
        scenes: scenesData,
      });
    } catch (e) {
      console.error("PDF Export failed", e);
    } finally {
      setIsExportingPdf(false);
    }
  }, [eventType, placedItemsMap, projectName, projectId, projects, user]);


  const handleAddFurniture = useCallback(
    (item: FurnitureItem) => {
      const view = panoramaRef.current?.getView();
      const container = panoramaRef.current?.getContainer();

      // Default: drop at screen centre
      let yaw = view ? view.yaw() : 0;
      let pitch = view ? view.pitch() : 0;

      if (view && container) {
        const rect = container.getBoundingClientRect();
        // Drop slightly right of centre so it's visible and not hidden by panel
        const sx = rect.width * 0.45;
        const sy = rect.height * 0.5;
        const world = view.screenToCoordinates({ x: sx, y: sy });
        if (world) { yaw = world.yaw; pitch = world.pitch; }
      }

      const newItem: PlacedItem = {
        uid: nextUid(),
        item,
        yaw,
        pitch,
        width: item.defaultWidth,
        height: item.defaultHeight,
        facing: "front",
      };
      setPlacedItems([...placedItems, newItem]);
    },
    [placedItems, setPlacedItems]
  );

  const handleSaveDraft = useCallback(async () => {
    if (!projectId || !token) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: placedItemsMap,
        }),
      });
      if (!response.ok) throw new Error("Failed to save draft");
      // Optional: Show success toast
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  }, [projectId, token, placedItemsMap]);

    const handleExportStandalone = useCallback(async () => {
    setIsExporting(true);
    try {
      const currentScene = EVENT_SCENES[eventType][sceneIndex];
      const items = placedItemsMap[`${eventType}::${sceneIndex}`] || [];

      // Utility to convert URL to base64
      const toBase64 = async (url: string) => {
        try {
          // If it's already a base64 or blob, return it
          if (url.startsWith("data:") || url.startsWith("blob:")) return url;
          
          const res = await fetch(url, { mode: 'cors' });
          if (!res.ok) throw new Error(`Status ${res.status}`);
          const blob = await res.blob();
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn("Could not base64 image", url, e);
          return url; // Fallback to URL
        }
      };

      // Base64-ing assets for offline use
      const sceneBase64 = await toBase64(currentScene.src);
      const itemsWithBase64 = await Promise.all(
        items.map(async (p) => ({
          yaw: p.yaw,
          pitch: p.pitch,
          width: p.width,
          height: p.height,
          flipX: p.flipX,
          imgSrc: await toBase64(p.item.views[p.facing as keyof typeof p.item.views] || p.item.views.front),
          label: p.item.label,
        }))
      );

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EventVista - ${projectName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; font-family: 'Plus Jakarta Sans', sans-serif; }
    #container { width: 100%; height: 100%; }
    .hotspot { pointer-events: none; transform: translate(-50%, -50%); }
    .furniture-img { pointer-events: none; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.45)); transition: opacity 0.3s; }
    #ui { position: absolute; bottom: 30px; left: 30px; z-index: 100; color: white; background: rgba(0,0,0,0.55); padding: 18px 26px; border-radius: 24px; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.12); pointer-events: none; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
    .badge { background: linear-gradient(135deg, #FF6B4A, #FF8E72); color: white; padding: 4px 12px; border-radius: 99px; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; display: inline-block; letter-spacing: 0.08em; box-shadow: 0 2px 8px rgba(255,107,74,0.3); }
    .brand { position: absolute; top: 30px; left: 30px; color: white; font-weight: 800; letter-spacing: -0.02em; opacity: 0.95; font-size: 20px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    #loading { position: absolute; inset: 0; background: #0a0a0a; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1000; color: white; transition: opacity 0.5s; text-align: center; padding: 20px; }
    .loader { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #FF6B4A; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
  <script src="https://unpkg.com/marzipano@0.10.2/dist/marzipano.js"></script>
</head>
<body>
  <div id="loading">
    <div id="loader-box">
      <div class="loader"></div>
      <div style="font-size: 14px; font-weight: 500; opacity: 0.7;">Decoding 360° Environment...</div>
    </div>
    <div id="error-box" style="display: none; color: #ff4a4a; max-width: 400px;">
      <div style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Export Error</div>
      <div id="error-msg" style="font-size: 13px; opacity: 0.8; line-height: 1.5;"></div>
    </div>
  </div>

  <div id="container"></div>
  <div class="brand">EventVista</div>
  
  <div id="ui">
    <div class="badge">Interactive Scene</div>
    <div style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 2px;">${projectName}</div>
    <div style="font-size: 13px; opacity: 0.7; font-weight: 500;">${EVENT_LABELS[eventType] || eventType} • ${currentScene.label}</div>
  </div>

  <script>
    const container = document.getElementById('container');
    const loading = document.getElementById('loading');
    const errorBox = document.getElementById('error-box');
    const errorMsg = document.getElementById('error-msg');
    const loaderBox = document.getElementById('loader-box');

    function showError(msg) {
      loaderBox.style.display = 'none';
      errorBox.style.display = 'block';
      errorMsg.textContent = msg;
    }

    try {
      // Create viewer
      const viewer = new Marzipano.Viewer(container, { 
        controls: { mouseViewMode: 'drag' },
        stage: { progressive: true }
      });
      
      const img = new Image();
      img.onload = function() {
        try {
          // Use ImageUrlSource for both base64 and URLs as it's more stable in Marzipano
          // Specifying the geometry width based on image size for accuracy
          const source = Marzipano.ImageUrlSource.fromString(img.src);
          const geometry = new Marzipano.EquirectGeometry([{ width: img.width }]);
          
          const limiter = Marzipano.RectilinearView.limit.vfov(30 * Math.PI / 180, 120 * Math.PI / 180);
          const view = new Marzipano.RectilinearView({ yaw: 0, pitch: 0, fov: 90 * Math.PI / 180 }, limiter);
          
          const scene = viewer.createScene({ source, geometry, view });
          scene.switchTo({ transitionDuration: 0 });
          
          // Render furniture
          const items = ${JSON.stringify(itemsWithBase64)};
          items.forEach(item => {
            const element = document.createElement('div');
            element.className = 'hotspot';
            element.style.width = item.width + 'px';
            element.style.height = item.height + 'px';
            
            const hotspotImg = document.createElement('img');
            hotspotImg.src = item.imgSrc;
            hotspotImg.className = 'furniture-img';
            hotspotImg.style.width = '100%';
            hotspotImg.style.height = '100%';
            if (item.flipX) hotspotImg.style.transform = 'scaleX(-1)';
            
            element.appendChild(hotspotImg);
            scene.hotspotContainer().createHotspot(element, { yaw: item.yaw, pitch: item.pitch });
          });

          // Hide loading screen
          loading.style.opacity = '0';
          setTimeout(() => loading.style.display = 'none', 500);
        } catch (e) {
          showError("Marzipano Scene Error: " + e.message);
        }
      };
      img.onerror = function() {
        showError("Failed to decode the 360° image. The image might be too large or corrupted.");
      };
      
      // Assign the source - this triggers decoding
      img.src = "${sceneBase64}";
    } catch (e) {
      showError("Viewer Initialization Error: " + e.message);
    }
  </script>
</body>
</html>`;

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.replace(/ /g, "_")}_360.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
    }
  }, [eventType, sceneIndex, placedItemsMap, projectName]);

  const handleShare = useCallback(() => {
    if (!projectId) return;
    const shareUrl = `${window.location.origin}/share/${projectId}`;
    navigator.clipboard.writeText(shareUrl);
    setIsSharing(true);
    setTimeout(() => setIsSharing(false), 2000);
  }, [projectId]);

  const scenes: Scene[] = EVENT_SCENES[eventType] ?? EVENT_SCENES["Wedding"];
  const currentScene = scenes[sceneIndex];

  useEffect(() => {
    if (!projectId) return;

    const restoreData = (data: any) => {
      if (data && typeof data === "object") {
        setPlacedItemsMap(data);
        // Update uidCounter to avoid collisions
        let maxId = 0;
        Object.values(data).forEach((items: any) => {
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              const num = parseInt(item.uid?.split("-")[1] || "0");
              if (num > maxId) maxId = num;
            });
          }
        });
        uidCounter = maxId;
      }
    };

    const local = projects.find((p) => p._id === projectId);
    if (local) {
      setProjectName(local.name);
      setEventType(local.eventType ?? "Wedding");
      setSceneIndex(0);
      restoreData((local as any).data);
      return;
    }
    if (!token) return;
    fetch(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data._id) {
          setProjectName(data.name);
          setEventType(data.eventType ?? "Wedding");
          setSceneIndex(0);
          restoreData(data.data);
        }
      })
      .catch(() => {});
  }, [projectId, projects, token]);

  return (
    <div className="h-[calc(100vh-112px)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="mx-6 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-500" />
          </button>
          <div>
            <h1 className="font-bold text-zinc-900 leading-tight">{projectName}</h1>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              {EVENT_LABELS[eventType] ?? eventType} • {currentScene.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-4 py-2 bg-white/80 hover:bg-white text-zinc-600 rounded-xl text-sm font-medium border border-white/40 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="px-4 py-2 bg-white/80 hover:bg-white text-zinc-600 rounded-xl text-sm font-medium border border-white/40 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <FileText className={`w-4 h-4 ${isExportingPdf ? "animate-spin" : ""}`} />
                {isExportingPdf ? "Generating PDF..." : "Export PDF"}
              </button>
              <button
                onClick={handleShare}
                className={`btn-primary !px-4 !py-2 text-sm flex items-center gap-2 transition-all ${
                  isSharing ? "!bg-green-500 !hover:bg-green-600" : ""
                }`}
              >
                <Share2 className={`w-4 h-4 ${isSharing ? "scale-110" : ""}`} />
                {isSharing ? "Link Copied!" : "Share Link"}
              </button>
            </div>
          </div>


      {/* Main Canvas */}
      <div className="flex-1 relative mx-6 mb-6 rounded-3xl overflow-hidden shadow-inner">
        {/* 360° Viewer */}
        <div className="absolute inset-0">
          <PanoramaViewer ref={panoramaRef} src={currentScene.src} />
        </div>

        {/* World-space furniture overlay */}
        <SceneOverlay
          placedItems={placedItems}
          onChange={setPlacedItems}
          viewerRef={panoramaRef}
        />

        {/* 360° badge */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            360° Virtual Tour
          </div>
        </div>

        {/* Furniture Panel toggle */}
        <div className="absolute top-4 right-4 z-30">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setFurniturePanelOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-lg transition-all"
            style={{
              background: furniturePanelOpen
                ? "rgba(255,107,74,0.92)"
                : "rgba(255,255,255,0.18)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: furniturePanelOpen
                ? "1px solid rgba(255,107,74,0.5)"
                : "1px solid rgba(255,255,255,0.3)",
              color: "white",
            }}
          >
            <Sofa className="w-4 h-4" />
            Furniture Panel
          </motion.button>
        </div>

        {/* Sliding Furniture Panel */}
        <FurniturePanel
          open={furniturePanelOpen}
          onClose={() => setFurniturePanelOpen(false)}
          onAdd={handleAddFurniture}
        />

        <HintOverlay />

        {/* Scene switcher */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-card !bg-white/90 px-4 py-3 flex items-center gap-4"
          >
            <button
              onClick={() => setSceneIndex(Math.max(0, sceneIndex - 1))}
              disabled={sceneIndex === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              {scenes.map((scene, i) => (
                <button
                  key={i}
                  onClick={() => setSceneIndex(i)}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                    i === sceneIndex
                      ? "bg-coral-50 text-coral-500 font-semibold"
                      : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    {i === sceneIndex ? scene.label : `Scene ${i + 1}`}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${i === sceneIndex ? "bg-coral-400" : "bg-zinc-200"}`} />
                </button>
              ))}
            </div>

            <button
              onClick={() => setSceneIndex(Math.min(scenes.length - 1, sceneIndex + 1))}
              disabled={sceneIndex === scenes.length - 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>

        {/* Export */}
        <div className="absolute bottom-6 right-6 z-20 pointer-events-auto">
          <motion.button
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={handleExportStandalone}
            disabled={isExporting}
            className="btn-primary flex items-center gap-2 !px-5 !py-3 disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isExporting ? "animate-spin" : ""}`} />
            {isExporting ? "Exporting..." : "Export Viewer Standalone"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function HintOverlay() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="bg-black/40 backdrop-blur-sm text-white text-sm font-medium px-5 py-3 rounded-2xl flex items-center gap-3">
        <span className="text-xl">👆</span>
        Drag to explore the 360° venue
      </div>
    </motion.div>
  );
}
