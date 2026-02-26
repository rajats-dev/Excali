import { useEffect, useState } from "react";
import { WS_URL } from "../app/config";

export function useSocket(roomId: string) {
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<WebSocket>();

  useEffect(() => {
    const ws = new WebSocket(
      `${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3ZDQwZmFkYS01YzA2LTQ4YjctOWRiOS00NDk3NmE2NGViZGMiLCJpYXQiOjE3NzIwOTQxMTZ9.AtzwyyD_fF03eTq5J2HlHD3Q4plYkXZyzMYUkgj6Vl8`,
    );
    ws.onopen = () => {
      setLoading(false);
      setSocket(ws);
      ws.send(JSON.stringify({ type: "join_room", roomId }));
    };
  }, []);

  return {
    socket,
    loading,
  };
}
