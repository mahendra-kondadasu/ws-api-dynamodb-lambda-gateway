const WebSocket = require('./websocketMessage');
const { scanTable } = require("./utilities/Dynamodb/dynamoDbHelpers");
exports.handler = async (event, context) => {
    console.log("event", event);
    const { connectionId, domainName, stage } = event.requestContext;
    const body = JSON.parse(event.body);
    console.log("connectionId:", connectionId);
    console.log("body:", event.body);
    console.log("message:", body.message);
    const topics = body.topics || null;
    if (!topics) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "topics required"
            })
        }
    }
    let filterString = null;
    const attributeValues = {};
    const attributeNames = {};
    attributeNames[`#n0`] = "topics"
    topics.forEach((topic, index) => {
        const key = `:v`+index;
        if (filterString) {
            filterString += ` OR contains(#n0, ${key})`;
        } else {
            filterString = `contains(#n0, ${key})`;
        }
        attributeValues[key] = topic;
    });
    const connections = await scanTable(process.env.DYNAMODB_TABLE_NAME, filterString, attributeValues, attributeNames, "id", "id-topics-index");
    console.log("connections:", JSON.stringify(connections));
    const promises = connections.map(connection => WebSocket.send(connection.id, domainName, stage, body.message));
    await Promise.all(promises);
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "message sent"
        })
    }
}