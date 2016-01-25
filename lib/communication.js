/* EMAIL, SMS, Voicecall */

var postmark = require("postmark")('ad510890-747d-4f9f-a2d8-3c61d5678d1c'); //Email Service
// Twilio Credentials for SMS, Voicecalls
var accountSid = 'AC5e9029c9829afec2e18de5cda722088c';
var authToken = '61feffbfb19e9e6dfc82141581510ffa';
var twilioPhoneNumber = '+12013659419'; //'+16465863267';
var client = require('twilio')(accountSid, authToken);


// Correspondents
var contacts = {
	'dhruv': {
		'email': 'dg93196n@pace.edu',
		'phone': '9179127231',
		'gets_alert_text': true,
		'gets_alert_call': true,
		'gets_report_email': true
	}
};
function getContactsForReportEmail () {
	var list = [];
	for (var name in contacts) {
		var contact = contacts[name];
		if (contact['gets_report_email']) list += contact.email;
	}
	return list;
}
function getContactsForAlertText () {
	var list = [];
	for (var name in contacts) {
		var contact = contacts[name];
		if (contact['gets_alert_text']) list += contact.phone;
	}
	return list;
}
function getContactsForAlertCall () {
	var list = [];
	for (var name in contacts) {
		var contact = contacts[name];
		if (contact['gets_alert_call']) list += contact.phone;
	}
	return list;
}
//

function sendEmail (data,callback) {
	postmark.send({
        "From": data.from? data.from : 'dg83196n@pace.edu',
        "To": data.to? data.to : 'dg83196n@pace.edu',
        "Subject": data.subject? data.subject : 'Default Subject',
        "TextBody": data.body? data.body : 'Default Body',
        "Tag": data.tag? data.tag : 'Important'
    }, callback);
}

function sendSMS (data, callback) {
	client.messages.create({
		to: (data.to != null)? data.to : "+19179127231",
		from: twilioPhoneNumber,
		body: (data.body != null)? data.body : 'this is a message',
	}, function(err, message) {
		if (callback != null) callback(err,message);
	});
}
function sendCall (data, callback) {
	var serverUrl = global.myUrl;
	var id = data.id;
	if (id == null) id = 'testid';
	console.log('gonna Call by: ' + serverUrl + "/voicemessagexml/" + id);

	client.calls.create({
		to: (data.to != null)? data.to : "+19179127231",
		from: twilioPhoneNumber,
		url: (serverUrl + "/voicemessagexml/" + id),
		method: "GET",
		fallbackMethod: "GET",
		statusCallbackMethod: "GET",
		record: "false"
	}, function(err, call) {
		console.log(err);
		if (callback != null) callback(err,call);
	});
}

function createMessageXML (messageString) {
	// Create a twilio xml for voice messages
	var xml = '<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice" language="en" loop="2">' + messageString + '</Say></Response>';
	return xml;
}

module.exports = {
	sendEmail : sendEmail,
	sendSMS : sendSMS,
	sendCall : sendCall,
	createMessageXML : createMessageXML
};
