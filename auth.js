const jwt = require('jsonwebtoken');
require('dotenv').config();
exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Retrieve request parameters from the Lambda function input:
    var headers = event.headers;
    var queryStringParameters = event.queryStringParameters;
    var stageVariables = event.stageVariables;
    var requestContext = event.requestContext;

    // Parse the input for the parameter values
    var tmp = event.methodArn.split(':');
    var apiGatewayArnTmp = tmp[5].split('/');
    var awsAccountId = tmp[4];
    var region = tmp[3];
    var ApiId = apiGatewayArnTmp[0];
    var stage = apiGatewayArnTmp[1];
    var route = apiGatewayArnTmp[2];

    // Perform authorization to return the Allow policy for correct parameters and 
    // the 'Unauthorized' error, otherwise.
    var authResponse = {};
    var condition = {};
    condition.IpAddress = {};

    const token = headers.Auth;

    if (!token) {
        callback("Unauthorized");
    }

    const tokenParts = token.split(' ');
    const tokenValue = tokenParts[1];

    if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) {
        // no auth token!
        return callback('Unauthorized');
    }

    try {
        const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
        console.log('valid from customAuthorizer', decoded);
        callback(null, generateAllow(decoded.sub ?? 'me', event.methodArn, decoded));
    } catch (err) {
        console.log('catch error. Invalid token', err);
        return callback('Unauthorized');
    }
}

// Helper function to generate an IAM policy
var generatePolicy = function (principalId, effect, resource, decoded) {
    // Required output:
    var authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        var policyDocument = {};
        policyDocument.Version = '2012-10-17'; // default version
        policyDocument.Statement = [];
        var statementOne = {};
        statementOne.Action = 'execute-api:Invoke'; // default action
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    // Optional output with custom properties of the String, Number or Boolean type.
    authResponse.context = decoded;
    return authResponse;
}

var generateAllow = function (principalId, resource, decoded) {
    return generatePolicy(principalId, 'Allow', resource, decoded);
}

var generateDeny = function (principalId, resource) {
    return generatePolicy(principalId, 'Deny', resource, {});
}