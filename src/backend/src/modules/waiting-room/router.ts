import { Router } from "express";
import { getRedisClient } from "../../config/redis";
import { asyncHandler } from "../../shared/asyncHandler";
import { AppError } from "../../shared/errors";
import { jsonOk } from "../../shared/http";

const router = Router();

type WaitingRoomJoinRequest = {
  eventId?: number;
  userId?: number;
};

function waitingRoomKey(eventId: number, userId: number) {
  return `waiting_room:${eventId}:${userId}`;
}

router.post("/join", asyncHandler(async (req, res) => {
  const { eventId, userId } = req.body as WaitingRoomJoinRequest;

  if (!eventId || !userId) {
    throw new AppError(400, "eventId and userId are required.");
  }

  const redis = await getRedisClient();
  const key = waitingRoomKey(Number(eventId), Number(userId));

  await redis.set(key, JSON.stringify({
    admitted: true,
    queuePosition: 0,
    joinedAt: new Date().toISOString(),
  }), {
    EX: 600,
  });

  jsonOk(res, {
    eventId: Number(eventId),
    userId: Number(userId),
    admitted: true,
    queuePosition: 0,
    estimatedWaitSeconds: 0,
  }, 202);
}));

router.get("/status", asyncHandler(async (req, res) => {
  const eventId = Number(req.query.eventId);
  const userId = Number(req.query.userId);

  if (!eventId || !userId) {
    throw new AppError(400, "eventId and userId query parameters are required.");
  }

  const redis = await getRedisClient();
  const value = await redis.get(waitingRoomKey(eventId, userId));

  if (!value) {
    jsonOk(res, {
      eventId,
      userId,
      admitted: false,
      queuePosition: null,
      estimatedWaitSeconds: 0,
      status: "not-found",
    });
    return;
  }

  const parsed = JSON.parse(value) as {
    admitted: boolean;
    queuePosition: number;
    joinedAt: string;
  };

  jsonOk(res, {
    eventId,
    userId,
    admitted: parsed.admitted,
    queuePosition: parsed.queuePosition,
    estimatedWaitSeconds: 0,
    status: parsed.admitted ? "admitted" : "queued",
  });
}));

export default router;
