/* dispatcher */
var fs = require('fs');
var comm = require('./communication');
var utils = require('./utils');
var dispatchObjects = {};
var voiceMessages = {'testid': 'I just called to say I love you'};
var fileLocation = 'db/cache';
var Promise = require("bluebird");


var mongodb = Promise.promisifyAll(require("mongodb"));
var MongoClient = Promise.promisifyAll(mongodb.MongoClient);
var murl = 'mongodb://heroic_test:sy4-WCd-9NF-ZV2@ds049935.mlab.com:49935/heroku_ld10h0gb';


loadDispatchObjects();
setInterval(cleanupTimer,60 * 1000);


function dispatch (data,callback,id) {
	switch (data.metadata.type) {
		case 'report':
			addDispatchObject(data,id);
			dispatchReport(data,function (err) {
				if (!err) {
					setDispatchObjectState(id,0);
					//removeDispatchObject(id);
				}
			});
			if (callback) callback('recieved report. but maybe not sent yet');
			break;
		case 'alert':
			addDispatchObject(data,id);
			dispatchAlert(data,function (err) {
				if (!err) {
					setDispatchObjectState(id,0);
					//removeDispatchObject(id);
				}
			});
			if (callback) callback('recieved alert. but maybe not sent yet');
			break;
		case 'webreport':
			if (id == null) {
				id = utils.createVerificationCode(dispatchObjects,6);
				data.metadata.id = id;
			}
			addDispatchObject(data,id);
			dispatchWebreportVerification(data,callback);

			break;
		default: break;
	}
}

function dispatchReport (report,callback) {
	var emailData = {
		subject : 'Report from Pace Safety',
		body: utils.formatReport(report.data)
	}
	comm.sendEmail(emailData, function(err) {
		callback(err);
	})
}

function dispatchAlert (alert,callback) {
	var emailData = {
		subject : 'Alert! from Pace Safety',
		body: utils.formatAlert(alert.data)
	};
	var smsData = {
		to: alert.data.to,
		body: utils.formatAlert(alert.data)
	};
	var voiceData = {
		id: alert.metadata.id,
		to: alert.data.to
	};
	var voiceMessage = alert.data.name + ' is in trouble! Please Help!';

	addVoiceMessage(alert.metadata.id,voiceMessage);

	comm.sendSMS(smsData,function(err,msg) {
		comm.sendCall(voiceData,function(err,call) {
			callback(err);
			setTimeout(function() {
				removeVoiceMessage(alert.metadata.id);
			}, 60 * 1000);
		});
	});
}

function dispatchWebreportVerification (report, callback) {
	var id = report.metadata.id;
	var report_insert = {"_id": id,
 		"report":report,

		"type":"unverified"};

		MongoClient.connect(murl, function (err, db) {
	  if (err) {
	    console.log('Unable to connect to the mongoDB server. Error:', err);
	  } else {

	    console.log('Connection established to', murl);
					var collection = db.collection('reports');
					collection.insert(report_insert, function (err, result) {
	      if (err) {
	        console.log(err);
	      } else {
	        console.log('Inserted documents into the "report user" collection. The documents inserted with "_id" are:');
	      }
	      //Close connection
	      db.close();
	    });
	  }
	});


	console.log(report.data.userEmail);

	var emailData = {
		to: report.data.userEmail,
		// subject: 'Verify your Report',
		body:  global.myUrl + '/verifywebreport/' + id.toString()
	};
	comm.sendEmailwithtemp(emailData, function(err) {
		callback(err);
		setDispatchObjectState(id,2);
	})
}

function verifyWebreport (code, callback) {
	if (dispatchObjects[code] == null || dispatchObjects[code].metadata.type != 'webreport') {
		callback('Thie Verification Code is Invalid.<br>Maybe the link has expired');
		return;
	}
	// change to a regular report
	dispatchObjects[code].metadata.type = 'report';
	delete dispatchObjects[code].metadata.timeCreated;
	setDispatchObjectState(code,1);
	// dispatch
	dispatch(dispatchObjects[code],null,code);

	MongoClient.connect(murl, function (err, db) {
	if (err) {
		console.log('Unable to connect to the mongoDB server. Error:', err);
	} else {

		console.log('Connection established to', murl);


	var collection = db.collection('reports');


		collection.update({"_id":code}, {$set: {"type":"verified"}}, function (err, report_number) {
		  if (err) {
		    console.log(err);
		  } else if (report_number) {
		    console.log('Updated Successfully  %d reports.',report_number);
		  } else {
		    console.log('No document found with defined "find" criteria!');
		  }
		  //Close connection
		  db.close();
		});
		}
		});

			callback('Verified Successfully!<br>Your report has been submitted.');
}

function addDispatchObject(obj,id) {
	if (id == null) {
		id = createRequestId();
		data.metadata['id'] = id;
	} else if (dispatchObjects[id] != null) {
		return;
	}
	dispatchObjects[id] = obj;
	printObjects();
    save();
}
function removeDispatchObject(id) {
	delete dispatchObjects[id];
	printObjects();
}
function setDispatchObjectState(id,state) {
	var obj = dispatchObjects[id];
	if (obj == null) return;
	obj.metadata.state = state;
	printObjects();
	save();
}

function addVoiceMessage(id,msg) {
	voiceMessages[id] = msg;
	printVoice();
}
function removeVoiceMessage(id) {
	delete voiceMessages[id];
	printVoice();
}
function printVoice() {
	console.log('===Voice MEssages==');
	console.log(voiceMessages);
	console.log('=======');
}

function listdocs(){
	var valuess=[];
	MongoClient.connectAsync(murl).then(function(db) {
		valuess= db.collection("reports").find({}).toArrayAsync();

	    return db.collection("reports").find({}).toArrayAsync();
	}).then(function(orders) {
	    console.log(orders)
	}).catch(function(err) {
	    console.log(err);
	});
return JSON.stringify(valuess);
}

function save () {
	try {
		var dataString = JSON.stringify(dispatchObjects);
		fs.writeFileSync(fileLocation, dataString);
		console.log('Saved.')
	}
	catch (e) {
		console.log('Save Error: ' + e);
	}
}
function loadDispatchObjects () {
	try {
		var json = fs.readFileSync(fileLocation);
		if (json == null) console.log('Load Error!');
		var data = JSON.parse(json);
		dispatchObjects = data;
		printObjects();
	}catch(e) {
		console.log('Parse/Load Error');
	}
}

function cleanupTimer () {
	var changed = false;
	for (id in dispatchObjects) {
		var obj = dispatchObjects[id];
		var type = obj.metadata.type;
		switch (obj.metadata.state) {
			case 0:
				removeDispatchObject(id);
				changed = true;
				break;
			case 1:
				if (type == 'report' || type == 'alert') {
					dispatch(obj,null,id);
				}
				break;
			case 2:
				if (type == 'webreport') {
					// waiting for verification
					// check its age to remove it if necessary
					if (obj.metadata.timeCreated != null) {
						var limit = 1000 * 60 * 60 * 10 // 10 hour expiration
						var currentTime = new Date().getMilliseconds();
						if (currentTime - obj.metadata.timeCreated > limit) {
							removeDispatchObject(id);
							changed = true
						}
					}
				}
				break;
			case 3:
				if (type == 'webreport') {
					// send verification again
					dispatch(obj,null,id);
				}
				break;
		}
	}
	if (changed) save();
}

function getVoiceMessageXML(id) {
	var msg = voiceMessages[id];
	if (!msg) msg = 'Sorry, ERROR';
	return comm.createMessageXML(msg);
}

function printObjects() {
	console.log('*** Open Dispatch Objects ***');
	console.log(dispatchObjects);
	console.log('*******************************')
}

function createRequestId () {
	var id = utils.getRandomInt(0,1000000000).toString();
	if (dispatchObjects[id] != null) return createRequestId();
	return id;
}

module.exports = {
	dispatch: dispatch,
	verifyWebreport: verifyWebreport,
	dispatchWebreportVerification:dispatchWebreportVerification,
	getVoiceMessageXML: getVoiceMessageXML,
	listdocs:listdocs
}
