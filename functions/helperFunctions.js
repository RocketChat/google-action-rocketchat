const axios = require('axios');
const removeWhitespace = require('remove-whitespace');
const emojiTranslate = require('moji-translate');
const i18n = require('i18n');
const translate = require('@vitalets/google-translate-api');

const envVariables = require('./config');
const apiEndpoints = require('./apiEndpoints');

// Server Credentials. Follow readme to set them up.
const {
	OAUTH_SERVICE_NAME,
} = envVariables;

const login = (accessToken) =>
	axios
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

const createChannel = (channelName, headers) =>
	axios
		.post(
			apiEndpoints.createchannelurl, {
				name: channelName,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('CREATE_CHANNEL.SUCCESS', channelName);
			}
			return i18n.__('CREATE_CHANNEL.ERROR', channelName);
		})
		.catch((err) => {
			console.log(err.message);
			if (err.response.data.errorType === 'error-duplicate-channel-name') {
				return i18n.__('CREATE_CHANNEL.ERROR_DUPLICATE_NAME', channelName);
			} if (err.response.data.errorType === 'error-invalid-room-name') {
				return i18n.__('CREATE_CHANNEL.ERROR_INVALID_NAME', channelName);
			} if (err.response.status === 401) {
				return i18n.__('CREATE_CHANNEL.AUTH_ERROR');
			}
			return i18n.__('CREATE_CHANNEL.ERROR', channelName);
		});

const deleteChannel = (channelName, headers) =>
	axios
		.post(
			apiEndpoints.deletechannelurl, {
				roomName: channelName,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('DELETE_CHANNEL.SUCCESS', channelName);
			}
			return i18n.__('DELETE_CHANNEL.ERROR', channelName);
		})
		.catch((err) => {
			console.log(err.message);
			if (err.response.data.errorType === 'error-room-not-found') {
				return i18n.__('DELETE_CHANNEL.ERROR_NOT_FOUND', channelName);
			}
			return i18n.__('DELETE_CHANNEL.ERROR', channelName);
		});

const postMessage = (channelName, message, headers) =>
	axios
		.post(
			apiEndpoints.postmessageurl, {
				channel: `#${ channelName }`,
				text: message,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('POST_MESSAGE.SUCCESS');
			}
			return i18n.__('POST_MESSAGE.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('POST_MESSAGE.ERROR');
		});

const channelLastMessage = (channelName, headers) =>
	axios
		.get(`${ apiEndpoints.channelmessageurl }${ channelName }`, {
			headers,
		})
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.SUCCESS', name = res.messages[0].u.username, message = res.messages[0].msg);
			}
			return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR', channelName);
		})
		.catch((err) => {
			console.log(err.message);
			if (err.response.data.errorType === 'error-room-not-found') {
				return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);
			}
			return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR', channelName);
		});

const getUserId = (userName, headers) =>
	axios
		.get(`${ apiEndpoints.userinfourl }${ userName }`, {
			headers,
		})
		.then((res) => res.data)
		.then((res) => `${ res.user._id }`)
		.catch((err) => {
			console.log(err.message);
		});

const getRoomId = (channelName, headers) =>
	axios
		.get(`${ apiEndpoints.channelinfourl }${ channelName }`, {
			headers,
		})
		.then((res) => res.data)
		.then((res) => `${ res.channel._id }`)
		.catch((err) => {
			console.log(err.message);
		});

const makeModerator = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.makemoderatorurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('MAKE_MODERATOR.SUCCESS', userName, channelName);
			}
			return i18n.__('MAKE_MODERATOR.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('MAKE_MODERATOR.ERROR_NOT_FOUND', channelName);
		});

const addAll = (channelName, roomid, headers) =>
	axios
		.post(
			apiEndpoints.addallurl, {
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('ADD_ALL_TO_CHANNEL.SUCCESS', channelName);
			}
			return i18n.__('ADD_ALL_TO_CHANNEL.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('ADD_ALL_TO_CHANNEL.ERROR_NOT_FOUND', channelName);
		});

const addOwner = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.addownerurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('ADD_OWNER.SUCCESS', userName, channelName);
			}
			return i18n.__('ADD_OWNER.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('ADD_OWNER.ERROR_NOT_FOUND', channelName);
		});

const archiveChannel = (channelName, roomid, headers) =>
	axios
		.post(
			apiEndpoints.archivechannelurl, {
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('ARCHIVE_CHANNEL.SUCCESS', channelName);
			}
			return i18n.__('ARCHIVE_CHANNEL.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('ARCHIVE_CHANNEL.ERROR_NOT_FOUND', channelName);
		});

function replaceWhitespacesFunc(str) {
	return removeWhitespace(str);
}

function replaceWhitespacesDots(str) {
	return str.replace(/\s/ig, '.');
}

function emojiTranslateFunc(str) {
	const onlyEmoji = true;
	return emojiTranslate.translate(str, onlyEmoji);
}

const getUnreadCounter = (channelName, headers) =>
	axios
		.get(`${ apiEndpoints.counterurl }${ channelName }`, {
			headers,
		})
		.then((res) => res.data)
		.then((res) => `${ res.unreads }`)
		.catch((err) => {
			console.log(err.message);
		});

const getMentionsCounter = (channelName, headers) =>
	axios
		.get(`${ apiEndpoints.counterurl }${ channelName }`, {
			headers,
		})
		.then((res) => res.data)
		.then((res) => `${ res.userMentions }`)
		.catch((err) => {
			console.log(err.message);
		});

const channelUnreadMessages = (channelName, unreadCount, headers) =>
	axios
		.get(`${ apiEndpoints.channelmessageurl }${ channelName }`, {
			headers,
		})
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				if (unreadCount === 0) {
					return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.NO_MESSAGE');
				}
				const msgs = [];

				for (let i = 0; i <= unreadCount - 1; i++) {
					msgs.push(`<s> ${ res.messages[i].u.username } says, ${ res.messages[i].msg } <break time=\"0.7\" /> </s>`);
				}

				const responseString = msgs.join('  ');

				const finalMsg = i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.MESSAGE', unreadCount, responseString);

				return finalMsg;
			}
			return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			console.log(err.message);
			if (err.response.data.errorType === 'error-room-not-found') {
				return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);
			}
			return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.ERROR');
		});

const channelUnreadMentions = (channelName, roomid, mentionsCount, headers) =>
	axios
		.get(`${ apiEndpoints.channelmentionsurl }${ roomid }`, {
			headers,
		})
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				if (mentionsCount === 0) {
					return i18n.__('GET_USER_MENTIONS_FROM_CHANNEL.NO_MESSAGE');
				}
				const msgs = [];

				for (let i = 0; i <= mentionsCount - 1; i++) {
					msgs.push(`<s> ${ res.mentions[i].u.username } says, ${ res.mentions[i].msg } <break time=\"0.7\" /> </s>`);
				}

				const responseString = msgs.join('  ');

				const finalMsg = i18n.__('GET_USER_MENTIONS_FROM_CHANNEL.MESSAGE', mentionsCount, responseString);

				return finalMsg;
			}
			return i18n.__('GET_USER_MENTIONS_FROM_CHANNEL.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			console.log(err.message);
			if (err.response.data.errorType === 'error-room-not-found') {
				return i18n.__('GET_USER_MENTIONS_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);
			}
			return i18n.__('GET_USER_MENTIONS_FROM_CHANNEL.ERROR');
		});

const inviteUser = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.inviteuserurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('INVITE_USER_TO_CHANNEL.SUCCESS', userName, channelName);
			}
			return i18n.__('INVITE_USER_TO_CHANNEL.ERROR', userName, channelName);
		})
		.catch((err) => {
			console.log(err.message);
			console.log(err.message);
			console.log(err.message);
			if (err.response.data.errorType === 'error-room-not-found') {
				return i18n.__('INVITE_USER_TO_CHANNEL.ERROR_NOT_FOUND', channelName);
			}
			return i18n.__('INVITE_USER_TO_CHANNEL.ERROR', userName, channelName);
		});


const leaveChannel = (channelName, roomid, headers) =>
	axios
		.post(
			apiEndpoints.leavechannelurl, {
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('LEAVE_CHANNEl.SUCCESS', channelName);
			}
			return i18n.__('LEAVE_CHANNEl.ERROR', channelName);
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('LEAVE_CHANNEl.ERROR', channelName);
		});

const kickUser = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.kickuserurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('KICK_USER_FROM_CHANNEL.SUCCESS', userName, channelName);
			}
			return i18n.__('KICK_USER_FROM_CHANNEL.ERROR', userName, channelName);
		})
		.catch((err) => {
			console.log(err.message);
			console.log(err.message);
			console.log(err.message);
			if (err.response.data.errorType === 'error-room-not-found') {
				return i18n.__('KICK_USER_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);
			}
			return i18n.__('KICK_USER_FROM_CHANNEL.ERROR', userName, channelName);
		});

const addLeader = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.addleaderurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('ADD_LEADER.SUCCESS', userName, channelName);
			}
			return i18n.__('ADD_LEADER.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('ADD_LEADER.ERROR_NOT_FOUND', channelName);
		});

const channelRename = (channelName, roomid, newName, headers) =>
	axios
		.post(
			apiEndpoints.channelrenameurl, {
				roomId: roomid,
				name: newName,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('RENAME_ROOM.SUCCESS', channelName, newName);
			}
			return i18n.__('RENAME_ROOM.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('RENAME_ROOM.ERROR_NOT_FOUND', channelName);
		});

const unarchiveChannel = (channelName, roomid, headers) =>
	axios
		.post(
			apiEndpoints.unarchivechannelurl, {
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('UNARCHIVE_CHANNEL.SUCCESS', channelName);
			}
			return i18n.__('UNARCHIVE_CHANNEL.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('UNARCHIVE_CHANNEL.ERROR_NOT_FOUND', channelName);
		});

const channelTopic = (channelName, roomid, topic, headers) =>
	axios
		.post(
			apiEndpoints.channeltopicurl, {
				roomId: roomid,
				topic,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('CHANNEL_TOPIC.SUCCESS', channelName, topic);
			}
			return i18n.__('CHANNEL_TOPIC.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('CHANNEL_TOPIC.ERROR_NOT_FOUND', channelName);
		});

const channelDescription = (channelName, roomid, description, headers) =>
	axios
		.post(
			apiEndpoints.channeldescriptionurl, {
				roomId: roomid,
				description,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('CHANNEL_DESCRIPTION.SUCCESS', channelName, description);
			}
			return i18n.__('CHANNEL_DESCRIPTION.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('CHANNEL_DESCRIPTION.ERROR_NOT_FOUND', channelName);
		});

const channelAnnouncement = (channelName, roomid, announcement, headers) =>
	axios
		.post(
			apiEndpoints.channelannouncementurl, {
				roomId: roomid,
				announcement,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('CHANNEL_ANNOUNCEMENT.SUCCESS', channelName, announcement);
			}
			return i18n.__('CHANNEL_ANNOUNCEMENT.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('CHANNEL_ANNOUNCEMENT.ERROR_NOT_FOUND', channelName);
		});

const removeLeader = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.removeleaderurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('REMOVE_LEADER.SUCCESS', userName, channelName);
			}
			return i18n.__('REMOVE_LEADER.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('REMOVE_LEADER.ERROR_NOT_FOUND', channelName);
		});

const removeModerator = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.removemoderatorurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('REMOVE_MODERATOR.SUCCESS', userName, channelName);
			}
			return i18n.__('REMOVE_MODERATOR.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('REMOVE_MODERATOR.ERROR_NOT_FOUND', channelName);
		});

const removeOwner = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.removeownerurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('REMOVE_OWNER.SUCCESS', userName, channelName);
			}
			return i18n.__('REMOVE_OWNER.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('REMOVE_OWNER.ERROR_NOT_FOUND', channelName);
		});

const createDMSession = (userName, headers) =>
	axios
		.post(
			apiEndpoints.createimurl, {
				username: userName,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => `${ res.room._id }`)
		.catch((err) => {
			console.log(err.message);
		});

const postDirectMessage = (message, roomid, headers) =>
	axios
		.post(
			apiEndpoints.postmessageurl, {
				roomId: roomid,
				text: message,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('POST_MESSAGE.SUCCESS');
			}
			return i18n.__('POST_MESSAGE.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('POST_MESSAGE.ERROR');
		});

const hinditranslate = (str) =>
	translate(str, {
		to: 'en',
	})
		.then((res) => `${ res.text }`)
		.catch((err) => {
			console.error(err);
		});

const createGroup = (channelName, headers) =>
	axios
		.post(
			apiEndpoints.creategroupurl, {
				name: channelName,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('CREATE_CHANNEL.SUCCESS', channelName);
			}
			return i18n.__('CREATE_CHANNEL.ERROR', channelName);
		})
		.catch((err) => {
			console.log(err.message);
			if (err.response.data.errorType === 'error-duplicate-channel-name') {
				return i18n.__('CREATE_CHANNEL.ERROR_DUPLICATE_NAME', channelName);
			} if (err.response.data.errorType === 'error-invalid-room-name') {
				return i18n.__('CREATE_CHANNEL.ERROR_INVALID_NAME', channelName);
			}
			return i18n.__('CREATE_CHANNEL.ERROR', channelName);
		});

const getGroupId = (channelName, headers) =>
	axios
		.get(`${ apiEndpoints.groupinfourl }${ channelName }`, {
			headers,
		})
		.then((res) => res.data)
		.then((res) => `${ res.group._id }`)
		.catch((err) => {
			console.log(err.message);
		});

const addAllToGroup = (channelName, roomid, headers) =>
	axios
		.post(
			apiEndpoints.addalltogroupurl, {
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('ADD_ALL_TO_CHANNEL.SUCCESS', channelName);
			}
			return i18n.__('ADD_ALL_TO_CHANNEL.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('ADD_ALL_TO_CHANNEL.ERROR_NOT_FOUND', channelName);
		});

const addGroupLeader = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.addgroupleaderurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('ADD_LEADER.SUCCESS', userName, channelName);
			}
			return i18n.__('ADD_LEADER.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('ADD_LEADER.ERROR_NOT_FOUND', channelName);
		});


const addGroupModerator = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.addgroupmoderatorurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('MAKE_MODERATOR.SUCCESS', userName, channelName);
			}
			return i18n.__('MAKE_MODERATOR.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('MAKE_MODERATOR.ERROR_NOT_FOUND', channelName);
		});

const addGroupOwner = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.addgroupownerurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('ADD_OWNER.SUCCESS', userName, channelName);
			}
			return i18n.__('ADD_OWNER.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('ADD_OWNER.ERROR_NOT_FOUND', channelName);
		});

const archiveGroup = (channelName, roomid, headers) =>
	axios
		.post(
			apiEndpoints.archivegroupurl, {
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('ARCHIVE_CHANNEL.SUCCESS', channelName);
			}
			return i18n.__('ARCHIVE_CHANNEL.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('ARCHIVE_CHANNEL.ERROR_NOT_FOUND', channelName);
		});

const deleteGroup = (channelName, headers) =>
	axios
		.post(
			apiEndpoints.deletegroupurl, {
				roomName: channelName,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('DELETE_CHANNEL.SUCCESS', channelName);
			}
			return i18n.__('DELETE_CHANNEL.ERROR', channelName);
		})
		.catch((err) => {
			console.log(err.message);
			if (err.response.data.errorType === 'error-room-not-found') {
				return i18n.__('DELETE_CHANNEL.ERROR_NOT_FOUND', channelName);
			}
			return i18n.__('DELETE_CHANNEL.ERROR', channelName);
		});

const inviteUserToGroup = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.inviteusertogroupurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('INVITE_USER_TO_CHANNEL.SUCCESS', userName, channelName);
			}
			return i18n.__('INVITE_USER_TO_CHANNEL.ERROR', userName, channelName);
		})
		.catch((err) => {
			console.log(err.message);
			console.log(err.message);
			console.log(err.message);
			if (err.response.data.errorType === 'error-room-not-found') {
				return i18n.__('INVITE_USER_TO_CHANNEL.ERROR_NOT_FOUND', channelName);
			}
			return i18n.__('INVITE_USER_TO_CHANNEL.ERROR', userName, channelName);
		});

const kickUserFromGroup = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.kickuserfromgroupurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('KICK_USER_FROM_CHANNEL.SUCCESS', userName, channelName);
			}
			return i18n.__('KICK_USER_FROM_CHANNEL.ERROR', userName, channelName);
		})
		.catch((err) => {
			console.log(err.message);
			console.log(err.message);
			console.log(err.message);
			if (err.response.data.errorType === 'error-room-not-found') {
				return i18n.__('KICK_USER_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);
			}
			return i18n.__('KICK_USER_FROM_CHANNEL.ERROR', userName, channelName);
		});

const leaveGroup = (channelName, roomid, headers) =>
	axios
		.post(
			apiEndpoints.leavegroupurl, {
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('LEAVE_CHANNEl.SUCCESS', channelName);
			}
			return i18n.__('LEAVE_CHANNEl.ERROR', channelName);
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('LEAVE_CHANNEl.ERROR', channelName);
		});

const removeGroupLeader = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.removegroupleaderurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('REMOVE_LEADER.SUCCESS', userName, channelName);
			}
			return i18n.__('REMOVE_LEADER.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('REMOVE_LEADER.ERROR_NOT_FOUND', channelName);
		});

const removeGroupModerator = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.removegroupmoderatorurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('REMOVE_MODERATOR.SUCCESS', userName, channelName);
			}
			return i18n.__('REMOVE_MODERATOR.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('REMOVE_MODERATOR.ERROR_NOT_FOUND', channelName);
		});

const removeGroupOwner = (userName, channelName, userid, roomid, headers) =>
	axios
		.post(
			apiEndpoints.removegroupownerurl, {
				userId: userid,
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('REMOVE_OWNER.SUCCESS', userName, channelName);
			}
			return i18n.__('REMOVE_OWNER.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('REMOVE_OWNER.ERROR_NOT_FOUND', channelName);
		});

const groupRename = (channelName, roomid, newName, headers) =>
	axios
		.post(
			apiEndpoints.renamegroupurl, {
				roomId: roomid,
				name: newName,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('RENAME_ROOM.SUCCESS', channelName, newName);
			}
			return i18n.__('RENAME_ROOM.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('RENAME_ROOM.ERROR_NOT_FOUND', channelName);
		});

const groupTopic = (channelName, roomid, topic, headers) =>
	axios
		.post(
			apiEndpoints.grouptopicurl, {
				roomId: roomid,
				topic,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('CHANNEL_TOPIC.SUCCESS', channelName, topic);
			}
			return i18n.__('CHANNEL_TOPIC.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('CHANNEL_TOPIC.ERROR_NOT_FOUND', channelName);
		});

const groupDescription = (channelName, roomid, description, headers) =>
	axios
		.post(
			apiEndpoints.groupdescriptionurl, {
				roomId: roomid,
				description,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('CHANNEL_DESCRIPTION.SUCCESS', channelName, description);
			}
			return i18n.__('CHANNEL_DESCRIPTION.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('CHANNEL_DESCRIPTION.ERROR_NOT_FOUND', channelName);
		});

const groupAnnouncement = (channelName, roomid, announcement, headers) =>
	axios
		.post(
			apiEndpoints.groupannouncementurl, {
				roomId: roomid,
				announcement,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('CHANNEL_ANNOUNCEMENT.SUCCESS', channelName, announcement);
			}
			return i18n.__('CHANNEL_ANNOUNCEMENT.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('CHANNEL_ANNOUNCEMENT.ERROR_NOT_FOUND', channelName);
		});

const unarchiveGroup = (channelName, roomid, headers) =>
	axios
		.post(
			apiEndpoints.unarchivegroupurl, {
				roomId: roomid,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('UNARCHIVE_CHANNEL.SUCCESS', channelName);
			}
			return i18n.__('UNARCHIVE_CHANNEL.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('UNARCHIVE_CHANNEL.ERROR_NOT_FOUND', channelName);
		});

const groupLastMessage = (channelName, roomid, headers) =>
	axios
		.get(`${ apiEndpoints.groupmessageurl }${ roomid }`, {
			headers,
		})
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.SUCCESS', name = res.messages[0].u.username, message = res.messages[0].msg);
			}
			return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR', channelName);
		})
		.catch((err) => {
			console.log(err.message);
			if (err.response.data.errorType === 'error-room-not-found') {
				return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);
			}
			return i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR', channelName);
		});

const getGroupUnreadCounter = (roomid, headers) =>
	axios
		.get(`${ apiEndpoints.groupcounterurl }${ roomid }`, {
			headers,
		})
		.then((res) => res.data)
		.then((res) => `${ res.unreads }`)
		.catch((err) => {
			console.log(err.message);
		});

const groupUnreadMessages = (channelName, roomid, unreadCount, headers) =>
	axios
		.get(`${ apiEndpoints.groupmessageurl }${ roomid }`, {
			headers,
		})
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				if (unreadCount === 0) {
					return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.NO_MESSAGE');
				}
				const msgs = [];

				for (let i = 0; i <= unreadCount - 1; i++) {
					msgs.push(`<s> ${ res.messages[i].u.username } says, ${ res.messages[i].msg } <break time=\"0.7\" /> </s>`);
				}

				const responseString = msgs.join('  ');

				const finalMsg = i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.MESSAGE', unreadCount, responseString);

				return finalMsg;
			}
			return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			console.log(err.message);
			if (err.response.data.errorType === 'error-room-not-found') {
				return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);
			}
			return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.ERROR');
		});

const postGroupMessage = (roomid, message, headers) =>
	axios
		.post(
			apiEndpoints.postmessageurl, {
				roomId: roomid,
				text: message,
			}, {
				headers,
			},
		)
		.then((res) => res.data)
		.then((res) => {
			if (res.success === true) {
				return i18n.__('POST_MESSAGE.SUCCESS');
			}
			return i18n.__('POST_MESSAGE.ERROR');
		})
		.catch((err) => {
			console.log(err.message);
			return i18n.__('POST_MESSAGE.ERROR');
		});

const getLastMessageType = (channelName, headers) =>
	axios
		.get(`${ apiEndpoints.channelmessageurl }${ channelName }`, {
			headers,
		})
		.then((res) => res.data)
		.then((res) => {
			if (!res.messages[0].file) {
				return 'textmessage';
			}
			return res.messages[0].file.type;
		})
		.catch((err) => {
			console.log(err.message);
			if (err.response.data.errorType === 'error-room-not-found') {
				return 'room-not-found';
			}
		});

const getLastMessageFileURL = (channelName, headers) =>
	axios
		.get(`${ apiEndpoints.channelmessageurl }${ channelName }`, {
			headers,
		})
		.then((res) => res.data)
		.then((res) => `https://bots.rocket.chat/file-upload/${ res.messages[0].file._id }/${ res.messages[0].file.name }`)
		.catch((err) => {
			console.log(err.message);
		});

const getLastMessageFileDowloadURL = (fileurl, headers) =>
	axios
		.get(fileurl, {
			headers,
		})
		.then((response) => `${ response.request.res.responseUrl }`)
		.catch((err) => {
			console.log(err.message);
		});

const getGroupLastMessageType = (roomid, headers) =>
	axios
		.get(`${ apiEndpoints.groupmessageurl }${ roomid }`, {
			headers,
		})
		.then((res) => res.data)
		.then((res) => {
			if (!res.messages[0].file) {
				return 'textmessage';
			}
			return res.messages[0].file.type;
		})
		.catch((err) => {
			console.log(err.message);
			if (err.response.data.errorType === 'error-room-not-found') {
				return 'room-not-found';
			}
		});

const getGroupLastMessageFileURL = (roomid, headers) =>
	axios
		.get(`${ apiEndpoints.groupmessageurl }${ roomid }`, {
			headers,
		})
		.then((res) => res.data)
		.then((res) => `https://bots.rocket.chat/file-upload/${ res.messages[0].file._id }/${ res.messages[0].file.name }`)
		.catch((err) => {
			console.log(err.message);
		});

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
