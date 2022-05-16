const { create: createRedisRateLimiter } = require('redis-rate-limiter');
const { promisify } = require("util");

const { getRedisClient } = require("./redis");

const DEBUG = false;

let globalSyncRateLimiter;
let userSyncRateLimiter;

const initializeGlobalSyncRateLimit = (redisClient) => {
    const limit = createRedisRateLimiter({
        redis: redisClient,
        window: 6 * 3600,
        limit: 120,
        key: () => "global-sync",
    });
    globalSyncRateLimiter = promisify(limit);
};

const initializeUserSyncRateLimit = (redisClient) => {
    const limit = createRedisRateLimiter({
        redis: redisClient,
        window: 2 * 3600,
        limit: 2,
        key: (discordId) => `user-sync-${discordId}`,
    });
    userSyncRateLimiter = promisify(limit);
};

const printRateDebug = (rate) => {
    if (!DEBUG) return;
    console.debug(`[${rate.current}/${rate.limit}]: ${rate.key}`);
}

// isHittingGlobalSyncRateLimit returns true if hitting global rate limit for syncs
const isHittingGlobalSyncRateLimit = async () => {
    const rate = await globalSyncRateLimiter("");
    printRateDebug(rate);

    if (rate.over) {
        console.warn("Hitting global sync rate limit");
        return true;
    }

    return false;
};

// isHittingUserSyncRateLimit returns true if hitting rate limit for user syncs
const isHittingUserSyncRateLimit = async (discordId) => {
    const rate = await userSyncRateLimiter(discordId);
    printRateDebug(rate);

    if (rate.over) {
        console.warn("Hitting user sync rate limit", discordId);
        return true;
    }

    return false;
};

const initializeRateLimiters = () => {
    redisClient = getRedisClient();
    initializeGlobalSyncRateLimit(redisClient);
    initializeUserSyncRateLimit(redisClient);
}

module.exports = {
    initializeRateLimiters,
    isHittingGlobalSyncRateLimit,
    isHittingUserSyncRateLimit,
}