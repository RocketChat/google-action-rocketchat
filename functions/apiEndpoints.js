
const envVariables = require('./config');

// Server URL Environment Variable

const { SERVER_URL } = envVariables;


// REST API Endpoints

module.exports = {
	loginUrl: `${ SERVER_URL }/api/v1/login`,
	createchannelurl: `${ SERVER_URL }/api/v1/channels.create`,
	deletechannelurl: `${ SERVER_URL }/api/v1/channels.delete`,
	postmessageurl: `${ SERVER_URL }/api/v1/chat.postMessage`,
	channelmessageurl: `${ SERVER_URL }/api/v1/channels.messages?roomName=`,
	channelinfourl: `${ SERVER_URL }/api/v1/channels.info?roomName=`,
	userinfourl: `${ SERVER_URL }/api/v1/users.info?username=`,
	addallurl: `${ SERVER_URL }/api/v1/channels.addAll`,
	makemoderatorurl: `${ SERVER_URL }/api/v1/channels.addModerator`,
	addownerurl: `${ SERVER_URL }/api/v1/channels.addOwner`,
	archivechannelurl: `${ SERVER_URL }/api/v1/channels.archive`,
	counterurl: `${ SERVER_URL }/api/v1/channels.counters?roomName=`,
	inviteuserurl: `${ SERVER_URL }/api/v1/channels.invite`,
	leavechannelurl: `${ SERVER_URL }/api/v1/channels.leave`,
	kickuserurl : `${ SERVER_URL }/api/v1/channels.kick`,
	addleaderurl : `${ SERVER_URL }/api/v1/channels.addLeader`,
	channelrenameurl : `${ SERVER_URL }/api/v1/channels.rename`,
	unarchivechannelurl: `${ SERVER_URL }/api/v1/channels.unarchive`,
	channeltopicurl: `${ SERVER_URL }/api/v1/channels.setTopic`,
	channeldescriptionurl: `${ SERVER_URL }/api/v1/channels.setDescription`,
	channelannouncementurl: `${ SERVER_URL }/api/v1/channels.setAnnouncement`,
	removeleaderurl : `${ SERVER_URL }/api/v1/channels.removeLeader`,
	removemoderatorurl : `${ SERVER_URL }/api/v1/channels.removeModerator`,
	removeownerurl : `${ SERVER_URL }/api/v1/channels.removeOwner`,
	createimurl : `${ SERVER_URL }/api/v1/im.create`,
};
