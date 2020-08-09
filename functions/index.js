'use strict';

const {
  dialogflow,
  SignIn,
  BasicCard,
  Button,
  Image,
  MediaObject,
  Table,
  Suggestions
} = require('actions-on-google');
const functions = require('firebase-functions');

const helperFunctions = require('./helperFunctions');
const envVariables = require('./config');
const {
  CLIENT_ID,
  SERVER_URL,
} = envVariables;

const app = dialogflow({
  debug: true,
  clientId: CLIENT_ID
});

const i18n = require('i18n');
const moment = require('moment');

i18n.configure({
  locales: ['en-US', 'pt-BR', 'hi-IN'],
  directory: __dirname + '/locales',
  defaultLocale: 'en-US',
  objectNotation: true
});

app.middleware((conv) => {
  i18n.setLocale(conv.user.locale);
  moment.locale(conv.user.locale);
});


app.intent('Default Welcome Intent', async (conv) => {
  try{
    const accessToken = conv.user.access.token;
    const headers = await helperFunctions.login(accessToken);
    if(!headers) {
      throw "Authentication Failed"
    }
    const userDetails = await helperFunctions.userDetails(accessToken);
    const summary = await helperFunctions.getAccountSummary(headers);
  
    conv.ask(i18n.__('WELCOME.SUCCESS'));
    conv.add(new Suggestions("What can you do?"))
  
    if(summary && summary.length === 0){
      //if the user has no summary to display show a simple card with profile details
      conv.ask(new BasicCard({
        text: `Your Account Details`,
        subtitle: userDetails.statusText,
        title: userDetails.username,
        image: new Image({
          url: `${userDetails.avatarUrl}`,
          alt: userDetails.username,
        }),
        display: 'CROPPED',
      }));
    }else if(summary) {
      //if the user has a summary to display, show a table instead
      let rows = []
      for (let detail of summary) {
        rows.push({ cells: detail})
      }
    
      conv.ask(new Table({
        title: userDetails.username,
        subtitle: 'Your Account Summary',
        image: new Image({
          url: userDetails.avatarUrl,
          alt: 'adarsh.naidu'
        }),
        columns: [
          {
            header: 'Subscriptions',
            align: 'CENTER',
          },
          {
            header: 'Unreads',
            align: 'CENTER',
          },
          {
            header: 'Mentions',
            align: 'CENTER',
          },
        ],
        rows: rows,
      }))
    }
  }catch(err) {
    console.log(err)
    conv.close(i18n.__('WELCOME.AUTH_ERROR'));
  }
});

app.intent('Create Channel Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const speechText = await helperFunctions.createChannel(channelName, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const speechText = await helperFunctions.createChannel(channelName, headers);

    conv.ask(speechText);

  }

});

app.intent('Delete Channel Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const speechText = await helperFunctions.deleteChannel(channelName, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const speechText = await helperFunctions.deleteChannel(channelName, headers);

    conv.ask(speechText);

  }

});

app.intent('Post Channel Message Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var message = params.message;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const speechText = await helperFunctions.postMessage(channelName, message, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var message = params.message;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const speechText = await helperFunctions.postMessage(channelName, message, headers);

    conv.ask(speechText);

  }

});

app.intent('Channel Last Message Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const messageType = await helperFunctions.getLastMessageType(channelName, headers);

    if (messageType === 'textmessage') {

      const speechText = await helperFunctions.channelLastMessage(channelName, headers);

      conv.ask(speechText);

    } else if (messageType.includes("image")) {

      const fileurl = await helperFunctions.getLastMessageFileURL(channelName, headers);
      const download = await helperFunctions.getLastMessageFileDowloadURL(fileurl, headers);

      const lastmessageData = await helperFunctions.channelLastMessage(channelName, headers);
      const userName = lastmessageData.replace('says, .', '');
      const speechText = i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.IMAGE_MESSAGE', userName);

      if (!conv.screen) {
        
        conv.ask(speechText);
        return;
      }

      conv.ask(speechText);

      conv.ask(new BasicCard({
        text: `An Image Message`,
        buttons: new Button({
          title: 'Read Message',
          url: `${SERVER_URL}/channel/${channelName}`,
        }),
        image: new Image({
          url: download,
          alt: 'Rocket Chat Image Message',
        }),
        display: 'CROPPED',
      }));

    } else if (messageType.includes("room-not-found")){
      
      const speechText = i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);

      conv.ask(speechText);

    } else {

      const speechText = i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.UNSUPPORTED_MEDIA_TYPE', channelName);

      conv.ask(speechText);

    }

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const messageType = await helperFunctions.getLastMessageType(channelName, headers);

    if (messageType === 'textmessage') {

      const speechText = await helperFunctions.channelLastMessage(channelName, headers);

      conv.ask(speechText);

    } else if (messageType.includes("image")) {

      const fileurl = await helperFunctions.getLastMessageFileURL(channelName, headers);
      const download = await helperFunctions.getLastMessageFileDowloadURL(fileurl, headers);

      const lastmessageData = await helperFunctions.channelLastMessage(channelName, headers);
      const userName = lastmessageData.replace('says, .', '');
      const speechText = i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.IMAGE_MESSAGE', userName);

      if (!conv.screen) {
        
        conv.ask(speechText);
        return;
      }

      conv.ask(speechText);

      conv.ask(new BasicCard({
        text: `An Image Message`,
        buttons: new Button({
          title: 'Read Message',
          url: `${SERVER_URL}/channel/${channelName}`,
        }),
        image: new Image({
          url: download,
          alt: 'Rocket Chat Image Message',
        }),
        display: 'CROPPED',
      }));

    } else if (messageType.includes("room-not-found")){
      
      const speechText = i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);

      conv.ask(speechText);

    } else {

      const speechText = i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.UNSUPPORTED_MEDIA_TYPE', channelName);

      conv.ask(speechText);

    }


  }

});

app.intent('Add Channel Moderator Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.makeModerator(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.makeModerator(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Add Channel Owner Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.addOwner(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.addOwner(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Add All To Channel Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.addAll(channelName, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.addAll(channelName, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Archive Channel Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.archiveChannel(channelName, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.archiveChannel(channelName, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Get All Unread Mentions Intent', async (conv) => {
  const accessToken = conv.user.access.token;
  const headers = await helperFunctions.login(accessToken);
  const speechText = await helperFunctions.getAllUnreadMentions(headers);
  conv.ask(speechText[0]);
  conv.ask(i18n.__('GENERIC_REPROMPT'));
  if(speechText[1].length != 0) {
    const unreadsDetails = speechText[1]
    let count = unreadsDetails.reduce((prev, curr) => prev + curr.mentions, 0)

    let rows = []
    for(let detail of unreadsDetails) {
      let cell = {
        "cells": [{
          "text": detail.name
        }, {
          "text": `${detail.mentions}`
        }]
      }
      rows.push(cell);
    }

    conv.add(new Table({
      "title": `${count}`,
      "subtitle": "Unreads",
      "columns": [{
        "header": "Room/User"
      }, {
        "header": "Mentions"
      }],
      "rows": rows
    }));
  }
})

app.intent('Read Unread Mentions From Channel Intent', async (conv, params) => {
  const accessToken = conv.user.access.token;
  const headers = await helperFunctions.login(accessToken);
  let channelname = params.channelname;

  var locale = conv.user.locale;
  if(locale === 'hi-IN') {
    channelname = await helperFunctions.hinditranslate(channelname);
  }

  const channelDetails = await helperFunctions.resolveChannelname(channelname, headers);
  if(!channelDetails) {
    conv.ask(i18n.__('NO_ROOM', channelname))
    conv.ask(i18n.__('GENERIC_REPROMPT'))
    return
  }

  let unreadMentionsCount;
  if(channelDetails.type === 'c') {
    unreadMentionsCount = await helperFunctions.getMentionsCounter(channelDetails.name, headers);
  } else if(channelDetails.type === 'p') {
    unreadMentionsCount = await helperFunctions.getGroupMentionsCounter(channelDetails.id, headers);
  }

  const speechText = await helperFunctions.readUnreadMentions(channelDetails, unreadMentionsCount, headers);
  conv.ask(speechText)
  conv.ask(i18n.__('GENERIC_REPROMPT'))
})

app.intent('Get All Unread Messages Intent', async (conv) => {
  const accessToken = conv.user.access.token;
  const headers = await helperFunctions.login(accessToken);
  const speechText = await helperFunctions.getAllUnreads(headers);
  conv.ask(speechText[0]);
  conv.ask(i18n.__('GENERIC_REPROMPT'))
  if(speechText[1].length != 0) {
    const unreadsDetails = speechText[1]
    let count = unreadsDetails.reduce((prev, curr) => prev + curr.unreads, 0)

    let rows = []
    for(let detail of unreadsDetails) {
      let cell = {
        "cells": [{
          "text": detail.name
        }, {
          "text": `${detail.unreads}`
        }]
      }
      rows.push(cell);
    }

    conv.add(new Table({
      "title": `${count}`,
      "subtitle": "Unreads",
      "columns": [{
        "header": "Room/User"
      }, {
        "header": "Unreads"
      }],
      "rows": rows
    }));
  }
})

app.intent('Read Unread Messages From Channel Intent', async (conv, params) => {

  const accessToken = conv.user.access.token;
  const headers = await helperFunctions.login(accessToken);
  let channelname = params.channelname;

  var locale = conv.user.locale;
  if(locale === 'hi-IN') {
    channelname = await helperFunctions.hinditranslate(channelname);
  }

  const channelDetails = await helperFunctions.resolveChannelname(channelname, headers);
  if(!channelDetails) {
    conv.ask(i18n.__('NO_ROOM', channelname))
    conv.ask(i18n.__('GENERIC_REPROMPT'))
    return
  }

  let speechText;
  if(channelDetails.type === 'p') {
    const unreadCount = await helperFunctions.getGroupUnreadCounter(channelDetails.id, headers);
    speechText = await helperFunctions.groupUnreadMessages(channelDetails.name, channelDetails.id, unreadCount, headers);
  } else {
    const unreadCount = await helperFunctions.getUnreadCounter(channelDetails.name, headers);
    speechText = await helperFunctions.channelUnreadMessages(channelDetails.name, unreadCount, headers);
  }
  conv.ask(speechText);
  conv.ask(i18n.__('GENERIC_REPROMPT'))
});

app.intent('Channel User Mentions Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const mentionsCount = await helperFunctions.getMentionsCounter(channelName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.channelUnreadMentions(channelName, roomid, mentionsCount, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const mentionsCount = await helperFunctions.getMentionsCounter(channelName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.channelUnreadMentions(channelName, roomid, mentionsCount, headers);

    conv.ask(speechText);

  }

});

app.intent('Post Channel Emoji Message Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    var messageData = params.message;
    const emojiRaw = params.emoji;
    var emojiData = await helperFunctions.hinditranslate(emojiRaw);
    const emoji = helperFunctions.emojiTranslateFunc(emojiData);
    const message = messageData + emoji;

    const headers = await helperFunctions.login(accessToken);
    const speechText = await helperFunctions.postMessage(channelName, message, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    var messageData = params.message;
    const emojiData = params.emoji;
    const emoji = helperFunctions.emojiTranslateFunc(emojiData);
    const message = messageData + emoji;

    const headers = await helperFunctions.login(accessToken);
    const speechText = await helperFunctions.postMessage(channelName, message, headers);

    conv.ask(speechText);

  }

});

app.intent('Invite User Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.inviteUser(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.inviteUser(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Leave Channel Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.leaveChannel(channelName, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.leaveChannel(channelName, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Kick User Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.kickUser(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.kickUser(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Add Channel Leader Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.addLeader(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.addLeader(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Rename Channel Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    var newNameRaw = params.newname;
    var newNameData = await helperFunctions.hinditranslate(newNameRaw);
    var newNameLwr = newNameData.toLowerCase();
    var newName = helperFunctions.replaceWhitespacesFunc(newNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.channelRename(channelName, roomid, newName, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    var newNameRaw = params.newname;
    var newNameData = newNameRaw.toLowerCase();
    var newName = helperFunctions.replaceWhitespacesFunc(newNameData);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.channelRename(channelName, roomid, newName, headers);

    conv.ask(speechText);

  }

});

app.intent('Unarchive Channel Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.unarchiveChannel(channelName, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.unarchiveChannel(channelName, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Channel Topic Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    var topic = params.topic;

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.channelTopic(channelName, roomid, topic, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    var topic = params.topic;

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.channelTopic(channelName, roomid, topic, headers);

    conv.ask(speechText);

  }

});

app.intent('Channel Description Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    var description = params.description;

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.channelDescription(channelName, roomid, description, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    var description = params.description;

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.channelDescription(channelName, roomid, description, headers);

    conv.ask(speechText);

  }

});

app.intent('Channel Announcement Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    var announcement = params.announcement;

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.channelAnnouncement(channelName, roomid, announcement, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    var announcement = params.announcement;

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.channelAnnouncement(channelName, roomid, announcement, headers);

    conv.ask(speechText);

  }

});

app.intent('Remove Channel Leader Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.removeLeader(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.removeLeader(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Remove Channel Moderator Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.removeModerator(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.removeModerator(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Remove Channel Owner Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.removeOwner(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getRoomId(channelName, headers);
    const speechText = await helperFunctions.removeOwner(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Post DM Message Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var message = params.message;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.createDMSession(userName, headers);
    const speechText = await helperFunctions.postDirectMessage(message, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var message = params.message;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.createDMSession(userName, headers);
    const speechText = await helperFunctions.postDirectMessage(message, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Post DM Emoji Message Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var messageData = params.message;
    const emojiRaw = params.emoji;
    var emojiData = await helperFunctions.hinditranslate(emojiRaw);
    const emoji = helperFunctions.emojiTranslateFunc(emojiData);
    var message = messageData + emoji;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.createDMSession(userName, headers);
    const speechText = await helperFunctions.postDirectMessage(message, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var messageData = params.message;
    const emojiData = params.emoji;
    const emoji = helperFunctions.emojiTranslateFunc(emojiData);
    var message = messageData + emoji;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);


    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.createDMSession(userName, headers);
    const speechText = await helperFunctions.postDirectMessage(message, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Create Group Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const speechText = await helperFunctions.createGroup(channelName, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const speechText = await helperFunctions.createGroup(channelName, headers);

    conv.ask(speechText);

  }

});

app.intent('Add All To Group Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.addAllToGroup(channelName, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.addAllToGroup(channelName, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Add Group Leader Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.addGroupLeader(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.addGroupLeader(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Add Group Moderator Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.addGroupModerator(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.addGroupModerator(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Add Group Owner Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.addGroupOwner(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.addGroupOwner(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Archive Group Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.archiveGroup(channelName, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.archiveGroup(channelName, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Delete Group Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const speechText = await helperFunctions.deleteGroup(channelName, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const speechText = await helperFunctions.deleteGroup(channelName, headers);

    conv.ask(speechText);

  }

});

app.intent('Invite User To Group Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.inviteUserToGroup(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.inviteUserToGroup(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Kick User From Group Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.kickUserFromGroup(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.kickUserFromGroup(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Leave Group Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.leaveGroup(channelName, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.leaveGroup(channelName, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Remove Group Leader Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.removeGroupLeader(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.removeGroupLeader(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Remove Group Moderator Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.removeGroupModerator(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.removeGroupModerator(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Remove Group Owner Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = await helperFunctions.hinditranslate(userNameRaw);
    var userNameLwr = userNameData.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameLwr);

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.removeGroupOwner(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var userNameRaw = params.username;
    var userNameData = userNameRaw.toLowerCase();
    var userName = helperFunctions.replaceWhitespacesDots(userNameData);

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const userid = await helperFunctions.getUserId(userName, headers);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.removeGroupOwner(userName, channelName, userid, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Rename Group Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    var newNameRaw = params.newname;
    var newNameData = await helperFunctions.hinditranslate(newNameRaw);
    var newNameLwr = newNameData.toLowerCase();
    var newName = helperFunctions.replaceWhitespacesFunc(newNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.groupRename(channelName, roomid, newName, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    var newNameRaw = params.newname;
    var newNameData = newNameRaw.toLowerCase();
    var newName = helperFunctions.replaceWhitespacesFunc(newNameData);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.groupRename(channelName, roomid, newName, headers);

    conv.ask(speechText);

  }

});

app.intent('Group Topic Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    var topic = params.topic;

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.groupTopic(channelName, roomid, topic, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    var topic = params.topic;

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.groupTopic(channelName, roomid, topic, headers);

    conv.ask(speechText);

  }

});

app.intent('Group Description Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    var description = params.description;

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.groupDescription(channelName, roomid, description, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    var description = params.description;

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.groupDescription(channelName, roomid, description, headers);

    conv.ask(speechText);

  }

});

app.intent('Group Announcement Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    var announcement = params.announcement;

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.groupAnnouncement(channelName, roomid, announcement, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    var announcement = params.announcement;

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.groupAnnouncement(channelName, roomid, announcement, headers);

    conv.ask(speechText);

  }

});

app.intent('Unarchive Group Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.unarchiveGroup(channelName, roomid, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.unarchiveGroup(channelName, roomid, headers);

    conv.ask(speechText);

  }

});

app.intent('Group Last Message Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const messageType = await helperFunctions.getGroupLastMessageType(roomid, headers);

    if (messageType === 'textmessage') {

      const speechText = await helperFunctions.groupLastMessage(channelName, roomid, headers);

      conv.ask(speechText);

    } else if (messageType.includes("image")) {

      const fileurl = await helperFunctions.getGroupLastMessageFileURL(roomid, headers);
      const download = await helperFunctions.getLastMessageFileDowloadURL(fileurl, headers);

      const lastmessageData = await helperFunctions.groupLastMessage(channelName, roomid, headers);
      const userName = lastmessageData.replace('says, .', '');
      const speechText = i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.IMAGE_MESSAGE', userName);

      if (!conv.screen) {
        
        conv.ask(speechText);
        return;
      }

      conv.ask(speechText);

      conv.ask(new BasicCard({
        text: `An Image Message`,
        buttons: new Button({
          title: 'Read Message',
          url: `${SERVER_URL}/group/${channelName}`,
        }),
        image: new Image({
          url: download,
          alt: 'Rocket Chat Image Message',
        }),
        display: 'CROPPED',
      }));

    } else if (messageType.includes("room-not-found")){
      
      const speechText = i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);

      conv.ask(speechText);

    } else {

      const speechText = i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.UNSUPPORTED_MEDIA_TYPE', channelName);

      conv.ask(speechText);

    }

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const messageType = await helperFunctions.getGroupLastMessageType(roomid, headers);

    if (messageType === 'textmessage') {

      const speechText = await helperFunctions.groupLastMessage(channelName, roomid, headers);

      conv.ask(speechText);

    } else if (messageType.includes("image")) {

      const fileurl = await helperFunctions.getGroupLastMessageFileURL(roomid, headers);
      const download = await helperFunctions.getLastMessageFileDowloadURL(fileurl, headers);

      const lastmessageData = await helperFunctions.groupLastMessage(channelName, roomid, headers);
      const userName = lastmessageData.replace('says, .', '');
      const speechText = i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.IMAGE_MESSAGE', userName);

      if (!conv.screen) {
        
        conv.ask(speechText);
        return;
      }

      conv.ask(speechText);

      conv.ask(new BasicCard({
        text: `An Image Message`,
        buttons: new Button({
          title: 'Read Message',
          url: `${SERVER_URL}/group/${channelName}`,
        }),
        image: new Image({
          url: download,
          alt: 'Rocket Chat Image Message',
        }),
        display: 'CROPPED',
      }));

    } else if (messageType.includes("room-not-found")){
      
      const speechText = i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.ERROR_NOT_FOUND', channelName);

      conv.ask(speechText);

    } else {

      const speechText = i18n.__('GET_LAST_MESSAGE_FROM_CHANNEL.UNSUPPORTED_MEDIA_TYPE', channelName);

      conv.ask(speechText);

    }

  }

});

app.intent('Group Unread Messages Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const unreadCount = await helperFunctions.getGroupUnreadCounter(roomid, headers);
    const speechText = await helperFunctions.groupUnreadMessages(channelName, roomid, unreadCount, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const unreadCount = await helperFunctions.getGroupUnreadCounter(roomid, headers);
    const speechText = await helperFunctions.groupUnreadMessages(channelName, roomid, unreadCount, headers);

    conv.ask(speechText);

  }

});

app.intent('Default No Input Intent', (conv) => {
  const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
  if (repromptCount === 0) {
    conv.ask(i18n.__('NO_INPUT.MESSAGE'));
  } else if (repromptCount === 1) {
    conv.close(i18n.__('NO_INPUT.EXIT'));
  };
});

app.intent('Post Group Message Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var message = params.message;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.postGroupMessage(roomid, message, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var message = params.message;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.postGroupMessage(roomid, message, headers);

    conv.ask(speechText);

  }

});

app.intent('Post Group Emoji Message Intent', async (conv, params) => {

  var locale = conv.user.locale;

  if (locale === 'hi-IN') {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = await helperFunctions.hinditranslate(channelNameRaw);
    var channelNameLwr = channelNameData.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameLwr);

    var messageData = params.message;
    const emojiRaw = params.emoji;
    var emojiData = await helperFunctions.hinditranslate(emojiRaw);
    const emoji = helperFunctions.emojiTranslateFunc(emojiData);
    const message = messageData + emoji;

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.postGroupMessage(roomid, message, headers);

    conv.ask(speechText);

  } else {

    var accessToken = conv.user.access.token;

    var channelNameRaw = params.channelname;
    var channelNameData = channelNameRaw.toLowerCase();
    var channelName = helperFunctions.replaceWhitespacesFunc(channelNameData);

    var messageData = params.message;
    const emojiData = params.emoji;
    const emoji = helperFunctions.emojiTranslateFunc(emojiData);
    const message = messageData + emoji;

    const headers = await helperFunctions.login(accessToken);
    const roomid = await helperFunctions.getGroupId(channelName, headers);
    const speechText = await helperFunctions.postGroupMessage(roomid, message, headers);

    conv.ask(speechText);

  }

});

if(process.env.DEVELOPMENT) {
	const express = require('express')
	const bodyParser = require('body-parser')
	const expressApp = express().use(bodyParser.json())
	expressApp.post('/', (app))
	expressApp.listen(3000)
} else{
	exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
}