"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Download, Eraser, Trash2, Brush } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "../ui/card";

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(5);
  const [isErasing, setIsErasing] = useState(false);

  const setCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (context) {
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        contextRef.current = context;
      }
    }
  }, [color, lineWidth]);
  
  useEffect(() => {
    setCanvasDimensions();
    window.addEventListener("resize", setCanvasDimensions);
    return () => {
      window.removeEventListener("resize", setCanvasDimensions);
    };
  }, [setCanvasDimensions]);


  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = lineWidth;
    }
  }, [color, lineWidth]);

  const getEventCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.nativeEvent instanceof MouseEvent) {
      return { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    }
    return { 
      x: e.nativeEvent.touches[0].clientX - rect.left, 
      y: e.nativeEvent.touches[0].clientY - rect.top 
    };
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getEventCoords(e);
    if (contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const stopDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
      setIsDrawing(false);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) {
      return;
    }
    e.preventDefault();
    const { x, y } = getEventCoords(e);
    if (isErasing) {
      contextRef.current.clearRect(x - lineWidth / 2, y - lineWidth / 2, lineWidth, lineWidth);
    } else {
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = "omondi-ai-drawing.png";
      link.click();
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <Card className="flex flex-wrap items-center justify-center gap-4 p-2 md:p-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Brush className="h-4 w-4" />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto">
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setIsErasing(false);
              }}
              className="w-24 h-12"
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2">
          <Label htmlFor="lineWidth">Brush Size</Label>
          <Slider
            id="lineWidth"
            min={1}
            max={50}
            step={1}
            value={[lineWidth]}
            onValueChange={(value) => setLineWidth(value[0])}
            className="w-32"
          />
        </div>

        <Button
          variant={isErasing ? "secondary" : "outline"}
          size="icon"
          onClick={() => setIsErasing(!isErasing)}
          aria-label="Eraser"
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={clearCanvas} aria-label="Clear Canvas">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button onClick={downloadImage} className="gap-2" variant="default">
          <Download className="h-4 w-4" />
          Download
        </Button>
      </Card>
      <div className="w-full aspect-video md:aspect-[2/1] lg:flex-1 rounded-lg border bg-white shadow-inner overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="w-full h-full cursor-crosshair"
        />
      </div>
    </div>
  );
}
