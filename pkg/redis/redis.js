const { createClient } = require("redis");

let redisClient;

const initializeRedisClient = async () => {
    console.log("!!!!!!!!!!");
    console.log(process.env.REDIS_URL);
    redisClient = createClient(process.env.REDIS_URL);
    await redisClient.connect();
    console.log("Successfully initialized Redis Client", redis.INFO("clients"));
}

module.exports = {
    redisClient,
    initializeRedisClient,
}