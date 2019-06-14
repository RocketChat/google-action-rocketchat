const envVariables = require('./config');

// Server URL Environment Variable

const {
	SERVER_URL
} = envVariables;


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
	kickuserurl: `${ SERVER_URL }/api/v1/channels.kick`,
	addleaderurl: `${ SERVER_URL }/api/v1/channels.addLeader`,
	channelrenameurl: `${ SERVER_URL }/api/v1/channels.rename`,
	unarchivechannelurl: `${ SERVER_URL }/api/v1/channels.unarchive`,
	channeltopicurl: `${ SERVER_URL }/api/v1/channels.setTopic`,
	channeldescriptionurl: `${ SERVER_URL }/api/v1/channels.setDescription`,
	channelannouncementurl: `${ SERVER_URL }/api/v1/channels.setAnnouncement`,
	removeleaderurl: `${ SERVER_URL }/api/v1/channels.removeLeader`,
	removemoderatorurl: `${ SERVER_URL }/api/v1/channels.removeModerator`,
	removeownerurl: `${ SERVER_URL }/api/v1/channels.removeOwner`,
	createimurl: `${ SERVER_URL }/api/v1/im.create`,
	creategroupurl: `${ SERVER_URL }/api/v1/groups.create`,
	deletegroupurl: `${ SERVER_URL }/api/v1/groups.delete`,
	addalltogroupurl: `${ SERVER_URL }/api/v1/groups.addAll`,
	groupinfourl: `${ SERVER_URL }/api/v1/groups.info?roomName=`,
	addgroupleaderurl: `${ SERVER_URL }/api/v1/groups.addLeader`,
	addgroupmoderatorurl: `${ SERVER_URL }/api/v1/groups.addModerator`,
	addgroupownerurl: `${ SERVER_URL }/api/v1/groups.addOwner`,
	archivegroupurl: `${ SERVER_URL }/api/v1/groups.archive`,
	inviteusertogroupurl: `${ SERVER_URL }/api/v1/groups.invite`,
	kickuserfromgroupurl: `${ SERVER_URL }/api/v1/groups.kick`,
	leavegroupurl: `${ SERVER_URL }/api/v1/groups.leave`,
	removegroupleaderurl: `${ SERVER_URL }/api/v1/groups.removeLeader`,
	removegroupmoderatorurl: `${ SERVER_URL }/api/v1/groups.removeModerator`,
	removegroupownerurl: `${ SERVER_URL }/api/v1/groups.removeOwner`,
	renamegroupurl: `${ SERVER_URL }/api/v1/groups.rename`,
	grouptopicurl: `${ SERVER_URL }/api/v1/groups.setTopic`,
	groupdescriptionurl: `${ SERVER_URL }/api/v1/groups.setDescription`,
	groupannouncementurl: `${ SERVER_URL }/api/v1/groups.setAnnouncement`,
	unarchivegroupurl: `${ SERVER_URL }/api/v1/groups.unarchive`,
	groupmessageurl: `${ SERVER_URL }/api/v1/groups.messages?roomId=`,
	groupcounterurl: `${ SERVER_URL }/api/v1/groups.counters?roomId=`,
};