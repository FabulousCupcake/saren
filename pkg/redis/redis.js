const { createClient } = require("redis");

let redisClient;

const initializeReditClient = () => {
    redisClient = createClient(process.env.REDIS_URL);
}

module.exports = {
    redisClient,
    initializeReditClient,
}