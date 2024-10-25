const { putItem } = require("./utilities/Dynamodb/dynamoDbHelpers");
exports.handler = async (event, context) => {
    console.log("event", event);
    const { connectionId: id } = event.requestContext;
    const topics = event.queryStringParameters.topics || null;
    await putItem(process.env.DYNAMODB_TABLE_NAME, { id, date: Date.now(), topics });
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "connected"
        })
    }
}