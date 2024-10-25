const {
    GetCommand,
    ScanCommand,
    PutCommand,
    DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const {
    QueryCommand,
    BatchExecuteStatementCommand,
    BatchWriteItemCommand,
    BatchGetItemCommand
} = require("@aws-sdk/client-dynamodb");
const ddbDocClient = require("../../config/Dynamodb/ddbDocClient");
const ddbClient = require("../../config/Dynamodb/ddbClient");
const { unmarshall, marshall } = require("@aws-sdk/util-dynamodb");

const getItem = async (tableName, key, indexName = null) => {
    const params = {
        TableName: tableName,
        Key: key,
    };
    if (indexName !== null) {
        params["IndexName"] = indexName;
    }
    try {
        const data = await ddbDocClient.send(new GetCommand(params));
        console.log("Get Item Success :", data.Item);
        return App.lodash.get(data, "Item", null);
    } catch (err) {
        console.log("Error", err);
        throw new Error(
            "DynamoDb Error: " + err,
            err.$metadata.httpStatusCode
        );
    }
};

const query = async (
    tableName,
    keyConditionExpression,
    filterExpression = null,
    expressionAttributeValues = null,
    indexName = null,
    expressionAttributeNames = null,
    projectionExpression = null,
) => {
    const params = {
        TableName: tableName,
    };
    if (keyConditionExpression !== null) {
        params["KeyConditionExpression"] = keyConditionExpression;
    }
    if (filterExpression !== null) {
        params["FilterExpression"] = filterExpression;
    }
    if (expressionAttributeValues !== null) {
        params["ExpressionAttributeValues"] = expressionAttributeValues;
    }
    if (indexName !== null) {
        params["IndexName"] = indexName;
    }
    if (expressionAttributeNames !== null) {
        params["ExpressionAttributeNames"] = expressionAttributeNames
    }
    if (projectionExpression !== null) {
        params["ProjectionExpression"] = projectionExpression;
    }
    try {
        const data = await ddbClient.send(new QueryCommand(params));
        return data.Items.map((item) => unmarshall(item));
    } catch (err) {
        console.error("Error: ", err);
        throw new Error(
            "DynamoDb Error: " + err,
            err.$metadata.httpStatusCode
        );
    }
};

const scanTable = async (
    tableName,
    filterExpression,
    expressionAttributeValues,
    expressionAttributeNames = null,
    projectionExpression = null,
    indexName = null
) => {
    const params = {
        TableName: tableName,
    };
    if (filterExpression !== null) {
        params["FilterExpression"] = filterExpression;
    }
    if (expressionAttributeValues !== null) {
        params["ExpressionAttributeValues"] = expressionAttributeValues;
    }
    if (expressionAttributeNames !== null) {
        params["ExpressionAttributeNames"] = expressionAttributeNames;
    }
    if (projectionExpression !== null) {
        params["ProjectionExpression"] = projectionExpression;
    }
    if (indexName !== null) {
        params["IndexName"] = indexName;
    }
    console.log(params);
    try {
        const data = await ddbDocClient.send(new ScanCommand(params));
        console.log("Scan success", data.Items.length);
        return data.Items;
    } catch (err) {
        console.log("Error", err);
        throw new Error(
            "DynamoDb Error: " + err,
            err.$metadata.httpStatusCode
        );
    }
};

const putItem = async (tableName, item) => {
    const params = {
        TableName: tableName,
        Item: item,
    };
    try {
        const data = await ddbDocClient.send(new PutCommand(params));
        console.log("Success - item added or updated", data);
        return data;
    } catch (err) {
        console.log("Error", err);
        throw new Error(
            "DynamoDb Error: " + err,
            err.$metadata.httpStatusCode
        );
    }
};

const getItems = async (tableName, conditions, parameters) => {
    const params = {
        Statements: [
            {
                Statement: "SELECT * FROM " + tableName + conditions,
                Parameters: parameters,
            },
        ],
    };
    try {
        const data = await ddbDocClient.send(
            new BatchExecuteStatementCommand(params)
        );
        return data; // For unit tests.
    } catch (err) {
        console.error(err);
        throw new Error(
            "DynamoDb Error: " + err,
            err.$metadata.httpStatusCode
        );
    }
};

const batchWriteItem = async (tableName, records) => {
    const params = {
        RequestItems: {
            [tableName]: records,
        },
    };
    try {
        const result = await ddbClient.send(new BatchWriteItemCommand(params));
        console.log("Success - items deleted");
        return result;
    } catch (err) {
        console.log("Error", err);
        throw new Error(
            "DynamoDb Error: " + err,
            err.$metadata.httpStatusCode
        );
    }
};

const deleteItem = async (tableName, key) => {
    const params = {
        TableName: tableName,
        Key: key,
    };
    try {
        const result = await ddbDocClient.send(new DeleteCommand(params));
        console.log("Success - item deleted");
        return result;
    } catch (err) {
        console.log("Error", err);
        throw new Error(
            "DynamoDb Error: " + err,
            err.$metadata.httpStatusCode
        );
    }
};

const batchWriteItemUpdated = async (tableName, records, requestType) => {
    const updatedRecords = records.map((record) => {
        const marshalledRecord = marshall(record);
        const updatedRecord = { [requestType]: { Item: marshalledRecord } }
        return updatedRecord;
    });
    const params = {
        RequestItems: {
            [tableName]: updatedRecords,
        },
    };
    let unprocessedItems = {};
    try {
        do {
            const result = await ddbClient.send(new BatchWriteItemCommand(params));
            console.log("Success - batch write item");
            console.log(JSON.stringify(result));
            unprocessedItems = App.lodash.get(result, "UnprocessedItems");
            console.log("Unprocessed items:", JSON.stringify(unprocessedItems));
            if (unprocessedItems && !App.lodash.isEmpty(unprocessedItems)) {
                console.log("Retrying unprocessed items:", JSON.stringify(unprocessedItems));
                params.RequestItems = unprocessedItems;
                await timeout(500);
            }
        } while (!App.lodash.isEmpty(unprocessedItems));
        return { success: true };
    } catch (err) {
        console.log("Error", err);
        throw new Error(
            "DynamoDb Error: " + err,
            err.$metadata.httpStatusCode
        );
    }
}

const batchWriteItemWithRetry = async (tableName, records) => {
    const params = {
        RequestItems: {
            [tableName]: records,
        },
    };
    let unprocessedItems = {};
    try {
        do {
            const result = await ddbClient.send(new BatchWriteItemCommand(params));
            console.log("Success - batch write item");
            console.log(JSON.stringify(result));
            unprocessedItems = App.lodash.get(result, "UnprocessedItems");
            console.log("Unprocessed items:", JSON.stringify(unprocessedItems));
            if (unprocessedItems && !App.lodash.isEmpty(unprocessedItems)) {
                console.log("Retrying unprocessed items:", JSON.stringify(unprocessedItems));
                params.RequestItems = unprocessedItems;
                await timeout(500);
            }
        } while (!App.lodash.isEmpty(unprocessedItems));
        return { success: true };
    } catch (err) {
        console.log("Error", err);
        throw new Error(
            "DynamoDb Error: " + err,
            err.$metadata.httpStatusCode
        );
    }
}

const queryUpdated = async (
    params
) => {
    try {
        const data = await ddbClient.send(new QueryCommand(params));
        const updatedItems = data.Items.map((item) => unmarshall(item));
        data.Items = updatedItems;
        return data;
    } catch (err) {
        console.error("Error: ", err);
        throw new Error(
            "DynamoDb Error: " + err,
            err.$metadata.httpStatusCode
        );
    }
};
timeout = (delay) => {
    console.log(`Setting timeout for ${delay}ms`);
    return new Promise(resolve => setTimeout(resolve, delay));
};

const batchGetItems = async (tableName, keys) => {
    const marshalledKeys = keys.map((key) => marshall(key));
    const params = {
        RequestItems: {
            [tableName]: {
                Keys: marshalledKeys,
            },
        },
    };
    let items = [];
    while (!App.lodash.isEmpty(App.lodash.get(params, "RequestItems"))) {
        try {
            const command = new BatchGetItemCommand(params);
            const response = await ddbClient.send(command);
            console.log("Success - batch get item");
            items = items.concat(response.Responses[tableName].map((item) => unmarshall(item)));
            if (response.UnprocessedKeys && !App.lodash.isEmpty(response.UnprocessedKeys)) {
                console.log("inside the if condition");
                params.RequestItems = response.UnprocessedKeys;
                await timeout(500);
            } else {
                break;
            }
        } catch (err) {
            console.error(err);
            throw new Error(
                "DynamoDb Error: " + err,
                err.$metadata.httpStatusCode
            );
        }
    }
    return items;
}

module.exports = {
    getItem: getItem,
    query: query,
    scanTable: scanTable,
    putItem: putItem,
    getItems: getItems,
    deleteItem: deleteItem,
    batchWriteItem: batchWriteItem,
    batchWriteItemUpdated: batchWriteItemUpdated,
    queryUpdated: queryUpdated,
    batchGetItems: batchGetItems,
    batchWriteItemWithRetry: batchWriteItemWithRetry
};  