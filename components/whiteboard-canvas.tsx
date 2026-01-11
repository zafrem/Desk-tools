/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { Stage, Layer, Line, Rect, Circle } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";

interface LineData {
  tool: string;
  points: number[];
  color: string;
  size: number;
}

interface ShapeData {
  id: string;
  type: "rect" | "circle";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
}

interface WhiteboardCanvasProps {
  tool: "pen" | "eraser" | "rect" | "circle";
  color: string;
  size: number;
  lines: LineData[];
  setLines: (lines: LineData[]) => void;
  shapes: ShapeData[];
  setShapes: (shapes: ShapeData[]) => void;
  onDrawStart: () => void;
  onDrawEnd: () => void;
  stageRef: React.RefObject<any>;
}

export default function WhiteboardCanvas({
  tool,
  color,
  size,
  lines,
  setLines,
  shapes,
  setShapes,
  onDrawStart,
  onDrawEnd,
  stageRef,
}: WhiteboardCanvasProps) {
  const [isDrawing, setIsDrawing] = React.useState(false);

  const handleMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    setIsDrawing(true);
    onDrawStart();
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    if (tool === "pen" || tool === "eraser") {
      setLines([...lines, { tool, points: [pos.x, pos.y], color, size }]);
    } else if (tool === "rect") {
      setShapes([...shapes, { id: Date.now().toString(), type: "rect", x: pos.x, y: pos.y, width: 0, height: 0, color }]);
    } else if (tool === "circle") {
      setShapes([...shapes, { id: Date.now().toString(), type: "circle", x: pos.x, y: pos.y, radius: 0, color }]);
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    if (tool === "pen" || tool === "eraser") {
      const lastLine = lines[lines.length - 1];
      // add point
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      // replace last
      lines.splice(lines.length - 1, 1, lastLine);
      setLines(lines.concat());
    } else if (tool === "rect" || tool === "circle") {
      const lastShape = shapes[shapes.length - 1];
      const width = point.x - lastShape.x;
      const height = point.y - lastShape.y;
      
      if (lastShape.type === "rect") {
          lastShape.width = width;
          lastShape.height = height;
      } else {
          lastShape.radius = Math.sqrt(width * width + height * height);
      }
      shapes.splice(shapes.length - 1, 1, lastShape);
      setShapes(shapes.concat());
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    onDrawEnd();
  };

  return (
    <Stage
        width={1200}
        height={800}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        ref={stageRef}
        className="bg-white"
    >
        <Layer>
            <Rect x={0} y={0} width={1200} height={800} fill="white" />
            {shapes.map((shape, i) => {
                if (shape.type === "rect") {
                    return (
                        <Rect
                            key={i}
                            x={shape.x}
                            y={shape.y}
                            width={shape.width}
                            height={shape.height}
                            stroke={shape.color}
                            strokeWidth={2}
                        />
                    );
                } else {
                    return (
                        <Circle
                            key={i}
                            x={shape.x}
                            y={shape.y}
                            radius={shape.radius}
                            stroke={shape.color}
                            strokeWidth={2}
                        />
                    );
                }
            })}
            {lines.map((line, i) => (
                <Line
                    key={i}
                    points={line.points}
                    stroke={line.tool === "eraser" ? "#ffffff" : line.color}
                    strokeWidth={line.size}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={
                        line.tool === "eraser" ? "destination-out" : "source-over"
                    }
                />
            ))}
        </Layer>
    </Stage>
  );
}
