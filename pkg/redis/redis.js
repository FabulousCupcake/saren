const { createClient } = require("redis");

let redisClient;

const initializeRedisClient = async () => {
    redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    console.log("Successfully initialized Redis Client");
}

const setArmoryText = async (id, text) => {
    const key = `armory-${id}`;
    await redisClient.set(key, text);
}

const getArmoryText = async (id) => {
    return await redisClient.get(key);
}

module.exports = {
    initializeRedisClient,
    setArmoryText,
    getArmoryText,
}