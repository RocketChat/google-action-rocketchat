// Environment Variables
const functions = require('firebase-functions');


if(process.env.DEVELOPMENT) {
    module.exports = {
        SERVER_URL: 'https://bots.rocket.chat',
        CLIENT_ID: 'RHzbmCGN9zZD793oJ',
        OAUTH_SERVICE_NAME: 'googleactiontest'
    }
} else {
    module.exports = {
        SERVER_URL : functions.config().envariables.server_url,
        CLIENT_ID : functions.config().envariables.clientid,
        OAUTH_SERVICE_NAME : functions.config().envariables.oauth_service_name
    };
}
