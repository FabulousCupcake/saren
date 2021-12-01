const { createClient } = require("redis");

let redisClient;

const initializeRedisClient = async () => {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on("error", err => console.log('Redis Client Error', err));
    await redisClient.connect();
    console.log("Successfully initialized Redis Client");
}

const setArmoryText = async (id, text) => {
    const key = `armory-${id}`;
    await redisClient.set(key, text);
}

const getArmoryText = async (id) => {
    const key = `armory-${id}`;
    return await redisClient.get(key);
}

module.exports = {
    initializeRedisClient,
    setArmoryText,
    getArmoryText,
}