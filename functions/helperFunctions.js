const axios = require('axios');
const apiEndpoints = require('./apiEndpoints');
const envVariables = require('./config');

const removeWhitespace = require('remove-whitespace');
const emojiTranslate = require('moji-translate');
const stringSimilar = require('string-similarity')

const i18n = require('i18n');
var translate = require("@vitalets/google-translate-api")

// Server Credentials. Follow readme to set them up.
const {
	OAUTH_SERVICE_NAME
} = envVariables;

const login = async (accessToken) =>
	await axios
	.post(apiEndpoints.loginUrl, {
		serviceName: OAUTH_SERVICE_NAME,
		accessToken,
		expiresIn: 200,
	})
	.then((res) => res.data)
	.then((res) => {
		console.log(res);
		const headers = {
			'X-Auth-Token': res.data.authToken,
			'X-User-Id': res.data.userId,
		};
		return headers;
	})
	.catch((err) => {
		console.log(err);
	});

const createChannel = async (channelName, headers) =>
	await axios
	.post(
		apiEndpoints.createchannelurl, {
			name: channelName,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('CREATE_CHANNEL.SUCCESS', channelName);
		} else {
			return i18n.__('CREATE_CHANNEL.ERROR', channelName);
		}
	})
	.catch((err) => {
		console.log(err.message);
		if (err.response.data.errorType === 'error-duplicate-channel-name') {
			return i18n.__('CREATE_CHANNEL.ERROR_DUPLICATE_NAME', channelName);
		} else if (err.response.data.errorType === 'error-invalid-room-name') {
			return i18n.__('CREATE_CHANNEL.ERROR_INVALID_NAME', channelName);
		} else if (err.response.status === 401) {
			return i18n.__('CREATE_CHANNEL.AUTH_ERROR');
		} else {
			return i18n.__('CREATE_CHANNEL.ERROR', channelName);
		}
	});

const deleteChannel = async (channelDetails, headers) => {
	try{
		const response = await axios
		.post(
			channelDetails.type === 'c' ? apiEndpoints.deletechannelurl : apiEndpoints.deletegroupurl, {
				roomName: channelDetails.name,
			}, {
				headers
			}
		)
		.then((res) => res.data)

		if (response.success === true) {
			return i18n.__('DELETE_CHANNEL.SUCCESS', channelDetails.name);
		} else {
			return i18n.__('DELETE_CHANNEL.ERROR', channelDetails.name);
		}
	}catch(err) {
		console.log(err.message);
		if (err.response.data.errorType === 'error-room-not-found') {
			return i18n.__('DELETE_CHANNEL.ERROR_NOT_FOUND', channelDetails.name);
		} else {
			return i18n.__('DELETE_CHANNEL.ERROR', channelDetails.name);
		}
	};
}

const postMessage = async (channelName, message, headers) =>
	await axios
	.post(
		apiEndpoints.postmessageurl, {
			channel: `#${ channelName }`,
			text: message,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('POST_MESSAGE.SUCCESS');
		} else {
			return i18n.__('POST_MESSAGE.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('POST_MESSAGE.ERROR');
	});

const channelLastMessage = async (channelName, headers) =>
	await axios
	.get(`${ apiEndpoints.channelmessageurl }${ channelName }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.SUCCESS', name = res.messages[0].u.username, message = res.messages[0].msg, );
		} else {
			return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR', channelName);
		}
	})
	.catch((err) => {
		console.log(err.message);
		if (err.response.data.errorType === 'error-room-not-found') {
			return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);
		} else {
			return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR', channelName);
		}
	});

const getUserId = async (userName, headers) =>
	await axios
	.get(`${ apiEndpoints.userinfourl }${ userName }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => `${ res.user._id }`)
	.catch((err) => {
		console.log(err.message);
	});

const getRoomId = async (channelName, headers) =>
	await axios
	.get(`${ apiEndpoints.channelinfourl }${ channelName }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => `${ res.channel._id }`)
	.catch((err) => {
		console.log(err.message);
	});

const makeModerator = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.makemoderatorurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('MAKE_MODERATOR.SUCCESS', userName, channelName);
		} else {
			return i18n.__('MAKE_MODERATOR.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('MAKE_MODERATOR.ERROR_NOT_FOUND', channelName);
	});

const addAll = async (channelName, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.addallurl, {
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('ADD_ALL_TO_CHANNEL.SUCCESS', channelName);
		} else {
			return i18n.__('ADD_ALL_TO_CHANNEL.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('ADD_ALL_TO_CHANNEL.ERROR_NOT_FOUND', channelName);
	});

const addOwner = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.addownerurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('ADD_OWNER.SUCCESS', userName, channelName);
		} else {
			return i18n.__('ADD_OWNER.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('ADD_OWNER.ERROR_NOT_FOUND', channelName);
	});

const archiveChannel = async (channelDetails, headers) => {
	try{
		const response = await axios
		.post(
			 channelDetails.type === 'c' ? apiEndpoints.archivechannelurl : apiEndpoints.archivegroupurl, {
				roomId: channelDetails.id,
			}, {
				headers
			}
		)
		.then((res) => res.data)

		if (response.success === true) {
			return i18n.__('ARCHIVE_CHANNEL.SUCCESS', channelDetails.name);
		} else {
			return i18n.__('ARCHIVE_CHANNEL.ERROR');
		}
	}catch(err) {
		console.log(err.message);
		return i18n.__('ARCHIVE_CHANNEL.ERROR_NOT_FOUND', channelDetails.name);
	};
}

function replaceWhitespacesFunc(str) {
	return removeWhitespace(str);
}

function replaceWhitespacesDots(str) {
	return str.replace(/\s/ig, '.');
}

function emojiTranslateFunc(str) {
	onlyEmoji = true;
	return emojiTranslate.translate(str, onlyEmoji);
}

const getUnreadCounter = async (channelName, headers) =>
	await axios
	.get(`${ apiEndpoints.counterurl }${ channelName }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => `${ res.unreads }`)
	.catch((err) => {
		console.log(err.message);
	});

const getMentionsCounter = async (channelName, headers) =>
	await axios
	.get(`${ apiEndpoints.counterurl }${ channelName }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => `${ res.userMentions }`)
	.catch((err) => {
		console.log(err.message);
	});

const channelUnreadMessages = async (channelName, unreadCount, headers) =>
	await axios
	.get(`${ apiEndpoints.channelmessageurl }${ channelName }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {

			if (unreadCount == 0) {
				return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.NO_MESSAGE');
			} else {
				const msgs = [];

				for (let i = 0; i <= unreadCount - 1; i++) {
					msgs.push(`<s> ${res.messages[i].u.username} says, ${res.messages[i].msg} <break time=\"0.7\" /> </s>`);
				}

				var responseString = msgs.join('  ');

				var finalMsg = i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.MESSAGE', unreadCount, responseString);

				return finalMsg;
			}
		} else {
			return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		console.log(err.message);
		if (err.response.data.errorType === 'error-room-not-found') {
			return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);
		} else {
			return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.ERROR');
		}
	});

const channelUnreadMentions = async (channelName, roomid, mentionsCount, headers) =>
	await axios
	.get(`${ apiEndpoints.channelmentionsurl }${ roomid }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {

			if (mentionsCount == 0) {
				return i18n.__('GET_USER_MENTIONS_FROM_CHANNEL.NO_MESSAGE');
			} else {
				const msgs = [];

				for (let i = 0; i <= mentionsCount - 1; i++) {
					msgs.push(`<s> ${res.mentions[i].u.username} says, ${res.mentions[i].msg} <break time=\"0.7\" /> </s>`);
				}

				var responseString = msgs.join('  ');

				var finalMsg = i18n.__('GET_USER_MENTIONS_FROM_CHANNEL.MESSAGE', mentionsCount, responseString);

				return finalMsg;
			}
		} else {
			return i18n.__('GET_USER_MENTIONS_FROM_CHANNEL.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		console.log(err.message);
		if (err.response.data.errorType === 'error-room-not-found') {
			return i18n.__('GET_USER_MENTIONS_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);
		} else {
			return i18n.__('GET_USER_MENTIONS_FROM_CHANNEL.ERROR');
		}
	});

const inviteUser = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.inviteuserurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('INVITE_USER_TO_CHANNEL.SUCCESS', userName, channelName);
		} else {
			return i18n.__('INVITE_USER_TO_CHANNEL.ERROR', userName, channelName);
		}
	})
	.catch((err) => {
		console.log(err.message);
		console.log(err.message);
		console.log(err.message);
		if (err.response.data.errorType === 'error-room-not-found') {
			return i18n.__('INVITE_USER_TO_CHANNEL.ERROR_NOT_FOUND', channelName);
		} else {
			return i18n.__('INVITE_USER_TO_CHANNEL.ERROR', userName, channelName);
		}
	});


const leaveChannel = async (channelDetails, headers) => {
	try{
		const response = await axios
		.post(
			channelDetails.type === 'c' ? apiEndpoints.leavechannelurl : apiEndpoints.leavegroupurl, {
				roomId: channelDetails.id,
			}, {
				headers
			}
		)
		.then((res) => res.data)

		if (response.success === true) {
			return i18n.__('LEAVE_CHANNEL.SUCCESS', channelDetails.name);
		} else {
			return i18n.__('LEAVE_CHANNEL.ERROR', channelDetails.name);
		}
	}catch(err) {
		console.log(err.message);
		return i18n.__('LEAVE_CHANNEL.ERROR', channelDetails.name);
	};
}

const kickUser = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.kickuserurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('KICK_USER_FROM_CHANNEL.SUCCESS', userName, channelName);
		} else {
			return i18n.__('KICK_USER_FROM_CHANNEL.ERROR', userName, channelName);
		}
	})
	.catch((err) => {
		console.log(err.message);
		console.log(err.message);
		console.log(err.message);
		if (err.response.data.errorType === 'error-room-not-found') {
			return i18n.__('KICK_USER_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);
		} else {
			return i18n.__('KICK_USER_FROM_CHANNEL.ERROR', userName, channelName);
		}
	});

const addLeader = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.addleaderurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('ADD_LEADER.SUCCESS', userName, channelName);
		} else {
			return i18n.__('ADD_LEADER.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('ADD_LEADER.ERROR_NOT_FOUND', channelName);
	});

const channelRename = async (channelDetails, newName, headers) => {
	try{
		const response = await axios
		.post(
			channelDetails.type === 'c' ? apiEndpoints.channelrenameurl : apiEndpoints.renamegroupurl, {
				roomId: channelDetails.id,
				name: newName,
			}, {
				headers
			}
		)
		.then((res) => res.data)

		if (response.success === true) {
			return i18n.__('RENAME_ROOM.SUCCESS', channelDetails.name, newName);
		} else {
			return i18n.__('RENAME_ROOM.ERROR');
		}
	}catch(err){
		console.log(err.message);
		return i18n.__('RENAME_ROOM.ERROR_NOT_FOUND', channelDetails.name);
	};
}

const unarchiveChannel = async (channelDetails, headers) => {
	try{
		const response = await axios
		.post(
			channelDetails.type === 'c' ? apiEndpoints.unarchivechannelurl : apiEndpoints.unarchivegroupurl, {
				roomId: channelDetails.id,
			}, {
				headers
			}
		)
		.then((res) => res.data)

		if (response.success === true) {
			return i18n.__('UNARCHIVE_CHANNEL.SUCCESS', channelDetails.name);
		} else {
			return i18n.__('UNARCHIVE_CHANNEL.ERROR');
		}
	}catch(err){
		console.log(err.message);
		return i18n.__('UNARCHIVE_CHANNEL.ERROR_NOT_FOUND', channelDetails.name);
	};
}

const channelTopic = async (channelDetails, topic, headers) => {
	try{
		const response = await axios
		.post(
			channelDetails.type === 'c' ? apiEndpoints.channeltopicurl : apiEndpoints.grouptopicurl, {
				roomId: channelDetails.id,
				topic: topic,
			}, {
				headers
			}
		)
		.then((res) => res.data)

		if (response.success === true) {
			return i18n.__('CHANNEL_TOPIC.SUCCESS', channelDetails.name, topic);
		} else {
			return i18n.__('CHANNEL_TOPIC.ERROR');
		}
	}catch(err) {
		console.log(err.message);
		return i18n.__('CHANNEL_TOPIC.ERROR_NOT_FOUND', channelDetails.name);
	};
}

const channelDescription = async (channelDetails, description, headers) => {
	try{
		const response = await axios
		.post(
			channelDetails.type === 'c' ? apiEndpoints.channeldescriptionurl : apiEndpoints.groupdescriptionurl, {
				roomId: channelDetails.id,
				description: description,
			}, {
				headers
			}
		)
		.then((res) => res.data)

		if (response.success === true) {
			return i18n.__('CHANNEL_DESCRIPTION.SUCCESS', channelDetails.name, description);
		} else {
			return i18n.__('CHANNEL_DESCRIPTION.ERROR');
		}
	}catch(err) {
		console.log(err.message);
		return i18n.__('CHANNEL_DESCRIPTION.ERROR_NOT_FOUND', channelDetails.name);
	};
}

const channelAnnouncement = async (channelName, roomid, announcement, headers) =>
	await axios
	.post(
		apiEndpoints.channelannouncementurl, {
			roomId: roomid,
			announcement: announcement,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('CHANNEL_ANNOUNCEMENT.SUCCESS', channelName, announcement);
		} else {
			return i18n.__('CHANNEL_ANNOUNCEMENT.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('CHANNEL_ANNOUNCEMENT.ERROR_NOT_FOUND', channelName);
	});

const removeLeader = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.removeleaderurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('REMOVE_LEADER.SUCCESS', userName, channelName);
		} else {
			return i18n.__('REMOVE_LEADER.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('REMOVE_LEADER.ERROR_NOT_FOUND', channelName);
	});

const removeModerator = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.removemoderatorurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('REMOVE_MODERATOR.SUCCESS', userName, channelName);
		} else {
			return i18n.__('REMOVE_MODERATOR.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('REMOVE_MODERATOR.ERROR_NOT_FOUND', channelName);
	});

const removeOwner = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.removeownerurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('REMOVE_OWNER.SUCCESS', userName, channelName);
		} else {
			return i18n.__('REMOVE_OWNER.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('REMOVE_OWNER.ERROR_NOT_FOUND', channelName);
	});

const createDMSession = async (userName, headers) =>
	await axios
	.post(
		apiEndpoints.createimurl, {
			username: userName,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => `${ res.room._id }`)
	.catch((err) => {
		console.log(err.message);
	});

const postDirectMessage = async (message, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.postmessageurl, {
			roomId: roomid,
			text: message,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('POST_MESSAGE.SUCCESS');
		} else {
			return i18n.__('POST_MESSAGE.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('POST_MESSAGE.ERROR');
	});

const hinditranslate = async (str) =>
	await translate(str, {
		to: 'en'
	})
	.then((res) => `${ res.text }`)
	.catch(err => {
		console.error(err);
	});

const createGroup = async (channelName, headers) =>
	await axios
	.post(
		apiEndpoints.creategroupurl, {
			name: channelName,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('CREATE_CHANNEL.SUCCESS', channelName);
		} else {
			return i18n.__('CREATE_CHANNEL.ERROR', channelName);
		}
	})
	.catch((err) => {
		console.log(err.message);
		if (err.response.data.errorType === 'error-duplicate-channel-name') {
			return i18n.__('CREATE_CHANNEL.ERROR_DUPLICATE_NAME', channelName);
		} else if (err.response.data.errorType === 'error-invalid-room-name') {
			return i18n.__('CREATE_CHANNEL.ERROR_INVALID_NAME', channelName);
		} else {
			return i18n.__('CREATE_CHANNEL.ERROR', channelName);
		}
	});

const getGroupId = async (channelName, headers) =>
	await axios
	.get(`${ apiEndpoints.groupinfourl }${ channelName }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => `${ res.group._id }`)
	.catch((err) => {
		console.log(err.message);
	});

const addAllToGroup = async (channelName, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.addalltogroupurl, {
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('ADD_ALL_TO_CHANNEL.SUCCESS', channelName);
		} else {
			return i18n.__('ADD_ALL_TO_CHANNEL.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('ADD_ALL_TO_CHANNEL.ERROR_NOT_FOUND', channelName);
	});

const addGroupLeader = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.addgroupleaderurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('ADD_LEADER.SUCCESS', userName, channelName);
		} else {
			return i18n.__('ADD_LEADER.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('ADD_LEADER.ERROR_NOT_FOUND', channelName);
	});


const addGroupModerator = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.addgroupmoderatorurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('MAKE_MODERATOR.SUCCESS', userName, channelName);
		} else {
			return i18n.__('MAKE_MODERATOR.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('MAKE_MODERATOR.ERROR_NOT_FOUND', channelName);
	});

const addGroupOwner = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.addgroupownerurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('ADD_OWNER.SUCCESS', userName, channelName);
		} else {
			return i18n.__('ADD_OWNER.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('ADD_OWNER.ERROR_NOT_FOUND', channelName);
	});

const archiveGroup = async (channelName, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.archivegroupurl, {
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('ARCHIVE_CHANNEL.SUCCESS', channelName);
		} else {
			return i18n.__('ARCHIVE_CHANNEL.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('ARCHIVE_CHANNEL.ERROR_NOT_FOUND', channelName);
	});

const deleteGroup = async (channelName, headers) =>
	await axios
	.post(
		apiEndpoints.deletegroupurl, {
			roomName: channelName,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('DELETE_CHANNEL.SUCCESS', channelName);
		} else {
			return i18n.__('DELETE_CHANNEL.ERROR', channelName);
		}
	})
	.catch((err) => {
		console.log(err.message);
		if (err.response.data.errorType === 'error-room-not-found') {
			return i18n.__('DELETE_CHANNEL.ERROR_NOT_FOUND', channelName);
		} else {
			return i18n.__('DELETE_CHANNEL.ERROR', channelName);
		}
	});

const inviteUserToGroup = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.inviteusertogroupurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('INVITE_USER_TO_CHANNEL.SUCCESS', userName, channelName);
		} else {
			return i18n.__('INVITE_USER_TO_CHANNEL.ERROR', userName, channelName);
		}
	})
	.catch((err) => {
		console.log(err.message);
		console.log(err.message);
		console.log(err.message);
		if (err.response.data.errorType === 'error-room-not-found') {
			return i18n.__('INVITE_USER_TO_CHANNEL.ERROR_NOT_FOUND', channelName);
		} else {
			return i18n.__('INVITE_USER_TO_CHANNEL.ERROR', userName, channelName);
		}
	});

const kickUserFromGroup = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.kickuserfromgroupurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('KICK_USER_FROM_CHANNEL.SUCCESS', userName, channelName);
		} else {
			return i18n.__('KICK_USER_FROM_CHANNEL.ERROR', userName, channelName);
		}
	})
	.catch((err) => {
		console.log(err.message);
		console.log(err.message);
		console.log(err.message);
		if (err.response.data.errorType === 'error-room-not-found') {
			return i18n.__('KICK_USER_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);
		} else {
			return i18n.__('KICK_USER_FROM_CHANNEL.ERROR', userName, channelName);
		}
	});

const leaveGroup = async (channelName, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.leavegroupurl, {
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('LEAVE_CHANNEl.SUCCESS', channelName);
		} else {
			return i18n.__('LEAVE_CHANNEl.ERROR', channelName);
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('LEAVE_CHANNEl.ERROR', channelName);
	});

const removeGroupLeader = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.removegroupleaderurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('REMOVE_LEADER.SUCCESS', userName, channelName);
		} else {
			return i18n.__('REMOVE_LEADER.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('REMOVE_LEADER.ERROR_NOT_FOUND', channelName);
	});

const removeGroupModerator = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.removegroupmoderatorurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('REMOVE_MODERATOR.SUCCESS', userName, channelName);
		} else {
			return i18n.__('REMOVE_MODERATOR.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('REMOVE_MODERATOR.ERROR_NOT_FOUND', channelName);
	});

const removeGroupOwner = async (userName, channelName, userid, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.removegroupownerurl, {
			userId: userid,
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('REMOVE_OWNER.SUCCESS', userName, channelName);
		} else {
			return i18n.__('REMOVE_OWNER.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('REMOVE_OWNER.ERROR_NOT_FOUND', channelName);
	});

const groupRename = async (channelName, roomid, newName, headers) =>
	await axios
	.post(
		apiEndpoints.renamegroupurl, {
			roomId: roomid,
			name: newName,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('RENAME_ROOM.SUCCESS', channelName, newName);
		} else {
			return i18n.__('RENAME_ROOM.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('RENAME_ROOM.ERROR_NOT_FOUND', channelName);
	});

const groupTopic = async (channelName, roomid, topic, headers) =>
	await axios
	.post(
		apiEndpoints.grouptopicurl, {
			roomId: roomid,
			topic: topic,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('CHANNEL_TOPIC.SUCCESS', channelName, topic);
		} else {
			return i18n.__('CHANNEL_TOPIC.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('CHANNEL_TOPIC.ERROR_NOT_FOUND', channelName);
	});

const groupDescription = async (channelName, roomid, description, headers) =>
	await axios
	.post(
		apiEndpoints.groupdescriptionurl, {
			roomId: roomid,
			description: description,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('CHANNEL_DESCRIPTION.SUCCESS', channelName, description);
		} else {
			return i18n.__('CHANNEL_DESCRIPTION.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('CHANNEL_DESCRIPTION.ERROR_NOT_FOUND', channelName);
	});

const groupAnnouncement = async (channelName, roomid, announcement, headers) =>
	await axios
	.post(
		apiEndpoints.groupannouncementurl, {
			roomId: roomid,
			announcement: announcement,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('CHANNEL_ANNOUNCEMENT.SUCCESS', channelName, announcement);
		} else {
			return i18n.__('CHANNEL_ANNOUNCEMENT.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('CHANNEL_ANNOUNCEMENT.ERROR_NOT_FOUND', channelName);
	});

const unarchiveGroup = async (channelName, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.unarchivegroupurl, {
			roomId: roomid,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('UNARCHIVE_CHANNEL.SUCCESS', channelName);
		} else {
			return i18n.__('UNARCHIVE_CHANNEL.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('UNARCHIVE_CHANNEL.ERROR_NOT_FOUND', channelName);
	});

const groupLastMessage = async (channelName, roomid, headers) =>
	await axios
	.get(`${ apiEndpoints.groupmessageurl }${ roomid }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.SUCCESS', name = res.messages[0].u.username, message = res.messages[0].msg, );
		} else {
			return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR', channelName);
		}
	})
	.catch((err) => {
		console.log(err.message);
		if (err.response.data.errorType === 'error-room-not-found') {
			return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);
		} else {
			return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR', channelName);
		}
	});

const getGroupUnreadCounter = async (roomid, headers) =>
	await axios
	.get(`${ apiEndpoints.groupcounterurl }${ roomid }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => `${ res.unreads }`)
	.catch((err) => {
		console.log(err.message);
	});

const groupUnreadMessages = async (channelName, roomid, unreadCount, headers) =>
	await axios
	.get(`${ apiEndpoints.groupmessageurl }${ roomid }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {

			if (unreadCount == 0) {
				return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.NO_MESSAGE');
			} else {
				const msgs = [];

				for (let i = 0; i <= unreadCount - 1; i++) {
					msgs.push(`<s> ${res.messages[i].u.username} says, ${res.messages[i].msg} <break time=\"0.7\" /> </s>`);
				}

				var responseString = msgs.join('  ');

				var finalMsg = i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.MESSAGE', unreadCount, responseString);

				return finalMsg;
			}
		} else {
			return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		console.log(err.message);
		if (err.response.data.errorType === 'error-room-not-found') {
			return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);
		} else {
			return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.ERROR');
		}
	});

const postGroupMessage = async (roomid, message, headers) =>
	await axios
	.post(
		apiEndpoints.postmessageurl, {
			roomId: roomid,
			text: message,
		}, {
			headers
		}
	)
	.then((res) => res.data)
	.then((res) => {
		if (res.success === true) {
			return i18n.__('POST_MESSAGE.SUCCESS');
		} else {
			return i18n.__('POST_MESSAGE.ERROR');
		}
	})
	.catch((err) => {
		console.log(err.message);
		return i18n.__('POST_MESSAGE.ERROR');
	});

const getLastMessageType = async (channelName, headers) =>
	await axios
	.get(`${ apiEndpoints.channelmessageurl }${ channelName }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => {
		if (!res.messages[0].file) {
			return 'textmessage'
		} else {
			return res.messages[0].file.type
		}
	})
	.catch((err) => {
		console.log(err.message);
		if (err.response.data.errorType === 'error-room-not-found') {
			return 'room-not-found'
		}
	});

const getLastMessageFileURL = async (channelName, headers) =>
	await axios
	.get(`${ apiEndpoints.channelmessageurl }${ channelName }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => `https://bots.rocket.chat/file-upload/${ res.messages[0].file._id }/${res.messages[0].file.name}`)
	.catch((err) => {
		console.log(err.message);
	});

const getLastMessageFileDowloadURL = async (fileurl, headers) =>
	await axios
	.get(fileurl, {
		headers
	})
	.then((response) => `${ response.request.res.responseUrl }`)
	.catch((err) => {
		console.log(err.message);
	});

const getGroupLastMessageType = async (roomid, headers) =>
	await axios
	.get(`${ apiEndpoints.groupmessageurl }${ roomid }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => {
		if (!res.messages[0].file) {
			return 'textmessage'
		} else {
			return res.messages[0].file.type
		}
	})
	.catch((err) => {
		console.log(err.message);
		if (err.response.data.errorType === 'error-room-not-found') {
			return 'room-not-found'
		}
	});

const getGroupLastMessageFileURL = async (roomid, headers) =>
	await axios
	.get(`${ apiEndpoints.groupmessageurl }${ roomid }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => `https://bots.rocket.chat/file-upload/${ res.messages[0].file._id }/${res.messages[0].file.name}`)
	.catch((err) => {
		console.log(err.message);
	});

const resolveChannelname = async (channelName, headers) => {
	try {
		const publicChannelsResponse = await axios.get(apiEndpoints.channellisturl, {
			headers,
		}).then((res) => res.data);

		const privateChannelsResponse = await axios.get(apiEndpoints.grouplisturl, {
			headers,
		}).then((res) => res.data);

		// adding public channels to the array
		let channels = publicChannelsResponse.channels.map((channel) => ({
			name: channel.name,
			id: channel._id,
			type: channel.t }));

		// adding private channels to the array
		channels = channels.concat(privateChannelsResponse.groups.map((channel) => ({
			name: channel.name,
			id: channel._id,
			type: channel.t,
		})));

		if(channels.length === 0) {
			return null
		}

		let channelNames = channels.map(channel => channel.name)
		let comparison = stringSimilar.findBestMatch(removeWhitespace(channelName), channelNames)
		if(comparison.bestMatch.rating > 0.3) {
			return channels[comparison.bestMatchIndex]
		} else {
			return null
		}

	} catch (err) {
		console.log(err);
	}
};

const resolveUsername = async (username, headers) => {
	try {
		const subscriptions = await axios.get(apiEndpoints.getsubscriptionsurl, {
			headers,
		})
		.then((res) => res.data.update)
		.then((subscriptions) => subscriptions.filter((subscription) => subscription.t === 'd'))
		.then((subscriptions) => subscriptions.map((subscription) => ({
			name: subscription.name,
			id: subscription.rid.replace(subscription.u._id, ''),
			type: subscription.t,
		})));

		if(subscriptions.length === 0){
			return null
		}

		let usernames = subscriptions.map(user => user.name)
		let comparison = stringSimilar.findBestMatch(removeWhitespace(username), usernames)
		if(comparison.bestMatch.rating > 0.3) {
			return subscriptions[comparison.bestMatchIndex]
		} else {
			return null
		}

	} catch (err) {
		console.log(err);
	}
};

const randomProperty = function(obj) {
	if (typeof obj === 'string') {
		return obj;
	} else {
		const keys = Object.keys(obj);
		return obj[keys[keys.length * Math.random() << 0]];
	}
};

const setStatus = async (message, headers) => {
	try {
		const response = await axios.post(apiEndpoints.setstatusurl, {
			message,
		}, {
			headers,
		}).then((res) => res.data);

		if (response.success) {
			return i18n.__('STATUS.SUCCESS');
		}
		return i18n.__('STATUS.ERROR');
	} catch (err) {
		console.log(err);
		return i18n.__('STATUS.ERROR');
	}
};

// Module Export of Functions

module.exports.login = login;
module.exports.createChannel = createChannel;
module.exports.deleteChannel = deleteChannel;
module.exports.postMessage = postMessage;
module.exports.channelLastMessage = channelLastMessage;
module.exports.getUserId = getUserId;
module.exports.getRoomId = getRoomId;
module.exports.makeModerator = makeModerator;
module.exports.addAll = addAll;
module.exports.addOwner = addOwner;
module.exports.archiveChannel = archiveChannel;
module.exports.replaceWhitespacesFunc = replaceWhitespacesFunc;
module.exports.replaceWhitespacesDots = replaceWhitespacesDots;
module.exports.emojiTranslateFunc = emojiTranslateFunc;
module.exports.getUnreadCounter = getUnreadCounter;
module.exports.getMentionsCounter = getMentionsCounter;
module.exports.channelUnreadMessages = channelUnreadMessages;
module.exports.channelUnreadMentions = channelUnreadMentions;
module.exports.inviteUser = inviteUser;
module.exports.leaveChannel = leaveChannel;
module.exports.kickUser = kickUser;
module.exports.addLeader = addLeader;
module.exports.channelRename = channelRename;
module.exports.unarchiveChannel = unarchiveChannel;
module.exports.channelTopic = channelTopic;
module.exports.channelDescription = channelDescription;
module.exports.channelAnnouncement = channelAnnouncement;
module.exports.removeLeader = removeLeader;
module.exports.removeModerator = removeModerator;
module.exports.removeOwner = removeOwner;
module.exports.createDMSession = createDMSession;
module.exports.postDirectMessage = postDirectMessage;
module.exports.hinditranslate = hinditranslate;
module.exports.createGroup = createGroup;
module.exports.getGroupId = getGroupId;
module.exports.addAllToGroup = addAllToGroup;
module.exports.addGroupLeader = addGroupLeader;
module.exports.addGroupModerator = addGroupModerator;
module.exports.addGroupOwner = addGroupOwner;
module.exports.archiveGroup = archiveGroup;
module.exports.deleteGroup = deleteGroup;
module.exports.inviteUserToGroup = inviteUserToGroup;
module.exports.kickUserFromGroup = kickUserFromGroup;
module.exports.leaveGroup = leaveGroup;
module.exports.removeGroupLeader = removeGroupLeader;
module.exports.removeGroupModerator = removeGroupModerator;
module.exports.removeGroupOwner = removeGroupOwner;
module.exports.groupRename = groupRename;
module.exports.groupTopic = groupTopic;
module.exports.groupDescription = groupDescription;
module.exports.groupAnnouncement = groupAnnouncement;
module.exports.unarchiveGroup = unarchiveGroup;
module.exports.groupLastMessage = groupLastMessage;
module.exports.getGroupUnreadCounter = getGroupUnreadCounter;
module.exports.groupUnreadMessages = groupUnreadMessages;
module.exports.postGroupMessage = postGroupMessage;
module.exports.getLastMessageType = getLastMessageType;
module.exports.getLastMessageFileURL = getLastMessageFileURL;
module.exports.getLastMessageFileDowloadURL = getLastMessageFileDowloadURL;
module.exports.getGroupLastMessageType = getGroupLastMessageType;
module.exports.getGroupLastMessageFileURL = getGroupLastMessageFileURL;
module.exports.resolveChannelname = resolveChannelname;
module.exports.resolveUsername = resolveUsername;
module.exports.randomProperty = randomProperty;
module.exports.setStatus = setStatus;