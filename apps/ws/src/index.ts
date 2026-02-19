import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/server-common/config";
import { prisma } from "@repo/db";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];

const checkUser = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded == "string") return null;
    if (!decoded || !decoded.userId) return null;
    return decoded.userId;
  } catch (e) {
    return null;
  }
};

wss.on("connection", function connections(ws, req) {
  const url = req.url;
  if (!url) return;

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") ?? "";
  const userId = checkUser(token);
  if (!userId) {
    ws.close();
    return null;
  }

  users.push({
    userId,
    rooms: [],
    ws,
  });

  ws.on("message", async function message(data: string) {
    const parsed_Data = JSON.parse(data);

    if (parsed_Data.type === "join_room") {
      const user = users.find((x) => x.ws === ws);
      user?.rooms.push(parsed_Data.roomId);
    }

    if (parsed_Data.type === "leave_room") {
      const user = users.find((x) => x.ws === ws);
      if (!user) return;
      user.rooms = user?.rooms.filter((x) => x === parsed_Data.roomId);
    }

    if (parsed_Data.type === "chat") {
      const roomId = parsed_Data.roomId;
      const message = parsed_Data.message;

      await prisma.chat.create({
        data: {
          roomId: Number(roomId),
          message,
          userId,
        },
      });

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              message: message,
              roomId,
            }),
          );
        }
      });
    }
  });
});
