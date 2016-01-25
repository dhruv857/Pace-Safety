/* server core */

var serverUrl = 'http://sclpaceu.herokuapp.com';
// global.myUrl = 'https://localhost:8080'; // local
// global.myUrl = 'sclapp.herokuapp.com'; // heroku server
// global.myUrl = 'https://42fdae13.ngrok.io'; // ngrok

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var dispatcher = require('./dispatcher');
var utils = require('./utils');
var os = require("os");

if (os.platform() == 'linux') {
	global.myUrl = serverUrl;
	console.log('Im On Linux');
}


/* Setup */
app.set('port', (process.env.PORT || 8080));
// for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

/* Entry Points */
app.post('/report', function (req,res) {
	var callback = function(err) {
		res.send('err?: ' + err);
	};
	var report = utils.createReport(req.body);
	if (report) {
		dispatcher.dispatch(report,callback);
	} else {
		callback(true);
	}
});
app.post('/alert', function (req, res) {
	var callback = function(err) {
		res.send('err?: ' + err);
	};
	var alert = utils.createAlert(req.body);
	if (alert) {
		dispatcher.dispatch(alert,callback);
	} else {
		callback(true);
	}
});
app.post('/webreport', function (req, res) {
	var callback = function(err) {
		res.send('err?: ' + err);
	};
	var report = utils.createWebreport(req.body);
	if (report) {
		dispatcher.dispatch(report,callback);
	} else {
		callback(true);
	}
});
app.get('/verifywebreport/:code', function(req, res) {
	dispatcher.verifyWebreport(req.params.code, function (message) {
        res.send('<html><head><title>Verification</title></head><body><h4 style="color:black;font-weight:300">' + message + '</h2></body></html>');
    });
});

app.get('/locations', function (req, res) {
	var locations = utils.getLocations();
	res.send(locations);
});

// This Returns a Voice Message XML, based on the code of the report
app.get('/voicemessagexml/:code', function (req,res) {
    var xml = dispatcher.getVoiceMessageXML(req.params.code);
    console.log('They Asked for a Message..');
    res.setHeader('content-type', 'text/xml');
    res.end(xml);
});

/* Start Server */
// Start Listening at set Port (Starts Server)
app.listen(app.get('port'), function() {
    console.log("pace-safety running at localhost:" + app.get('port'));
});
