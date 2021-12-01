const { S3Client, ListObjectsV2Command, HeadObjectCommand } = require("@aws-sdk/client-s3");

const S3_BUCKET = "priconne-vanilla-statefiles";

let client;

const initializeS3Client = () => {
    client = new S3Client({ region: "eu-west-1" });
    console.log("Successfully initialized S3 Client");
};

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

module.exports = {
    initializeS3Client,
    listStateFiles,
    hasStateFile,
};