import React, { useEffect, useRef } from "react";
import { initDraw } from "../draw";

const Canvas = ({ roomId, socket }: { roomId: string; socket: WebSocket }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      initDraw(canvasRef.current, roomId, socket);
    }
  }, [canvasRef, socket]);

  return (
    <div>
      <canvas ref={canvasRef} width={2050} height={1000} />
    </div>
  );
};

export default Canvas;
