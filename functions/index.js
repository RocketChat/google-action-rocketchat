'use strict';

const {
  dialogflow,
  SignIn,
  BasicCard,
  Button,
  Image,
  MediaObject,
  Table,
  Suggestions,
  List
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
    const currentUserDetails = await helperFunctions.getCurrentUserDetails(accessToken);
    if(!currentUserDetails) {
      throw "Authentication Failed"
    }

    if(!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')){
      conv.ask(i18n.__('WELCOME.SUCCESS'));
      conv.add(new Suggestions("What can you do?"))
    } else {
      const summary = await helperFunctions.getAccountSummary(currentUserDetails.headers);
      conv.ask(i18n.__('WELCOME.SUCCESS'));
      conv.add(new Suggestions(['What can you do?', 'Send direct message', 'Get my mentions']))

      if(summary && summary.length === 0){
        //if the user has no summary to display show a simple card with profile details
        conv.ask(new BasicCard({
          text: `Your Account Details`,
          subtitle: currentUserDetails.userDetails.statusText,
          title: currentUserDetails.userDetails.username,
          image: new Image({
            url: `${currentUserDetails.userDetails.avatarUrl}`,
            alt: currentUserDetails.userDetails.username,
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
          title: currentUserDetails.userDetails.username,
          subtitle: 'Your Account Summary (24hrs)',
          image: new Image({
            url: currentUserDetails.userDetails.avatarUrl,
            alt: currentUserDetails.userDetails.username
          }),
          columns: [
            {
              header: 'Subscriptions',
              align: 'LEFT',
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
    }
  
  }catch(err) {
    console.log(err)
    conv.close(i18n.__('SOMETHING_WENT_WRONG'));
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
  conv.ask(new Suggestions(['Read mentions from room', 'Read mentions dicussion', 'Read mentions from user']))
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
  try{
    const accessToken = conv.user.access.token;
    const headers = await helperFunctions.login(accessToken);
    let channelname = params.channelname;
  
    var locale = conv.user.locale;
    if(locale === 'hi-IN') {
      channelname = await helperFunctions.hinditranslate(channelname);
    }
  
    const channelDetails = await helperFunctions.resolveChannelname(channelname, headers);
    if(!channelDetails) {
      conv.ask(i18n.__('NO_ACTIVE_ROOM', { name: channelname }))
      conv.ask(i18n.__('GENERIC_REPROMPT'))
      return
    }
  
    let unreadMentionsCount;
    let speechText;
    if(channelDetails.type === 'c') {
      unreadMentionsCount = await helperFunctions.getMentionsCounter(channelDetails.name, headers);
      speechText = await helperFunctions.readUnreadMentions(channelDetails, unreadMentionsCount, headers);
    } else if(channelDetails.type === 'p') {
      unreadMentionsCount = await helperFunctions.getGroupMentionsCounter(channelDetails.id, headers);
      speechText = await helperFunctions.readUnreadMentions(channelDetails, unreadMentionsCount, headers);
    }

    if(!Array.isArray(speechText)){
      conv.ask(speechText)
      conv.ask(i18n.__('GENERIC_REPROMPT'))
    } else {
      conv.ask(speechText[0]);
      conv.ask(i18n.__('GENERIC_REPROMPT'))

      let row = []

      for (let message of speechText[1]){
        row.push([message])
      }
      
      conv.add(new Table({
        title: channelDetails.name,
        columns: [
          {
            header: 'Unread Messages',
            align: 'LEFT',
          },
        ],
        rows: row,
      }))
    }
  
  } catch(err) {
    console.log(err)
    conv.ask(i18n.__('SOMETHING_WENT_WRONG'));
    conv.ask(i18n.__('GENERIC_REPROMPT'))
  }
})

app.intent('Read Unread Mentions From Discussion Intent', async (conv, params) => {
  try{
    const accessToken = conv.user.access.token;
    const headers = await helperFunctions.login(accessToken);
    let discussionname = params.discussionname;
  
    var locale = conv.user.locale;
    if(locale === 'hi-IN') {
      discussionname = await helperFunctions.hinditranslate(discussionname);
    }
  
    const channelDetails = await helperFunctions.resolveDiscussion(discussionname, headers);
    if(!channelDetails) {
      conv.ask(i18n.__('NO_ACTIVE_DISCUSSION', { name: discussionname }))
      conv.ask(i18n.__('GENERIC_REPROMPT'))
      conv.ask(new Suggestions(['Send message discussion', 'List my dicussions']))
      return
    }
  
    let unreadMentionsCount;
    let speechText;
    if(channelDetails.type === 'c') {
      unreadMentionsCount = await helperFunctions.getMentionsCounter(channelDetails.name, headers);
      speechText = await helperFunctions.readUnreadMentions(channelDetails, unreadMentionsCount, headers, channelDetails.fname);
    } else if(channelDetails.type === 'p') {
      unreadMentionsCount = await helperFunctions.getGroupMentionsCounter(channelDetails.id, headers);
      speechText = await helperFunctions.readUnreadMentions(channelDetails, unreadMentionsCount, headers, channelDetails.fname);
    }

    if(!Array.isArray(speechText)){
      conv.ask(speechText)
      conv.ask(i18n.__('GENERIC_REPROMPT'))
    } else {
      conv.ask(speechText[0]);
      conv.ask(i18n.__('GENERIC_REPROMPT'))

      let row = []

      for (let message of speechText[1]){
        row.push([message])
      }
      
      conv.add(new Table({
        title: channelDetails.fname,
        columns: [
          {
            header: 'Unread Messages',
            align: 'LEFT',
          },
        ],
        rows: row,
      }))
    }
  
  } catch(err) {
    console.log(err)
    conv.ask(i18n.__('SOMETHING_WENT_WRONG'));
    conv.ask(i18n.__('GENERIC_REPROMPT'))
  }
})

app.intent('Read Unread Mentions From DM Intent', async (conv, params) => {
  try{
    const accessToken = conv.user.access.token;
    const currentUserDetails = await helperFunctions.getCurrentUserDetails(accessToken);
    let username = params.username;
  
    var locale = conv.user.locale;
    if(locale === 'hi-IN') {
      username = await helperFunctions.hinditranslate(username);
    }
  
    const DMDetails = await helperFunctions.resolveUsername(username, currentUserDetails.headers);
    if(!DMDetails) {
      conv.ask(i18n.__('NO_ACTIVE_USER', { username }))
      conv.ask(i18n.__('GENERIC_REPROMPT'))
      conv.ask(new Suggestions(['Read unreads from direct', 'get my mentions']))
      return
    }
  
    const DMCount = await helperFunctions.getDMCounter(DMDetails.rid, currentUserDetails.headers);
    let unreadMentionsCount = DMCount.userMentions
    let speechText = await helperFunctions.DMUnreadMentions(DMDetails, unreadMentionsCount, currentUserDetails.headers);

    if(!Array.isArray(speechText)){
      conv.ask(speechText)
      conv.ask(i18n.__('GENERIC_REPROMPT'))
    } else {
      conv.ask(speechText[0]);
      conv.ask(i18n.__('GENERIC_REPROMPT'))

      let row = []

      for (let message of speechText[1]){
        row.push([message])
      }
      
      conv.add(new Table({
        title: DMDetails.name,
        columns: [
          {
            header: 'Unread Messages',
            align: 'LEFT',
          },
        ],
        rows: row,
      }))
    }

    conv.ask(new Suggestions(['get my mentions', 'List my discussions']))

  } catch(err) {
    console.log(err)
    conv.ask(i18n.__('SOMETHING_WENT_WRONG'));
    conv.ask(i18n.__('GENERIC_REPROMPT'))
  }
})

app.intent('Get All Unread Messages Intent', async (conv) => {
  const accessToken = conv.user.access.token;
  const headers = await helperFunctions.login(accessToken);
  const speechText = await helperFunctions.getAllUnreads(headers);
  conv.ask(speechText[0]);
  conv.ask(i18n.__('GENERIC_REPROMPT'))
  conv.ask(new Suggestions(['Read unreads from room', 'Read unreads dicussion', 'Read unreads from direct']))
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

app.intent('Read Unread Messages', async (conv, params) => {
  try{
    // this intent can read unread messages from channel,group or dm.
    const accessToken = conv.user.access.token;
    const headers = await helperFunctions.login(accessToken);
    let channelname = params.channelname;
  
    var locale = conv.user.locale;
    if(locale === 'hi-IN') {
      channelname = await helperFunctions.hinditranslate(channelname);
    }
  
    const channelDetails = await helperFunctions.resolveRoomORUser(channelname, headers);
    if(!channelDetails) {
      conv.ask(i18n.__('NO_ACTIVE_SUBSCRIPTION', { name: channelname }))
      conv.ask(i18n.__('GENERIC_REPROMPT'))
      conv.ask(new Suggestions(['Read unreads from direct', 'Read unreads dicussion']))
      return
    }
    
    let speechText;

    if (channelDetails.type === 'c' || channelDetails.type === 'p') {
      const unreadCount = await helperFunctions.getUnreadCounter(channelDetails.name, channelDetails.type, headers);
      speechText = await helperFunctions.roomUnreadMessages(channelDetails.name, unreadCount, channelDetails.type, headers);
    } else if (channelDetails.type === 'd') {
      const DMCount = await helperFunctions.getDMCounter(channelDetails.rid, headers);
      speechText = await helperFunctions.DMUnreadMessages(channelDetails.name, DMCount.unreads, headers);
    }

    if(!Array.isArray(speechText)){
      conv.ask(speechText)
      conv.ask(i18n.__('GENERIC_REPROMPT'))
    } else {
      conv.ask(speechText[0]);
      conv.ask(i18n.__('GENERIC_REPROMPT'))

      let row = []

      for (let message of speechText[1]){
        row.push([message])
      }
      
      conv.add(new Table({
        title: channelDetails.name,
        columns: [
          {
            header: 'Unread Messages',
            align: 'LEFT',
          },
        ],
        rows: row,
      }))
    }

    conv.ask(new Suggestions(['Read unread mentions', 'Read mentions from user']))
 

  } catch(err) {
    console.log(err)
    conv.ask(i18n.__('SOMETHING_WENT_WRONG'));
    conv.ask(i18n.__('GENERIC_REPROMPT'))
  }
});

app.intent('Read Unread Messages From Channel Intent', async (conv, params) => {
  try{
    const accessToken = conv.user.access.token;
    const headers = await helperFunctions.login(accessToken);
    let channelname = params.channelname;
  
    var locale = conv.user.locale;
    if(locale === 'hi-IN') {
      channelname = await helperFunctions.hinditranslate(channelname);
    }
  
    const channelDetails = await helperFunctions.resolveChannelname(channelname, headers);
    if(!channelDetails) {
      conv.ask(i18n.__('NO_ACTIVE_ROOM', { name: channelname }))
      conv.ask(i18n.__('GENERIC_REPROMPT'))
      conv.ask(new Suggestions(['Read unreads from direct', 'Read unreads dicussion']))
      return
    }
    
    let speechText;

    const unreadCount = await helperFunctions.getUnreadCounter(channelDetails.name, channelDetails.type, headers);
    speechText = await helperFunctions.roomUnreadMessages(channelDetails.name, unreadCount, channelDetails.type, headers);

    if(!Array.isArray(speechText)){
      conv.ask(speechText)
      conv.ask(i18n.__('GENERIC_REPROMPT'))
    } else {
      conv.ask(speechText[0]);
      conv.ask(i18n.__('GENERIC_REPROMPT'))

      let row = []

      for (let message of speechText[1]){
        row.push([message])
      }
      
      conv.add(new Table({
        title: channelDetails.name,
        columns: [
          {
            header: 'Unread Messages',
            align: 'LEFT',
          },
        ],
        rows: row,
      }))
    }
    conv.ask(new Suggestions(['Read unreads from direct', 'Read unreads dicussion']))
 

  } catch(err) {
    console.log(err)
    conv.ask(i18n.__('SOMETHING_WENT_WRONG'));
    conv.ask(i18n.__('GENERIC_REPROMPT'))
  }
});

app.intent('Read Unread Messages From Discussion Intent', async (conv, params) => {
  try{
    const accessToken = conv.user.access.token;
    const headers = await helperFunctions.login(accessToken);
    let discussionName = params.name;
  
    var locale = conv.user.locale;
    if(locale === 'hi-IN') {
      discussionName = await helperFunctions.hinditranslate(discussionName);
    }
  
    const discussionDetails = await helperFunctions.resolveDiscussion(discussionName, headers);
    if(!discussionDetails) {
      conv.ask(i18n.__('NO_ACTIVE_DISCUSSION', { name: discussionName }))
      conv.ask(i18n.__('GENERIC_REPROMPT'))
      conv.ask(new Suggestions(['List my discussions', 'Read mentions from discussion']))
      return
    }

    const unreadCount = await helperFunctions.getUnreadCounter(discussionDetails.name, discussionDetails.type, headers);
    let speechText = await helperFunctions.roomUnreadMessages(discussionDetails.name, unreadCount, discussionDetails.type, headers, discussionDetails.fname);

    if(!Array.isArray(speechText)){
      conv.ask(speechText)
      conv.ask(i18n.__('GENERIC_REPROMPT'))
    } else {
      conv.ask(speechText[0]);
      conv.ask(i18n.__('GENERIC_REPROMPT'))

      let row = []

      for (let message of speechText[1]){
        row.push([message])
      }
      
      conv.add(new Table({
        title: discussionDetails.fname,
        columns: [
          {
            header: 'Unread Messages',
            align: 'LEFT',
          },
        ],
        rows: row,
      }))
    }
 
    conv.ask(new Suggestions(['List my discussions', 'Read unreads from a room']))

  } catch(err) {
    console.log(err)
    conv.ask(i18n.__('SOMETHING_WENT_WRONG'));
    conv.ask(i18n.__('GENERIC_REPROMPT'))
  }
})

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

app.intent('Post Discussion Message Intent Slot Collection', async (conv, params) => {
  try{
    const accessToken = conv.user.access.token;
    const headers = await helperFunctions.login(accessToken);
    let discussionname = params.discussionname;
    const message = params.message;
  
    var locale = conv.user.locale;
    if(locale === 'hi-IN') {
      discussionname = await helperFunctions.hinditranslate(discussionname);
    }
  
    const discussionDetails = await helperFunctions.resolveDiscussion(discussionname, headers);
  
    if(discussionDetails) {
      conv.ask(i18n.__('POST_MESSAGE.CONFIRM_DISCUSSION_INTENT', message, discussionDetails.fname))
      conv.data.discussionDetails = discussionDetails
      conv.ask(new Suggestions(['yes', 'no']));
      conv.contexts.set('post_discussion_message', 1, {discussionname, message})
    } else {
      conv.ask(i18n.__('NO_ACTIVE_DISCUSSION', {name: discussionname}))
      conv.ask(i18n.__('GENERIC_REPROMPT'))
    }
  }catch(err){
    console.log(err)
    conv.ask(i18n.__('SOMETHING_WENT_WRONG'));
    conv.ask(i18n.__('GENERIC_REPROMPT'))
  }
})

app.intent('Post Discussion Message Intent Confirmed', async (conv, params) => {
  try{
    var accessToken = conv.user.access.token;
    var message = params.message;
    //make the first letter uppercase
    message = message[0].toUpperCase() + message.slice(1);
    const headers = await helperFunctions.login(accessToken);
    const speechText = await helperFunctions.postMessage(conv.data.discussionDetails.name, message, headers);
    conv.ask(speechText);
    conv.ask(i18n.__('GENERIC_REPROMPT'))
  } catch(err){
    console.log(err)
    conv.ask(i18n.__('SOMETHING_WENT_WRONG'));
    conv.ask(i18n.__('GENERIC_REPROMPT'))
  }
});

app.intent('Read Unread Messages From DM Intent', async (conv, params) => {
  try{
    const accessToken = conv.user.access.token;
    const currentUserDetails = await helperFunctions.getCurrentUserDetails(accessToken);
    let username = params.username;
  
    var locale = conv.user.locale;
    if(locale === 'hi-IN') {
      username = await helperFunctions.hinditranslate(username);
    }
  
    const DMDetails = await helperFunctions.resolveUsername(username, currentUserDetails.headers);    if(!DMDetails) {
      conv.ask(i18n.__('NO_ACTIVE_USER', { username }))
      conv.ask(i18n.__('GENERIC_REPROMPT'))
      conv.ask(new Suggestions(['get my mentions', 'Read unreads from dicussion']))
      return
    }

    const DMCount = await helperFunctions.getDMCounter(DMDetails.rid, currentUserDetails.headers);
    const speechText = await helperFunctions.DMUnreadMessages(DMDetails.name, DMCount.unreads, currentUserDetails.headers);

    if(!Array.isArray(speechText)){
      conv.ask(speechText)
      conv.ask(i18n.__('GENERIC_REPROMPT'))
    } else {
      conv.ask(speechText[0]);
      conv.ask(i18n.__('GENERIC_REPROMPT'))

      let row = []

      for (let message of speechText[1]){
        row.push([message])
      }
      
      conv.add(new Table({
        title: DMDetails.name,
        columns: [
          {
            header: 'Unread Messages',
            align: 'LEFT',
          },
        ],
        rows: row,
      }))
    }
    conv.ask(new Suggestions(['Read mentions from room', 'Read unreads from a dicussion']))

  }catch(err){
    console.log(err)
    conv.ask(i18n.__('SOMETHING_WENT_WRONG'));
    conv.ask(i18n.__('GENERIC_REPROMPT'))
  }
})

app.intent('List My Discussions', async (conv, params) => {
  try{
    if (!conv.screen) {
      conv.ask('Sorry, this only works for devices with screens');
      return;
    }
    var accessToken = conv.user.access.token;
    const headers = await helperFunctions.login(accessToken);
  
    const discussionDetails = await helperFunctions.getLatestDiscussions(headers);

    if(!discussionDetails) {
      conv.ask('You are not part of any discussions');
      conv.ask(i18n.__('GENERIC_REPROMPT'))
      return;
    }

    if(discussionDetails.length === 1) {
      conv.ask(`You are part of one discussion named ${discussionDetails[0].fname}`)
      conv.ask(i18n.__('GENERIC_REPROMPT'))
      return;
    }

    // generating items to display in a rich response list
    const items = {};
  
    for (let discussion of discussionDetails) {
      //store the discussion details as the key of the list item
      items[JSON.stringify(discussion)] = {
        title: discussion.fname,
      }
    }
  
    conv.ask('Use this list anytime to select discussion names while using the action.');
    conv.ask(new Suggestions(['Send message discussion', 'Read unreads dicussion']))
    // Create a list
    conv.ask(new List({
      title: 'Your Discussions.',
      items: items,
    }));
  }catch(err){
    console.log(err)
    conv.ask(i18n.__('SOMETHING_WENT_WRONG'));
    conv.ask(i18n.__('GENERIC_REPROMPT'))
  }

  });
  
app.intent('Handle Touch In List', async (conv, params, option) => {
  try{
    //parse the discussion details from the key of selected option
    const discussionDetails = JSON.parse(option);
    var accessToken = conv.user.access.token;
    const headers = await helperFunctions.login(accessToken);
    const counters = await helperFunctions.getRoomCounterFromId(discussionDetails.id, discussionDetails.type, headers);

    //display basic informatino of the discussion in a table
    conv.ask(`You have ${counters.unreads} unreads and ${counters.userMentions} mentions in discussion ${discussionDetails.fname}`)
    conv.ask(i18n.__('GENERIC_REPROMPT'))
    conv.ask(new Table({
      title: 'Updates from discussion',
      subtitle: discussionDetails.fname,
      columns: [
        {
          header: 'Unreads',
          align: 'CENTER',
        },
        {
          header: 'User Mentions',
          align: 'CENTER',
        },
      ],
      rows: [{
        cells: [`${counters.unreads}`, `${counters.userMentions}`]
      }],
    }))
  }catch(err){
    console.log(err)
    conv.ask(i18n.__('SOMETHING_WENT_WRONG'));
    conv.ask(i18n.__('GENERIC_REPROMPT'))
  }

  })
  

if(process.env.DEVELOPMENT) {
  // if code is running in local development environment
	const express = require('express')
	const bodyParser = require('body-parser')
	const expressApp = express().use(bodyParser.json())
	expressApp.post('/', (app))
	expressApp.listen(3000)
} else if(Boolean(process.env['AWS_LAMBDA_FUNCTION_NAME'])) {
  // if code is deployed in aws lambda function environment
  exports.handler = app;
} else{
  // if code is deployed in firebase function
	exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
}