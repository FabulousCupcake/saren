const { createClient } = require("redis");

let redisClient;

const initializeRedisClient = () => {
    redisClient = createClient(process.env.REDIS_URL);
}

module.exports = {
    redisClient,
    initializeRedisClient,
}