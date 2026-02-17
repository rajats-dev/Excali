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

const app = express();
app.use(express.json());

app.post("./signup", async (req, res) => {
  const parseddata = CreateUserSchema.safeParse(req.body);

  if (!parseddata.success) {
    res.json({ message: "Incorrect Input" });
    return;
  }
  try {
    await prisma.user.create({
      data: {
        email: parseddata.data?.username,
        password: parseddata.data?.password,
        name: parseddata.data?.name,
      },
    });
    res.status(201).json({ userId: "123" });
  } catch (error) {
    res.status(411).json({ message: "User alraady exist with this username" });
  }
});

app.post("/signin", (req, res) => {
  const data = SigninSchema.safeParse(req.body);

  if (!data.success) {
    res.json({ message: "Incorrect Input" });
    return;
  }
  const userId = 1;
  const token = jwt.sign({ userId }, JWT_SECRET);

  res.json({ token });
});

app.post("./room", middleware, (req, res) => {
  const data = CreateRoomSchema.safeParse(req.body);

  if (!data.success) {
    res.json({ message: "Incorrect Input" });
    return;
  }
  res.json({ roomId: 1233 });
});

app.get("/", (req, res) => {
  res.send("Server is Running");
});

app.listen(3001, () => {
  console.log("Server is running at 3001");
});
