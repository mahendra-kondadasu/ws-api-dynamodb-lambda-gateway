const { deleteItem } = require("./utilities/Dynamodb/dynamoDbHelpers");
exports.handler = async (event, context) => {
    console.log("event", event);
    const { connectionId: id} = event.requestContext;
    await deleteItem(process.env.DYNAMODB_TABLE_NAME, { id });
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "disconnected"
        })
    }
}