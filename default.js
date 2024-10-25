exports.handler = async (event, context) => {
    console.log("event", event);
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "default"
        })
    }
}