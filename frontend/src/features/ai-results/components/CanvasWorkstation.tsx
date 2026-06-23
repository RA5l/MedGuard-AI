import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { Pencil, ZoomIn, ZoomOut, RotateCcw, Maximize2, X } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  imageUrl?: string;
  label: string;
  /** Pre-existing annotations loaded from the database */
  initialAnnotations?: object[];
  /** Fires after every new path is drawn, with the full current annotation list */
  onAnnotationsChange?: (objects: object[]) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BRUSH_COLORS = [
  { value: '#FFFF00', label: 'Yellow' },
  { value: '#00FFFF', label: 'Cyan'   },
  { value: '#FF4444', label: 'Red'    },
] as const;

const DEFAULT_BRUSH_SIZE = 3;

// ─── Component ───────────────────────────────────────────────────────────────

export default function CanvasWorkstation({
  imageUrl,
  label,
  initialAnnotations,
  onAnnotationsChange,
}: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const canvasElRef   = useRef<HTMLCanvasElement>(null);
  const fabricRef     = useRef<fabric.Canvas | null>(null);

  const [isDrawing,  setIsDrawing]  = useState(false);
  const [brushColor, setBrushColor] = useState<string>(BRUSH_COLORS[0].value);
  const [showModal,  setShowModal]  = useState(false);

  // ── Init / teardown ────────────────────────────────────────────────────────
  useEffect(() => {
    const el        = canvasElRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    // Defer one animation frame so the container has its final layout dimensions.
    const rafId = requestAnimationFrame(() => {
      const { width, height } = container.getBoundingClientRect();
      const w = Math.max(width,  200);
      const h = Math.max(height, 200);

      const canvas = new fabric.Canvas(el, {
        width,
        height: h,
        isDrawingMode: false,
        selection:     false,
        backgroundColor: '#000000',
      });

      // Configure freehand brush
      const brush = new fabric.PencilBrush(canvas);
      brush.color  = brushColor;
      brush.width  = DEFAULT_BRUSH_SIZE;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (canvas as any).freeDrawingBrush = brush;

      // Load background image + restore saved annotations
      if (imageUrl) {
        fabric.Image.fromURL(
          imageUrl,
          (img) => {
            const iw    = img.width  ?? w;
            const ih    = img.height ?? h;
            const scale = Math.min(w / iw, h / ih);
            img.set({
              scaleX:   scale,
              scaleY:   scale,
              left:     (w - iw * scale) / 2,
              top:      (h - ih * scale) / 2,
              originX: 'left',
              originY: 'top',
            });
            canvas.setBackgroundImage(img, () => {
              // Restore pre-existing annotations without clobbering the background
              if (initialAnnotations && initialAnnotations.length > 0) {
                fabric.util.enlivenObjects(
                  initialAnnotations,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (objects: any[]) => {
                    objects.forEach((obj) => canvas.add(obj as fabric.Object));
                    canvas.renderAll();
                  },
                  'fabric'
                );
              } else {
                canvas.renderAll();
              }
            });
          },
          { crossOrigin: 'anonymous' }
        );
      }

      // Emit annotation list after each stroke
      canvas.on('path:created', () => {
        const objects = canvas.getObjects().map((o) => o.toObject());
        onAnnotationsChange?.(objects);
      });

      fabricRef.current = canvas;
    });

    return () => {
      cancelAnimationFrame(rafId);
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
    // Re-run only when image URL changes (full canvas re-init required).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  // ── Sync drawing mode ──────────────────────────────────────────────────────
  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;
    c.isDrawingMode = isDrawing;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((c as any).freeDrawingBrush) (c as any).freeDrawingBrush.color = brushColor;
  }, [isDrawing, brushColor]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const zoomBy = (factor: number) => {
    const c = fabricRef.current;
    if (!c) return;
    const next = Math.max(0.4, Math.min(6, c.getZoom() * factor));
    c.setZoom(next);
    c.renderAll();
  };

  const clearAnnotations = () => {
    const c = fabricRef.current;
    if (!c) return;
    c.remove(...c.getObjects());
    c.renderAll();
    onAnnotationsChange?.([]);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/70 border-b border-white/10 shrink-0">
        <span className="text-[10px] font-semibold text-white/50 flex-1 truncate">{label}</span>

        {/* Color swatches */}
        <div className="flex gap-1 mr-0.5">
          {BRUSH_COLORS.map((c) => (
            <button
              key={c.value}
              title={`Brush color: ${c.label}`}
              onClick={() => setBrushColor(c.value)}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                brushColor === c.value
                  ? 'border-white scale-125 shadow-[0_0_4px_1px_rgba(255,255,255,0.4)]'
                  : 'border-transparent hover:border-white/40'
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        {/* Draw toggle */}
        <button
          title={isDrawing ? 'Disable drawing mode' : 'Enable drawing mode'}
          onClick={() => setIsDrawing((d) => !d)}
          className={`p-1 rounded transition-colors ${
            isDrawing
              ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-400/50'
              : 'text-white/30 hover:text-white/70'
          }`}
        >
          <Pencil className="w-3 h-3" />
        </button>

        {/* Zoom controls */}
        <button
          title="Zoom out"
          onClick={() => zoomBy(0.8)}
          className="p-1 rounded text-white/30 hover:text-white/70 transition-colors"
        >
          <ZoomOut className="w-3 h-3" />
        </button>
        <button
          title="Zoom in"
          onClick={() => zoomBy(1.25)}
          className="p-1 rounded text-white/30 hover:text-white/70 transition-colors"
        >
          <ZoomIn className="w-3 h-3" />
        </button>

        {/* Clear */}
        <button
          title="Clear all annotations"
          onClick={clearAnnotations}
          className="p-1 rounded text-white/30 hover:text-rose-400 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        {/* Fullscreen */}
        <button
          title="Open fullscreen"
          onClick={() => setShowModal(true)}
          className="p-1 rounded text-white/30 hover:text-white/70 transition-colors"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 relative bg-black overflow-hidden min-h-0">
        {imageUrl ? (
          <canvas ref={canvasElRef} />
        ) : (
          <div className="flex items-center justify-center h-full text-white/20 text-xs select-none">
            No image available
          </div>
        )}
      </div>

      {/* Fullscreen modal — image only, high-res view */}
      {showModal && imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/96 flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0">
            <p className="text-sm font-semibold text-white tracking-wide">{label}</p>
            <button
              onClick={() => setShowModal(false)}
              className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <img
              src={imageUrl}
              alt={label}
              className="max-w-full max-h-full object-contain"
              style={{ imageRendering: 'auto' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}