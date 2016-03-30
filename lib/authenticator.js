function authenticate (userData,callback) {
	var username = userData.username;
	var password = userData.password;

	if (username == null || password == null) {
		callback(true); // Error
		return;
	}

	// Send on credentials to Pace....
	callback(false)
}

module.exports = {
	authenticate: authenticate
}