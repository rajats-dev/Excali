import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/server-common/config";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connections(ws, req) {
  const url = req.url;
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") ?? "";

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      ws.close();
      return;
    }
  });

  ws.on("message", function message(data) {
    ws.send("pong");
  });
});
