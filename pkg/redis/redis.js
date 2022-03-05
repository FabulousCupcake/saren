const { createClient } = require("redis");
const { promisify } = require("util");

let redisClient;
let asyncGet;
let asyncSet;

const initializeRedisClient = async () => {
    redisClient = createClient({
        url: process.env.REDIS_URL,
        disableOfflineQueue: true,
        retry_strategy: function(options) {
            if (options.error && options.error.code === "ECONNREFUSED") {
                // End reconnecting on a specific error and flush all commands with
                // a individual error
                return new Error("The server refused the connection");
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
                // End reconnecting after a specific timeout and flush all commands
                // with a individual error
                return new Error("Retry time exhausted");
            }
            if (options.attempt > 10) {
                // End reconnecting with built in error
                return undefined;
            }
            // reconnect after
            return Math.min(options.attempt * 100, 3000);
        },

    });
    // redisClient.on("error", err => console.log('Redis Client Error', err));
    // await redisClient.connect(); // only needed in redis@v4

    asyncGet = promisify(redisClient.get).bind(redisClient);
    asyncSet = promisify(redisClient.set).bind(redisClient);

    console.log("Successfully initialized Redis Client");
}

const setArmoryText = async (id, text) => {
    const key = `armory-${id}`;
    await asyncSet(key, text);
}

const getArmoryText = async (id) => {
    const key = `armory-${id}`;
    return await asyncGet(key);
}

const setUserData = async (id, data) => {
    const text = JSON.stringify(data);
    const key = `userdata-${id}`;
    await asyncSet(key, text);
}

const getUserData = async (id) => {
    const key = `userdata-${id}`;
    const data = await asyncGet(key);
    const text = JSON.parse(data);
    return text;
}

const setUserSyncTimestamp = async (id, text) => {
    const key = `user-sync-timestamp-${id}`;
    await asyncSet(key, text);
}

const getUserSyncTimestamp = async (id) => {
    const key = `user-sync-timestamp-${id}`;
    return await asyncGet(key);
}

module.exports = {
    initializeRedisClient,
    setUserSyncTimestamp,
    getUserSyncTimestamp,
    setArmoryText,
    getArmoryText,
    setUserData,
    getUserData,
}