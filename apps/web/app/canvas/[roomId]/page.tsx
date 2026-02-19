"use client";

import React, { useEffect, useRef } from "react";
import { initDraw } from "../../../draw";

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      initDraw(canvasRef.current);
    }
  }, [canvasRef]);

  return (
    <div className="">
      <canvas ref={canvasRef} width={2050} height={1000} />
    </div>
  );
};

export default Canvas;
