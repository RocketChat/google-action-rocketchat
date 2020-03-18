// Environment Variables
const functions = require('firebase-functions');

let config_vars;

// Manually provided configuration variables for local testing
if(process.env.IS_LOCAL_DEV === "true") {
	config_vars = {
		SERVER_URL : "your-server-url",
	    CLIENT_ID : "your-client-id",
	    OAUTH_SERVICE_NAME : "your-oauth-service-name"
	}
}
// Production configuration variables
else {
	config_vars = {
		SERVER_URL : functions.config().envariables.server_url,
	    CLIENT_ID : functions.config().envariables.clientid,
	    OAUTH_SERVICE_NAME : functions.config().envariables.oauth_service_name
	}
}

module.exports = config_vars;
