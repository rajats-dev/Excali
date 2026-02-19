import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/server-common/config";
import { middleware } from "./middleware";
import {
  CreateUserSchema,
  SigninSchema,
  CreateRoomSchema,
} from "@repo/common/types";
import { prisma } from "@repo/db";
import { PrismaClientKnownRequestError } from "../../../packages/db/generated/prisma/internal/prismaNamespace";

const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
  const parseddata = CreateUserSchema.safeParse(req.body);
  if (!parseddata.success) {
    res.json({ message: "Incorrect Input" });
    return;
  }

  try {
    const user = await prisma.user.create({
      data: {
        email: parseddata.data?.username,
        password: parseddata.data.password,
        name: parseddata.data.name,
      },
    });
    res.status(201).json({ userId: user?.id });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      console.error("Prisma error code:", error.code);
      console.error("Prisma error message:", error.message);
      if (error.code === "P2002") {
        res
          .status(409)
          .json({ message: "User already exists with this email" });
        return;
      }
      res.status(400).json({ message: "Invalid data provided" });
      return;
    }
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/signin", async (req, res) => {
  const parseddata = SigninSchema.safeParse(req.body);

  if (!parseddata.success) {
    res.json({ message: "Incorrect Input" });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      email: parseddata.data?.username,
      password: parseddata.data?.password,
    },
  });

  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const userId = user?.id;
  const token = jwt.sign({ userId }, JWT_SECRET);

  res.json({ token });
});

app.post("/room", middleware, async (req, res) => {
  const parseddata = CreateRoomSchema.safeParse(req.body);

  if (!parseddata.success) {
    res.json({ message: "Incorrect Input for room creation!" });
    return;
  }
  //@ts-ignore
  const userId = req.userId;
  try {
    try {
      const room = await prisma.room.create({
        data: {
          slug: parseddata.data?.name,
          adminId: userId,
        },
      });

      res.json({ roomId: room.id });
    } catch (error) {
      res.status(409).json({ message: "Room already exists with this name" });
    }
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      console.error("Prisma error code:", error.code);
      console.error("Prisma error message:", error.message);
      if (error.code === "P2002") {
        res.status(409).json({ message: "Room already exists with this name" });
        return;
      }
      res.status(400).json({ message: "Invalid data provided" });
      return;
    }
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/chats/:roomId", async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    const messages = await prisma.chat.findMany({
      where: { roomId: roomId },
      orderBy: { id: "desc" },
      take: 50,
    });

    res.json({ messages });
  } catch (e) {
    res.json({ messages: [] });
  }
});

app.get("/room/:slug", async (req, res) => {
  const slug = req.params.slug;
  const room = await prisma.room.findFirst({
    where: { slug },
  });
  res.json({ room });
});

app.get("/", (req, res) => {
  res.send("Server is Running");
});

app.listen(3001, () => {
  console.log("Server is running at 3001");
});
