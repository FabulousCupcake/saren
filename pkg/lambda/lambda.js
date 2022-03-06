const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const LAMBDA_FUNCTION_NAME = "arn:aws:lambda:eu-west-1:663412056516:function:suzume";

let client;

const initializeLambdaClient = () => {
    client = new LambdaClient({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: 'eu-west-1',
    });
    console.log("Successfully initialized Lambda Client");
};

const send = async (command, args) => {
    const invokeCommand = new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify({
            command: command,
            args: args,
        }),
        LogType: "None",
    });
    const response = await client.send(invokeCommand);

    // Check if Suzume returns or contains errors
    console.log("send response", response);
    console.log("send errormessage", response.errorMessage);
    if (response.errorMessage) {
        console.error("Suzume returned error!");
        throw response;
    }

    return response;
}

const register = async (discordId, accountId, password) => {
    return await send("register", [ discordId, accountId, password ]);
};

const disable = async (discordId) => {
    return await send("disable", [ discordId ]);
};

const check = async (discordId) => {
    return await send("check", [ discordId ]);
};

const login = async (discordId) => {
    return await send("login", [ discordId ]);
};

module.exports = {
    initializeLambdaClient,
    register,
    disable,
    check,
    login,
};