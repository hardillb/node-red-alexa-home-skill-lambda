var request = require('request');

exports.myHandler = function(event, context, callback) {
    if (event.header.namespace === 'Alexa.ConnectedHome.Discovery') {
        discover(event, context, callback);
    } else if (event.header.namespace === 'Alexa.ConnectedHome.Control') {
        control(event,context, callback)
    } else if (event.header.namespace === 'Alexa.ConnectedHome.System') {
        system(event,context, callback);
    }
};

function discover(event, context, callback) {
    if (event.header.name === 'DiscoverAppliancesRequest') {
        var message_id = event.header.messageId;
        var oauth_id = event.payload.accessToken;

        //http request to the database
        request.get('',{
            auth: {
                'bearer': oauth_id
            },
            timeout: 2000
        },function(err){
            //timeout error?
        }).on('response',function(response){

        })on('error', function(error){
            //other error
        });

        var payload = {
            discoveredAppliances:[
                {
                    applianceId: "",
                    manufacturerName: "Node-RED";
                    modelName: "",
                    version: "0.0.1",
                    friendlyName: "Bedroom Light",
                    friendlyDescription: "Lights in Bedroom connected via Node-RED",
                    isReachable: true,
                    actions: [
                        "setPercentage",
                        "turnOn",
                        "turnOff"
                    ],
                    additionalApplianceDetails: {}
                }
            ]
        };

        var response = {
            header:{
                "messageId": message_id,
                "name": "DiscoverAppliancesResponse",
                "namespace": "Alexa.ConnectedHome.Discovery",
                "payloadVersion": "2"
            },
            payload: payload
        };

        callback(null, response);
    }
}

function command(event, context, callback) {
    var device_id = event.payload.appliance.applianceId;
    var message_id = event.header.messageId;

    var command = event.header.name;

    var header = {
            namespace: "Alexa.ConnectedHome.Control",
            payloadVersion: "2",
            messageId: message_id
        }

    switch(command) {
        case "TurnOnRequest":
            header.name = "TurnOnConfirmation"
            break;
        case "TurnOffRequest":
            header.name = "TurnOffConfirmation"
            break;
        case "SetPercentageRequest":
            header.name = "SetPercentageConfirmation";
            break;
        case "IncrementPercentageRequest":
            header.name = "IncrementPercentageConfirmation";
            break;
        case "DecrementPercentageRequest"
            header.name = "DecrementPercentageConfirmation";
            break;
    }

    response = {
        header: header,
        payload: {}
    }
    callback(null,response);
}

function system(event, context, callback) {
    var message_id = event.header.messageId;

    var response = {
        "header": {
            "messageId": messageId,
            "name": "HealthCheckResponse",
            "namespace": "Alexa.ConnectedHome.System",
            "payloadVersion": "2"
        },
        "payload": {
            "description": "The system is currently healthy",
            "isHealthy": true
        }
    };
    callback(null,response);
}