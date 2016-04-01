/* server core */

var serverUrl = 'http://sclapp.herokuapp.com';
// global.myUrl = 'https://localhost:8080'; // local
// global.myUrl = 'sclapp.herokuapp.com'; // heroku server
global.myUrl = 'https://261f7c9f.ngrok.io'; // ngrok

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var dispatcher = require('./dispatcher');
var utils = require('./utils');
var auth = require('./authenticator');
var os = require("os");

if (os.platform() == 'linux') {
	global.myUrl = serverUrl;
	console.log('Im On Linux');
}


/* Setup */
app.set('port', (process.env.PORT || 8080));
app.set('view engine', 'jade');
app.use(express.static('public'));
// for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

/* Entry Points */
app.get('/alert/:code', function (req, res) {
	var alertCode = req.params.code;
	res.render('index', {
		name: "John Smith",
		alertType: "nervous",
		locationAddress: "1 Pace Plaza, Room E320 / Floor 3",
		locationLink: "http://maps.google.com"
	});
});


app.get('/reportslist',function (req,res){


dispatcher.listdocs(function(err,data){
			console.log(data);
		 res.render('listdoc',{document:data});
	});



});

app.get('/adminview');


app.get('/detailed/:code',function (req, res) {
	var reportcode = req.params.code;
	console.log(req.params.code);
	reportcode = reportcode.substr(1);
	dispatcher.detailed(reportcode,function(err,data){
		//console.log("aa"+data);

	res.render('details', {document:data});

});
});

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
app.post('/auth', function (req, res) {
	var userData = req.body;
	var callback = function(errorType) {
		switch (errorType) {
		case 1:
			/* wrong password */
			// set error number 404
			res.send('Wrong Password');
			break;
		case 2:
			/* something went wrong */
			// set error number 500?
			res.send('Random Error');
			break;
		default:
			// set error number 200
			res.send('Success');
			break;
		}
	};
	auth.authenticate(userData, function(err) {
		if (!err) {
			callback(0);
		} else {
			callback(1);
		}
	});
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
