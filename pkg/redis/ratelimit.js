const { create: createRedisRateLimiter } = require('redis-rate-limiter');
const { getRedisClient } = require("./redis");

const DEBUG = true;

let globalSyncRateLimiter;
let userSyncRateLimiter;

const initializeGlobalSyncRateLimit = (redisClient) => {
    globalSyncRateLimiter = createRedisRateLimiter({
        redis: redisClient,
        window: 3600,
        limit: 100,
        key: () => "global-sync",
    });
};

const initializeUserSyncRateLimit = (redisClient) => {
    userSyncRateLimiter = createRedisRateLimiter({
        redis: redisClient,
        window: 7200,
        limit: 2,
        key: (discordId) => `user-sync-${discordId}`,
    });
};

const printRateDebug = (rate) => {
    if (!DEBUG) return;
    console.debug(`[${rate.current}/${rate.limit}]: ${rate.key}`);
}

// isHittingGlobalSyncRateLimit returns true if hitting global rate limit for syncs
const isHittingGlobalSyncRateLimit = () => {
    let retval = false;
    globalSyncRateLimiter("", (err, rate) => {
        if (err) {
            console.error("Rate limiting not available!");
            retval = true;
            return;
        }

        printRateDebug(rate);
        if (rate.over) {
            console.warn("Hitting global sync rate limit");
            retval = true;
            return;
        }
    });
    return retval;
};

// isHittingUserSyncRateLimit returns true if hitting rate limit for user syncs
const isHittingUserSyncRateLimit = (discordId) => {
    let retval = false;
    userSyncRateLimiter(discordId, (err, rate) => {
        if (err) {
            console.error("Rate limiting not available!");
            retval = true;
            return;
        }

        printRateDebug(rate);
        if (rate.over) {
            console.warn("Hitting user sync rate limit", discordId);
            retval = true;
            return;
        }
    });
    return retval;
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