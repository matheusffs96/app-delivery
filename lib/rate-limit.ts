import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv();

export const promotionCheckRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "los-hermanos:promotion:check",
});

export const promotionRedeemRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "5 m"),
    prefix: "los-hermanos:promotion:redeem",
});
