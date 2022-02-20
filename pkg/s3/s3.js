const { S3Client, ListObjectsV2Command, HeadObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

const S3_BUCKET = "priconne-vanilla-statefiles";

let client;

const initializeS3Client = () => {
    client = new S3Client({ region: "eu-west-1" });
    console.log("Successfully initialized S3 Client");
};

// streamToString converts aws-sdk GetObjectOuput.Body to string
// https://github.com/aws/aws-sdk-js-v3/issues/1877#issuecomment-755387549
const streamToString = (stream) =>
    new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
});

// listStateFiles returns array of discord id in the s3 bucket
// It removes the .json file extension for easy processing later on
const listStateFiles = async () => {
    const command = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
    });
    const response = await client.send(command);
    return response.Contents
        .filter(content => content.Key.match(/\d{17,}/))
        .map(c => c.Key.replace(".json", ""))
}

// hasStateFile checks if statefile exists for said user in S3
const hasStateFile = async (discordUserId) => {
    const key = `${discordUserId}.json`;
    const command = new HeadObjectCommand({
        Bucket: S3_BUCKET,
        Key: key
    });

    try {
        await client.send(command);
    } catch (err) {
        return false
    }

    return true;
}

// getUserDetailsFromStateFile fetches user details from statefile from S3
// Returns false if it doesn't exist
const getUserDetailsFromStateFile = async (discordUserId) => {
    const key = `${discordUserId}.json`;
    const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
    });

    let result;
    try {
        const data = await client.send(command);
        const body = await streamToString(data.Body)
        const json = JSON.parse(body);
        result = ({ alias, viewer_id } = json, { username: alias, viewer_id });
    } catch (err) {
        return false
    }

    return result;
}

module.exports = {
    initializeS3Client,
    listStateFiles,
    hasStateFile,
    getUserDetailsFromStateFile,
};