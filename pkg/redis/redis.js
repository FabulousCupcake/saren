const { createClient } = require("redis");
const { promisify } = require("util");

let redisClient;

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

    // Need to set isOpen and isReady manually on v3
    redisClient.on("connect", () => {
        redisClient.isOpen = true;
        console.log("redis-client: connecting...");
    });
    redisClient.on("ready", () => {
        redisClient.isReady = true;
        console.log("redis-client: connected and ready!");
    });
    redisClient.on("reconnecting", () => {
        redisClient.isOpen = false;
        console.log("redis-client: reconnecting...");
    });
    redisClient.on("end", () => {
        redisClient.isOpen = false;
        redisClient.isReady = false;
        console.log("redis-client: disconnected and dead!");
    });
    redisClient.on('error', (err) => {
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("Connection to Redis server failed!");
        console.error(err);
    });

    redisClient.async = {};
    redisClient.async.get = promisify(redisClient.get).bind(redisClient);
    redisClient.async.set = promisify(redisClient.set).bind(redisClient);
    redisClient.async.ping = promisify(redisClient.ping).bind(redisClient);

    console.log("Successfully initialized Redis Client");
}

const setArmoryText = async (id, text) => {
    const key = `armory-${id}`;
    await redisClient.async.set(key, text);
}

const getArmoryText = async (id) => {
    const key = `armory-${id}`;
    return await redisClient.async.get(key);
}

const setUserData = async (id, data) => {
    const text = JSON.stringify(data);
    const key = `userdata-${id}`;
    await redisClient.async.set(key, text);
}

const getUserData = async (id) => {
    const key = `userdata-${id}`;
    const data = await redisClient.async.get(key);
    const text = JSON.parse(data);
    return text;
}

const setUserSyncTimestamp = async (id, text) => {
    const key = `user-sync-timestamp-${id}`;
    await redisClient.async.set(key, text);
}

const getUserSyncTimestamp = async (id) => {
    const key = `user-sync-timestamp-${id}`;
    return await redisClient.async.get(key);
}

const getRedisClient = () => {
    return redisClient;
}

module.exports = {
    initializeRedisClient,
    getRedisClient,
    setUserSyncTimestamp,
    getUserSyncTimestamp,
    setArmoryText,
    getArmoryText,
    setUserData,
    getUserData,
}