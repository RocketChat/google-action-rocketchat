// Environment Variables
const functions = require('firebase-functions');

module.exports = {
    SERVER_URL : functions.config().envariables.server_url,
    CLIENT_ID : functions.config().envariables.clientid,
    OAUTH_SERVICE_NAME : functions.config().envariables.oauth_service_name
};
