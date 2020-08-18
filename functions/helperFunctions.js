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

const userDetails = async (accessToken) => {
	try{
		const response = await axios
		.post(apiEndpoints.loginUrl, {
			serviceName: OAUTH_SERVICE_NAME,
			accessToken,
			expiresIn: 200,
		})
		.then((res) => res.data.data.me)
		return response;
	}catch(err) {
		console.log(err);
	}
}

// this helper function will return the user headers along with some details
const getCurrentUserDetails = async (accessToken) => {
	try{
		const response = await axios
		.post(apiEndpoints.loginUrl, {
			serviceName: OAUTH_SERVICE_NAME,
			accessToken,
			expiresIn: 200,
		})
		.then((res) => res.data.data)

		const headers = {
			'X-Auth-Token': response.authToken,
			'X-User-Id': response.userId,
		};

		const userDetails = {
			id: response.me._id,
			name: response.me.name,
			username: response.me.username,
			statusText: response.me.statusText,
			avatarUrl: response.me.avatarUrl,
		}

		return {headers, userDetails};
	}catch(err) {
		console.log(err);
		throw err;
	}
}

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

const deleteChannel = async (channelName, headers) =>
	await axios
	.post(
		apiEndpoints.deletechannelurl, {
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

const archiveChannel = async (channelName, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.archivechannelurl, {
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

const getUnreadCounter = async (channelName, type, headers) =>
	await axios
	.get(`${ type === 'c' ? apiEndpoints.counterurl : apiEndpoints.groupcounternameurl }${ channelName }`, {
		headers
	})
	.then((res) => res.data)
	.then((res) => `${ res.unreads }`)
	.catch((err) => {
		console.log(err.message);
	});

const getRoomCounterFromId = async (id, type, headers) =>
	await axios
	.get(`${ type === 'c' ? apiEndpoints.channelcountersidurl : apiEndpoints.groupcounterurl }${ id }`, {
		headers
	})
	.then((res) => res.data)
	.catch((err) => {
		console.log(err.message);
		throw err;
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

const getGroupMentionsCounter = async (roomid, headers) => {
	try{
		const response = await axios
		.get(`${ apiEndpoints.groupcounterurl }${ roomid }`, {
			headers
		})
		.then((res) => res.data)
		.then((res) => res.userMentions)

		console.log(response)
		return response;
	} catch(err) {
		console.log(err.message);
	}
}

const roomUnreadMessages = async (channelName, unreadCount, type, headers, fname = null) => {
	try{
		// fname is optional and is used as a display name for discussions
		if(fname) fname = `Discussion ${fname}`
		if (!unreadCount || unreadCount == 0) {
			return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.NO_MESSAGE', { channelName: fname || channelName });
		}

		const res = await axios
		.get(`${ type === 'c' ? apiEndpoints.channelmessageurl : apiEndpoints.groupmessagenameurl }${ channelName }&count=${ unreadCount }`, {
			headers
		})
		.then((res) => res.data)

		if (res.success === true) {

			const msgs = [];
			const messages = [];
			let previousUsername = '';
			for (let i = 0; i <= unreadCount - 1; i++) {
				if(!res.messages[i]) { continue; }
				let speechText;

				// if it's just a normal text message
				if(!res.messages[i].file && !res.messages[i].t && res.messages[i].msg){
					// check if the message is not empty or made of just dots.
					if(cleanMessage(res.messages[i].msg).replace(/\./g,' ').trim()) {
						if(previousUsername === res.messages[i].u.username) {
							msgs.push(`${res.messages[i].msg}. `)
						} else {
							msgs.push(`${res.messages[i].u.username} says, ${res.messages[i].msg}.`);
							previousUsername = res.messages[i].u.username;
						}
					}
					messages.push(`${res.messages[i].u.username}: ${res.messages[i].msg}`)
				} else if(res.messages[i].t) {
					if(res.messages[i].t === 'room_changed_description'){
						speechText = i18n.__('MESSAGE_TYPE.CHANGE_DESCRIPTION', {username: res.messages[i].u.username, description: res.messages[i].msg})
						msgs.push(speechText);
						messages.push(`${res.messages[i].u.username}: ${res.messages[i].msg}`)
					} else if(res.messages[i].t === 'room_changed_topic'){
						speechText = i18n.__('MESSAGE_TYPE.CHANGE_TOPIC', {username: res.messages[i].u.username, topic: res.messages[i].msg})
						msgs.push(speechText);
						messages.push(`${res.messages[i].u.username}: ${res.messages[i].msg}`)
					} else if(res.messages[i].t === 'room_changed_announcement'){
						speechText = i18n.__('MESSAGE_TYPE.CHANGE_ANNOUNCEMENT', {username: res.messages[i].u.username, announcement: res.messages[i].msg})
						msgs.push(speechText);
						messages.push(`${res.messages[i].u.username}: ${res.messages[i].msg}`)
					} else if(res.messages[i].t === 'discussion-created'){
						speechText = i18n.__('MESSAGE_TYPE.DISCUSSION_CREATED', {username: res.messages[i].u.username, name: res.messages[i].msg})
						msgs.push(speechText);
						messages.push(`${res.messages[i].u.username}: ${res.messages[i].msg}`)
					}
				} else if(res.messages[i].file) {
					if(res.messages[i].file.type.includes('image')){
						speechText = i18n.__('MESSAGE_TYPE.IMAGE_MESSAGE', {username: res.messages[i].u.username, title: res.messages[i].file.name}) 
					} else if (res.messages[i].file.type.includes('video')){
						speechText = i18n.__('MESSAGE_TYPE.VIDEO_MESSAGE', {username: res.messages[i].u.username, title: res.messages[i].file.name}) 
					}else {
						speechText = i18n.__('MESSAGE_TYPE.FILE_MESSAGE', {username: res.messages[i].u.username, title: res.messages[i].file.name}) 
					}
					msgs.push(speechText)
					messages.push(`${res.messages[i].u.username}: ${res.messages[i].file.name}`)
				}
			}

			var responseString = msgs.join('  ');
			responseString = cleanMessage(responseString);

			var finalMsg = i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.MESSAGE',{total: unreadCount, count: msgs.length, channelName: fname || channelName, responseString });

			// if there's nothing to display in the table just send the messsage.
			if(messages.length === 0) return finalMsg;
			return [ finalMsg, messages ];

		} else {
			return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.ERROR');
		}

	} catch(err) {
		console.log(err);
		throw err
	}
}

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


const leaveChannel = async (channelName, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.leavechannelurl, {
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

const channelRename = async (channelName, roomid, newName, headers) =>
	await axios
	.post(
		apiEndpoints.channelrenameurl, {
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

const unarchiveChannel = async (channelName, roomid, headers) =>
	await axios
	.post(
		apiEndpoints.unarchivechannelurl, {
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

const channelTopic = async (channelName, roomid, topic, headers) =>
	await axios
	.post(
		apiEndpoints.channeltopicurl, {
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

const channelDescription = async (channelName, roomid, description, headers) =>
	await axios
	.post(
		apiEndpoints.channeldescriptionurl, {
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
	.get(`${ apiEndpoints.groupmessageurl }${ roomid }&count=${ unreadCount }`, {
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
					if (res.messages[i] && !res.messages[i].t){
						msgs.push(`<s> ${res.messages[i].u.username} says, ${res.messages[i].msg}. <break time=\"0.7\" /> </s>`);
					}
				}

				var responseString = msgs.join('  ');

				var finalMsg = i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.MESSAGE', msgs.length, responseString);

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

const DMUnreadMessages = async (name, count, headers) => {
	try{
		if (count == null) {
			return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.ERROR');
		}
		if (count == 0) {
			return i18n.__('GET_UNREAD_MESSAGES_FROM_DM.NO_MESSAGE', { name });
		}

		const res = await axios
		.get(`${ apiEndpoints.immessageurl }?username=${ name }&count=${ count }`, {
			headers
		})
		.then((res) => res.data)

		if (res.success === true) {

			const msgs = [];

			for (let i = 0; i <= count - 1; i++) {
				if (res.messages[i] && !res.messages[i].t){
					if(res.messages[i].file){
						msgs.push(`Sent you a file named ${res.messages[i].file.name}.`)
					} else {
						if(res.messages[i].msg) msgs.push(`${res.messages[i].msg}.`);
					}
				}
			}

			var responseString = msgs.join('  ');
			responseString = cleanMessage(responseString);

			var finalMsg = i18n.__('GET_UNREAD_MESSAGES_FROM_DM.MESSAGE', {unread: msgs.length, name, responseString});

			return [ finalMsg, msgs ];

		} else {
			return i18n.__('GET_UNREAD_MESSAGES_FROM_CHANNEL.ERROR');
		}
	} catch(err) {
		throw err.message;
	}
}

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
		// sort wrt prid, so the discussions will end up at the end.
		const publicChannelsResponse = await axios.get(`${apiEndpoints.channellisturl}?sort={"prid": 1, "_updatedAt": -1}&fields={"_id": 1, "name": 1, "t": 1}&count=100`, {
			headers,
		}).then((res) => res.data);

		const privateChannelsResponse = await axios.get(`${apiEndpoints.grouplisturl}?sort={"prid": 1, "_updatedAt": -1}&fields={"_id": 1, "name": 1, "t": 1}&count=100`, {
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

		let channelNames = channels.map(channel => channel.name.replace(/\./g, ' '))
		let comparison = stringSimilar.findBestMatch(removeWhitespace(channelName).toLowerCase(), channelNames)
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

		// remove the dots with spaces, better string resolution
		let usernames = subscriptions.map(user => user.name.replace(/\./g, ' '))
		let comparison = stringSimilar.findBestMatch(removeWhitespace(username).toLowerCase(), usernames)
		if(comparison.bestMatch.rating > 0.3) {
			return subscriptions[comparison.bestMatchIndex]
		} else {
			return null
		}

	} catch (err) {
		console.log(err);
	}
};

const resolveDM = async (username, currentUserDetails, headers) => {
	try{
		//selects the latest 40 dm rooms in the user's contacts list
		const response = await axios.get(`${apiEndpoints.imlisturl}?sort={"_updatedAt": -1}&fields={"_id": 1, "t": 1, "usernames": 1, "uids": 1}&count=100`, {
			headers,
		})
		.then(res => res.data.ims)

		let usernames = [];
		let roomDetailsCollection = [];

		for (let room of response) {
			//only consider DM's with two users
			if(room.usernames.length !== 2) continue;

			// the usernames field contains two user names, [current user, other user] no fixed order. So, get index of the other user.
			let indexOfUsername = 1 - room.usernames.indexOf(currentUserDetails.username)
			// remove dots from the username for better comparisons
			usernames.push(room.usernames[indexOfUsername].replace(/\./g, ' '))

			let indexOfRoomId = 1 - room.uids.indexOf(currentUserDetails.id)

			roomDetailsCollection.push({
				name: room.usernames[indexOfUsername], //username of the other participant of dm
				rid: room._id, //roomid of the dm room
				id: room.uids[indexOfRoomId], //id of the other participant of dm
				type: room.t //type of room 'd'
			})
		}

		let comparison = stringSimilar.findBestMatch(removeWhitespace(username).toLowerCase(), usernames);
		if(comparison.bestMatch.rating > 0.3) {
			return roomDetailsCollection[comparison.bestMatchIndex]
		} else {
			return null
		}

	}catch(err) {
		console.log(err);
		throw err;
	}
}

const resolveRoomORUser = async (name, headers) => {
	try{
		const no_of_days = 7;
		const updatedSince = new Date(new Date().getTime() - (24 * 60 * 60 * 1000 * no_of_days));
		const subscriptions = await axios.get(`${apiEndpoints.getsubscriptionsurl}?updatedSince=${updatedSince}`, {
			headers,
		})
		.then((res) => res.data.update)
		.then((subscriptions) => subscriptions.map((subscription) => {
			if(subscription.t === 'd') {
				return {
					name: subscription.name, // name of the other participant in dm room
					rid: subscription.rid, // id of the dm room
					id: subscription.rid.replace(subscription.u._id, ''), // id of the other participant in dm room
					type: subscription.t,
				}
			} else if(subscription.t === 'c' || subscription.t === 'p') {
				return {
					name: subscription.name,
					id: subscription.rid,
					type: subscription.t,
				}
			}
		}))


		let names = subscriptions.map(subscription => subscription.name.replace(/\./g, ' '))
		let comparison = stringSimilar.findBestMatch(removeWhitespace(name).toLowerCase(), names)
		if(comparison.bestMatch.rating > 0.3) {
			return subscriptions[comparison.bestMatchIndex]
		} else {
			return null
		}
		
	}catch(err) {
		console.log(err)
	}
}

const resolveDiscussion = async (discussionName, headers) => {
	try{
		// prid sort so that the normal rooms will be considered last
		let groupDiscussions = await axios.get(`${apiEndpoints.grouplisturl}?sort={"prid": -1, "_updatedAt": -1}&fields={"_id": 1, "name": 1, "fname": 1, "prid": 1, "t": 1}&count=40`, {
			headers
		}).then(res => res.data.groups);

		let channelDiscussions = await axios.get(`${apiEndpoints.channellisturl}?sort={"prid": -1, "_updatedAt": -1}&fields={"_id": 1, "name": 1, "fname": 1, "prid": 1, "t": 1}&count=40`, {
			headers
		}).then(res => res.data.channels);

		let discussionDetails = [];
		let discussionNames = [];

		for (let discussion of groupDiscussions.concat(channelDiscussions)) {
			// if prid doesn't exist it's not a discussion
			if(!discussion.prid) continue;

			discussionDetails.push({
				id: discussion._id, // id of the discussion room
				name: discussion.name, // the unique name of the discussion
				fname: discussion.fname, // the display name of the discussion
				type: discussion.t // type: private (p), public(c)
			})

			discussionNames.push(discussion.fname.toLowerCase())
		}

		if(discussionNames.length === 0) return null;

		let comparison = stringSimilar.findBestMatch(removeWhitespace(discussionName).toLowerCase(), discussionNames);
		if(comparison.bestMatch.rating > 0) {
			return discussionDetails[comparison.bestMatchIndex]
		} else {
			return null
		}

	} catch(err) {
		console.log(err)
		throw err;
	}
}

const getLatestDiscussions = async (headers) => {
	try{
		let groupDiscussions = await axios.get(`${apiEndpoints.grouplisturl}?sort={"prid": -1, "_updatedAt": -1}&fields={"_id": 1, "name": 1, "fname": 1, "prid": 1, "t": 1}&count=10`, {
			headers
		}).then(res => res.data.groups);

		let channelDiscussions = await axios.get(`${apiEndpoints.channellisturl}?sort={"prid": -1, "_updatedAt": -1}&fields={"_id": 1, "name": 1, "fname": 1, "prid": 1, "t": 1}&count=20`, {
			headers
		}).then(res => res.data.channels);

		let discussionDetails = [];

		for (let discussion of groupDiscussions.concat(channelDiscussions)) {
			// if prid doesn't exist it's not a discussion
			if(!discussion.prid) continue;

			console.log(discussion);

			discussionDetails.push({
				id: discussion._id, // id of the discussion room
				name: discussion.name, // the unique name of the discussion
				fname: discussion.fname, // the display name of the discussion
				type: discussion.t // type: private (p), public(c)
			})

		}

		if(discussionDetails.length === 0) return null;
		return discussionDetails;
	}catch(err){
		throw err;
	}
}

const getDMCounter = async (id, headers) => {
	try {
		const response = await axios.get(`${apiEndpoints.imcountersurl}?roomId=${id}`, { 
			headers 
		})
		.then((res) => res.data);
		return response;
	}catch(err){
		throw "Error while getting counters";
	}
}

const getAllUnreads = async (headers) => {
	try {

		const subscriptions = await axios.get(apiEndpoints.getsubscriptionsurl, {
			headers,
		})
			.then((res) => res.data.update);
		let finalMessage = '';
		let unreadDetails = [];

		for (const subscription of subscriptions) {
			if (subscription.unread && subscription.unread !== 0) {
				if(subscription.prid) {
					finalMessage += `${ subscription.unread } unreads from discussion ${ subscription.fname }, `;
					unreadDetails.push({name: `[D] ${subscription.fname.slice(0, 20)}`, unreads: subscription.unread})
					continue;
				}
				if (subscription.t && subscription.t === 'd') {
					finalMessage += `${ subscription.unread } unreads from ${ subscription.name }, `;
				} else {
					finalMessage += `${ subscription.unread } unreads in ${ subscription.name }, `;
				}
				unreadDetails.push({name: `[${subscription.t === 'd' ? 'DM' : subscription.t.toUpperCase()}] ${subscription.name.slice(0, 20)}`, unreads: subscription.unread})
			}
		}

		if (finalMessage === '') { return [i18n.__('GET_ALL_UNREADS.NO_UNREADS'), []]; }
		return [i18n.__('GET_ALL_UNREADS.MESSAGE', { message: finalMessage }), unreadDetails];
	} catch (err) {
		console.log(err.message);
		return [i18n.__('GET_ALL_UNREADS.ERROR'), []];
	}
};

const getAllUnreadMentions = async (headers) => {
	try {

		const subscriptions = await axios.get(apiEndpoints.getsubscriptionsurl, {
			headers,
		})
			.then((res) => res.data.update);
		let finalMessage = '';
		let unreadDetails = [];

		for (const subscription of subscriptions) {
			if (subscription.userMentions && subscription.userMentions !== 0) {
				if(subscription.prid) {
					finalMessage += `${ subscription.userMentions } unreads from discussion ${ subscription.fname }, `;
					unreadDetails.push({name: `[D] ${subscription.fname.slice(0, 20)}`, mentions: subscription.userMentions})
					continue;
				}
				if (subscription.t && subscription.t === 'd') {
					finalMessage += `${ subscription.userMentions } mentions from ${ subscription.name },`;
				} else {
					finalMessage += `${ subscription.userMentions } mentions in ${ subscription.name },`;
				}
				unreadDetails.push({name: `[${subscription.t === 'd' ? 'DM' : subscription.t.toUpperCase()}] ${subscription.name.slice(0, 20)}`, mentions: subscription.userMentions})
			}
		}

		if (finalMessage === '') { return [i18n.__('GET_ALL_UNREAD_MENTIONS.NO_MENTIONS'), []] }
		return [i18n.__('GET_ALL_UNREAD_MENTIONS.MESSAGE', { message: finalMessage }), unreadDetails];
	} catch (err) {
		console.log(err.message);
		return [i18n.__('GET_ALL_UNREAD_MENTIONS.ERROR'), []];
	}
};

const readUnreadMentions = async (channelDetails, count, headers, fname = undefined) => {
	try {
		if(fname) fname = `Discussion ${fname}`;
		if(count === null){
			return i18n.__('MENTIONS.ERROR');
		}
		if (count == 0) { 
			return i18n.__('MENTIONS.NO_MENTIONS', { roomName: fname || channelDetails.name }); 
		}

		const response = await axios.get(`${ apiEndpoints.getmentionedmessagesurl }?roomId=${ channelDetails.id }&count=${ count }`, {
			headers,
		}).then((res) => res.data);

		if (response.success === true) {
			let finalMessage = '';
			let messages = []

			response.messages.forEach((message) => {
				finalMessage += `${ message.u.username } says, ${ message.msg }.`;
				messages.push(`${ message.u.username }: ${ message.msg }.`)
			});

			finalMessage = cleanMessage(finalMessage);

			let speechText = i18n.__('MENTIONS.READ_MENTIONS', {
				finalMessage, count, roomName: fname || channelDetails.name,
			})
			
			// if there's nothing to display in the table just return speech text
			if(messages.length === 0) return speechText;
			
			return [ speechText, messages ];
		} else {
			return i18n.__('MENTIONS.ERROR');
		}

	} catch (err) {
		return i18n.__('MENTIONS.ERROR');
	}
};

const getAccountSummary = async (headers) => {
	try {
		const subscriptions = await axios.get(apiEndpoints.getsubscriptionsurl, {
			headers,
		})
		.then((res) => res.data.update);

		let summary = [];

		for (const subscription of subscriptions) {
			if ((subscription.unread && subscription.unread !== 0) || (subscription.userMentions && subscription.userMentions !== 0)) {
				if(subscription.prid){
					// if it is a discussion, show the displaly name instead
					summary.push([`[D] ${subscription.fname.slice(0, 20)}`, subscription.unread.toString() , subscription.userMentions.toString()])
				} else {
					summary.push([`[${subscription.t === 'd' ? 'DM' : subscription.t.toUpperCase()}] ${subscription.name.slice(0, 20)}`, subscription.unread.toString() , subscription.userMentions.toString()])
				}
			}
		}

		return summary;
	} catch (err) {
		console.log(err.message);
		throw err;
	}
}

const cleanMessage = (string) => {

	// :([a-z_]+): => regex for emoji :emoji:
	// (&[#0-9A-Za-z]*;) => regex for special character encodings &#ab3;
	// ((https?|ftp):\/\/[\.[a-zA-Z0-9\/\-]+) => regex for url

	let combined_regex = new RegExp(':([a-z_]+):|(&[#0-9A-Za-z]*;)|((https?|ftp):\/\/[.[a-zA-Z0-9\/-]+)|[^ .,A-Za-z0-9\\n]', 'g');
	return string.replace(combined_regex, '');
}

const DMUnreadMentions = async (DMDetails, count, headers) => {
	try{
		if(count == null) {
			throw 'Null unreads';
		}
		if (count == 0) {
			return i18n.__('MENTIONS.NO_DM_MENTIONS', { name: DMDetails.name });
		}
		
		const response = await axios.get(`${ apiEndpoints.getmentionedmessagesurl }?roomId=${ DMDetails.rid }&count=${ count }`, {
			headers,
		}).then((res) => res.data);

		if (response.success === true) {
			let finalMessage = '';
			let messages = [];

			response.messages.forEach((message) => {
				finalMessage += `${ message.msg }.`;
				messages.push(`${ message.u.username }: ${ message.msg }.`)
			});

			finalMessage = cleanMessage(finalMessage);
			const speechText = i18n.__('MENTIONS.READ_DM_MENTIONS', {
				finalMessage, count, name: DMDetails.name,
			});
			
			//if there are no important messages just return the speech text.
			if(messages.length === 0) return speechText
			return [ speechText, messages ];
		} else {
			return i18n.__('MENTIONS.ERROR');
		}
	} catch(err){
		throw err;
	}
}

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
module.exports.getGroupMentionsCounter = getGroupMentionsCounter;
module.exports.roomUnreadMessages = roomUnreadMessages;
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
module.exports.getAllUnreads = getAllUnreads;
module.exports.getAllUnreadMentions = getAllUnreadMentions;
module.exports.readUnreadMentions = readUnreadMentions;
module.exports.userDetails = userDetails;
module.exports.getAccountSummary = getAccountSummary;
module.exports.resolveRoomORUser = resolveRoomORUser;
module.exports.DMUnreadMessages = DMUnreadMessages;
module.exports.getDMCounter = getDMCounter;
module.exports.DMUnreadMentions = DMUnreadMentions;
module.exports.resolveDM = resolveDM;
module.exports.getCurrentUserDetails = getCurrentUserDetails;
module.exports.resolveDiscussion = resolveDiscussion;
module.exports.getRoomCounterFromId = getRoomCounterFromId;
module.exports.getLatestDiscussions = getLatestDiscussions;
