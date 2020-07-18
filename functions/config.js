// Environment Variables
if (process.env.DEVELOPMENT) {
    require('dotenv').config();
    module.exports = {
        SERVER_URL: process.env.SERVER_URL,
        CLIENT_ID: process.env.CLIENT_ID,
        OAUTH_SERVICE_NAME: process.env.OAUTH_SERVICE_NAME
    }
} else {
    const functions = require('firebase-functions');
    module.exports = {
        SERVER_URL : functions.config().envariables.server_url,
        CLIENT_ID : functions.config().envariables.clientid,
        OAUTH_SERVICE_NAME : functions.config().envariables.oauth_service_name
    };
}
