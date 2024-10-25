const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
let ddbConfig = {};
// Create an Amazon DynamoDB service client object.
module.exports = new DynamoDBClient(ddbConfig);
