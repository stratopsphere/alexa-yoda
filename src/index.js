
/**
 * This ...:
 *
 * Examples:
 * One-shot model:
 *  
 *  
 * Dialog model:
 *  User:  
 *  Alexa: 
 *  User:  
 *  Alexa: 
 *  User:  
 *  Alexa: 
 *          
 */

/**
 * App ID for the skill
 */
var APP_ID = undefined;//replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var http = require('http'),
    alexaDateUtil = require('./alexaDateUtil');

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * YodaSpeaker is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var YodaSpeaker = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
YodaSpeaker.prototype = Object.create(AlexaSkill.prototype);
YodaSpeaker.prototype.constructor = YodaSpeaker;

// ----------------------- Override AlexaSkill request and intent handlers -----------------------

YodaSpeaker.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

YodaSpeaker.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleWelcomeRequest(response);
};

YodaSpeaker.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

/**
 * override intentHandlers to map intent handling functions.
 */
YodaSpeaker.prototype.intentHandlers = {
    "OneshotYodaIntent": function (intent, session, response) {
        handleOneshotYodaRequest(intent, session, response);
    },

    "DialogYodaIntent": function (intent, session, response) {
        // Determine if 
        var citySlot = intent.slots.City;
        var dateSlot = intent.slots.Date;
        if (citySlot && citySlot.value) {
            handleCityDialogRequest(intent, session, response);
        } else if (dateSlot && dateSlot.value) {
            handleDateDialogRequest(intent, session, response);
        } else {
            handleNoSlotDialogRequest(intent, session, response);
        }
    },
  

    "AMAZON.HelpIntent": function (intent, session, response) {
        handleHelpRequest(response);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

// -------------------------- YodaSpeaker Domain Specific Business Logic --------------------------

// http://www.yodaspeak.co.uk/ - Supports XML/SOAP 
// http://funtranslations.com/ - Supports JSON,JSONP, REST  https://market.mashape.com/orthosie/yoda-translator
// https://market.mashape.com/explore


function handleWelcomeRequest(response) {
    var whichCityPrompt = "Which city would you like tide information for?",
        speechOutput = {
            speech: "<speak>Welcome to Tide Pooler. "
                + "<audio src='https://s3.amazonaws.com/ask-storage/YodaSpeaker/OceanWaves.mp3'/>"
                + whichCityPrompt
                + "</speak>",
            type: AlexaSkill.speechOutputType.SSML
        },
        repromptOutput = {
            speech: "I can lead you through providing a city and "
                + "day of the week to get tide information, "
                + "or you can simply open Tide Pooler and ask a question like, "
                + "get tide information for Seattle on Saturday. "
                + "For a list of supported cities, ask what cities are supported. "
                + whichCityPrompt,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };

    response.ask(speechOutput, repromptOutput);
}

function handleHelpRequest(response) {
    var repromptText = "Which city would you like tide information for?";
    var speechOutput = "I can lead you through providing a city and "
        + "day of the week to get tide information, "
        + "or you can simply open Tide Pooler and ask a question like, "
        + "get tide information for Seattle on Saturday. "
        + "For a list of supported cities, ask what cities are supported. "
        + "Or you can say exit. "
        + repromptText;

    response.ask(speechOutput, repromptText);
}








/**
 * This handles the one-shot interaction, where the user utters a phrase like:
 * 'Alexa, open Tide Pooler and get tide information for Seattle on Saturday'.
 * If there is an error in a slot, this will guide the user to the dialog approach.
 */
function handleOneshotTideRequest(intent, session, response) {

    // Determine city, using default if none provided
    var cityStation = getCityStationFromIntent(intent, true),
        repromptText,
        speechOutput;
    if (cityStation.error) {
        // invalid city. move to the dialog
        repromptText = "Currently, I know tide information for these coastal cities: " + getAllStationsText()
            + "Which city would you like tide information for?";
        // if we received a value for the incorrect city, repeat it to the user, otherwise we received an empty slot
        speechOutput = cityStation.city ? "I'm sorry, I don't have any data for " + cityStation.city + ". " + repromptText : repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }

    // Determine custom date
    var date = getDateFromIntent(intent);
    if (!date) {
        // Invalid date. set city in session and prompt for date
        session.attributes.city = cityStation;
        repromptText = "Please try again saying a day of the week, for example, Saturday. "
            + "For which date would you like tide information?";
        speechOutput = "I'm sorry, I didn't understand that date. " + repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }

    // all slots filled, either from the user or by default values. Move to final request
    getFinalTideResponse(cityStation, date, response);
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var YodaSpeaker = new YodaSpeaker();
    YodaSpeaker.execute(event, context);
};

