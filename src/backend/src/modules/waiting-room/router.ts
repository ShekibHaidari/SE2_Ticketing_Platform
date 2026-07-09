import { Router } from "express";
import { getRedisClient } from "../../config/redis";
import { asyncHandler } from "../../shared/asyncHandler";
import { AppError } from "../../shared/errors";
import { jsonOk } from "../../shared/http";

const router = Router();

type WaitingRoomRequest = {
  showtimeId?: number;
  eventId?: number;
  userId?: number;
};

function waitingRoomKey(showtimeId: number, userId: number) {
  return `waiting_room:${showtimeId}:${userId}`;
}

router.post("/join", asyncHandler(async (req, res) => {
  const { showtimeId, eventId, userId } = req.body as WaitingRoomRequest;
  const effectiveShowtimeId = Number(showtimeId ?? eventId);

  if (!effectiveShowtimeId || !userId) {
    throw new AppError(400, "showtimeId and userId are required.");
  }

  const redis = await getRedisClient();
  await redis.set(
    waitingRoomKey(effectiveShowtimeId, Number(userId)),
    JSON.stringify({
      admitted: true,
      queuePosition: 0,
      joinedAt: new Date().toISOString(),
    }),
    { EX: 600 },
  );

  jsonOk(res, {
    showtimeId: effectiveShowtimeId,
    userId: Number(userId),
    admitted: true,
    queuePosition: 0,
    estimatedWaitSeconds: 0,
  }, 202);
}));

router.get("/status", asyncHandler(async (req, res) => {
  const effectiveShowtimeId = Number(req.query.showtimeId ?? req.query.eventId);
  const userId = Number(req.query.userId);

  if (!effectiveShowtimeId || !userId) {
    throw new AppError(400, "showtimeId and userId query parameters are required.");
  }

  const redis = await getRedisClient();
  const raw = await redis.get(waitingRoomKey(effectiveShowtimeId, userId));

  if (!raw) {
    jsonOk(res, {
      showtimeId: effectiveShowtimeId,
      userId,
      admitted: false,
      queuePosition: null,
      estimatedWaitSeconds: 0,
      status: "not-found",
    });
    return;
  }

  const value = JSON.parse(raw) as { admitted: boolean; queuePosition: number };
  jsonOk(res, {
    showtimeId: effectiveShowtimeId,
    userId,
    admitted: value.admitted,
    queuePosition: value.queuePosition,
    estimatedWaitSeconds: 0,
    status: value.admitted ? "admitted" : "queued",
  });
}));

export default router;
