import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/server-common/config";
import { prisma } from "@repo/db";

const wss = new WebSocketServer({ port: 8081 });
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
  const token = queryParams.get("token") || "";
  const userId = checkUser(token);
  console.log("userId", userId);

  if (userId == null) {
    ws.close();
    return null;
  }

  users.push({
    userId,
    rooms: [],
    ws,
  });

  ws.on("close", (code, reason) => {
    console.log("WS CLOSE", code, reason.toString());
  });

  ws.on("error", (err) => {
    console.error("WS ERROR", err);
  });

  ws.on("message", async function message(data) {
    let parsed_Data;
    try {
      if (typeof data !== "string") {
        parsed_Data = JSON.parse(data.toString());
      } else {
        parsed_Data = JSON.parse(data);
      }
    } catch (err) {
      console.error("Invalid JSON from client:", err);
      return;
    }

    console.log(parsed_Data);

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

      console.log(roomId, message);

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
