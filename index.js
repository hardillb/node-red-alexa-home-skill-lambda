var request = require('request');

exports.handler = function(event, context, callback) {
    log("Entry", event);
    if (event.header.namespace === 'Alexa.ConnectedHome.Discovery') {
        discover(event, context, callback);
    } else if (event.header.namespace === 'Alexa.ConnectedHome.Control') {
        command(event,context, callback)
    } else if (event.header.namespace === 'Alexa.ConnectedHome.System') {
        system(event,context, callback);
    }
};

function discover(event, context, callback) {
    log("Discover", event);
    if (event.header.name === 'DiscoverAppliancesRequest') {
        var message_id = event.header.messageId;
        var oauth_id = event.payload.accessToken;
        

        //http request to the database
        request.get('https://alexa-node-red.eu-gb.mybluemix.net/api/v1/devices',{
            auth: {
                'bearer': oauth_id
            },
            timeout: 2000
        },function(err, response, body){
            log("Discover body", body);
            if (response.statusCode == 200) {
                var payload = {
                    discoveredAppliances: JSON.parse(body)
                };

                var response = {
                    header:{
                        messageId: message_id,
                        name: "DiscoverAppliancesResponse",
                        namespace: "Alexa.ConnectedHome.Discovery",
                        payloadVersion: "2"
                    },
                    payload: payload
                };

                log('Discovery', response);

                //context.succeed(response);
                callback(null,response);
            } else if (response.statusCode == 401) {
                log('Discovery', "Auth failure");
                var response = {
                    header:{
                        messageId: message_id,
                        namespace: "Alexa.ConnectedHome.Control",
                        name: "ExpiredAccessTokenError",
                        payloadVersion: "2"
                    },
                    payload:{}
                };
    
                //context.succeed(response);
                callback(null,response);
            }

        }).on('error', function(error){
            log('Discovery',"error: " + error);
            //other error
            
            //context.fail(error);
            callback(error, null);
        });
    }
}

function command(event, context, callback) {
    var device_id = event.payload.appliance.applianceId;
    var message_id = event.header.messageId;
    var oauth_id = event.payload.accessToken;

    var command = event.header.name;

    log("Command", event);

    var header = {
            namespace: "Alexa.ConnectedHome.Control",
            payloadVersion: "2",
            messageId: message_id
        }

    switch(command) {
        case 'TurnOnRequest':
            header.name = "TurnOnConfirmation";
            break;
        case 'TurnOffRequest':
            header.name = "TurnOffConfirmation"
            break;
        case 'SetTargetTemperatureRequest':
            header.name = "SetTargetTemperatureConfirmation"
            break;
        case 'IncrementTargetTemperatureRequest':
            header.name = "IncrementTargetTemperatureConfirmation";
            break;
        case 'DecrementTargetTemperatureRequest':
            header.name = "DecrementTargetTemperatureConfirmation";
            break;
        case 'SetPercentageRequest':
            header.name = "SetPercentageConfirmation"
            break;
        case 'IncrementPercentageRequest':
            header.name = "IncrementPercentageConfirmation";
            break;
        case 'DecrementPercentageRequest':
            header.name = "DecrementPercentageConfirmation";
            break;
    }

    request.post('https://alexa-node-red.eu-gb.mybluemix.net/api/v1/command',{
        json: event,
        auth: {
            bearer: oauth_id
        },
        timeout: 2000
    }, function(err, resp, data){
        if (resp.statusCode === 200) {
            var response = {
                header: header,
                payload: data
            };
            
            log('command', JSON.stringify(response));
            //context.succeed(response);
            callback(null, response);
        } else if (resp.statusCode === 401) {
            log('command', "Auth failure");
            var response = {
                header:{
                    messageId: message_id,
                    namespace: "Alexa.ConnectedHome.Control",
                    name: "ExpiredAccessTokenError",
                    payloadVersion: "2"
                },
                payload:{}
            };
    
            //context.succeed(response);
            callback(null,response);
        } else if (resp.statusCode === 404) {
            //device not found
            log('command', "Not Found");
            var response = {
                header:{
                    messageId: message_id,
                    namespace: "Alexa.ConnectedHome.Control",
                    name: "NoSuchTargetError",
                    payloadVersion: "2"
                },
                payload:{}
            };
    
            //context.succeed(response);
            callback(null,response);
        } else if (resp.statusCode === 416) {
            //out of range
            //need to return ranges
            log('command', "Out of Range");
            var response = {
                header:{
                    messageId: message_id,
                    namespace: "Alexa.ConnectedHome.Control",
                    name: "ValueOutOfRangeError",
                    payloadVersion: "2"
                },
                payload:{
                    minimumValue: data.min,
                    maximumValue: data.max
                }
            };
    
            //context.succeed(response);
            callback(null,response);
        } else if (resp.statusCode === 503) {
            //service unavailable
            log('command', "Rejected");
            var response = {
                header:{
                    messageId: message_id,
                    namespace: "Alexa.ConnectedHome.Control",
                    name: "TargetHardwareMalfunctionError",
                    payloadVersion: "2"
                },
                payload:{}
            };
    
            //context.succeed(response);
            callback(null,response);

        } else if (resp.statusCode === 504) {
            //service timed out
            log('command', "Timed out");
            var response = {
                header:{
                    messageId: message_id,
                    namespace: "Alexa.ConnectedHome.Control",
                    name: "TargetOfflineError",
                    payloadVersion: "2"
                },
                payload:{}
            };
    
            //context.succeed(response);
            callback(null,response);
        }

        
    }).on('errror', function(error){
        log("Command",error);
        //context.fail(error);
        callback(error,null);
    });

}

function system(event, context, callback) {
    var message_id = event.header.messageId;

    var response = {
        "header": {
            "messageId": message_id,
            "name": "HealthCheckResponse",
            "namespace": "Alexa.ConnectedHome.System",
            "payloadVersion": "2"
        },
        "payload": {
            "description": "The system is currently healthy",
            "isHealthy": true
        }
    };
    //context.succeed(response);
    callback(null, response);
}

function log(title, msg) {
    console.log('*************** ' + title + ' *************');
    console.log(msg);
    console.log('*************** ' + title + ' End*************');
}