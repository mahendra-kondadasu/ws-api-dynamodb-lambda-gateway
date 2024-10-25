const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");

const send = async (connectionId, domainName, stage, message) => {
    const callbackUrl = `https://${domainName}/${stage}`;
    const client =  new ApiGatewayManagementApiClient({ endpoint: callbackUrl });
    const params = {
        ConnectionId: connectionId,
        Data: JSON.stringify(message)
    }
    const command = new PostToConnectionCommand(params);
    return client.send(command);
}

module.exports = {
    send
}