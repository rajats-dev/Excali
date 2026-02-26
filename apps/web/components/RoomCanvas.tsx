"use client";

import { useSocket } from "../hooks/useSocket";
import Canvas from "./Canvas";

const RoomCanvas = ({ roomId }: { roomId: string }) => {
  const { socket } = useSocket(roomId);

  if (!socket) {
    return <div>Connecting to serve...</div>;
  }

  return (
    <div>
      <Canvas roomId={roomId} socket={socket} />
    </div>
  );
};

export default RoomCanvas;
