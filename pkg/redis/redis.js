const { createClient } = require("redis");

let redisClient;

const initializeRedisClient = async () => {
    redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    console.log("Successfully initialized Redis Client");
}

module.exports = {
    redisClient,
    initializeRedisClient,
}