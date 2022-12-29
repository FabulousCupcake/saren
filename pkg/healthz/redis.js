const { getRedisClient } = require("../redis/redis");

const checkRedisClient = async () => {
  const redisClient = getRedisClient();

  console.log("isOpen", redisClient.isOpen);
  console.log("isReady", redisClient.isReady);

  if (!redisClient.isOpen) return false;
  if (!redisClient.isReady) return false;

  const pong = await redisClient.async.ping();

  return (pong === "PONG");
}

module.exports = {
  checkRedisClient,
}