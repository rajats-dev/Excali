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
    console.log(parseddata);
    const user = await prisma.user.create({
      data: {
        email: parseddata.data?.username,
        password: parseddata.data.password,
        name: parseddata.data.name,
      },
    });
    console.log(user);
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
    res.json({ message: "Incorrect Input" });
    return;
  }
  //@ts-ignore
  const userId = req.userId;
  try {
    const room = await prisma.room.create({
      data: {
        slug: parseddata.data?.name,
        adminId: userId,
      },
    });

    res.json({ roomId: room.id });
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

app.get("/", (req, res) => {
  res.send("Server is Running");
});

app.listen(3001, () => {
  console.log("Server is running at 3001");
});
