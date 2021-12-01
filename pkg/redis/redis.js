const { createClient } = require("redis");

let redisClient;

const initializeRedisClient = async () => {
    redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    console.log("Successfully initialized Redis Client", redis.INFO("clients"));
}

module.exports = {
    redisClient,
    initializeRedisClient,
}