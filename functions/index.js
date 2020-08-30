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
  debug: false,
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

const handleConfirmationChannelResolution = async (app, intentData) => {
  app.intent(intentData.intentName, async (conv, params) => {
    try{
      const accessToken = conv.user.access.token;
      const headers = await helperFunctions.login(accessToken);
      let channelname = params.channelname;
    
      var locale = conv.user.locale;
      if(locale === 'hi-IN') {
        channelname = await helperFunctions.hinditranslate(channelname);
      }
    
      const channelDetails = await helperFunctions.resolveChannelname(channelname, headers);
    
      if(!channelDetails){
        conv.ask(i18n.__('NO_ROOM', channelname))
        if(Math.random() >= 0.5) {
          conv.ask(i18n.__('GENERIC_REPROMPT'))
        } else {
          // giving hints to the user
          conv.ask([i18n.__('GENERIC_REPROMPT'), i18n.__('HINTS_TRANSITION'), helperFunctions.randomProperty(i18n.__('HINTS'))].join(' '))
        }
        return 
      }
  
      intentData.confirmationLogic({conv, params, channelDetails, headers})
      conv.ask(new Suggestions(['yes', 'no']))
    }catch(err){
      conv.ask(i18n.__('TRY_AGAIN'));
    }
  })
}

const handleExecutionChannelResolution = async (app, intentData) => {
  app.intent(intentData.intentName, async(conv, params) => {
    try{
      const accessToken = conv.user.access.token;
      const headers = await helperFunctions.login(accessToken);
      await intentData.executionLogic({conv, params, headers})
      const random = Math.random()
      if(random >= 0.7) {
        conv.ask(i18n.__('GENERIC_REPROMPT'))
      } else {
        conv.ask([i18n.__('GENERIC_REPROMPT'), i18n.__('HINTS_TRANSITION'), helperFunctions.randomProperty(i18n.__('HINTS'))].join(' '))
      }
    }catch(err){
      conv.ask(i18n.__('TRY_AGAIN'));
    }
  })
}

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

const handleConfirmationUserAndChannelResolution = async (app, intentData) => {
  app.intent(intentData.intentName, async (conv, params) => {
    const accessToken = conv.user.access.token;
    const headers = await helperFunctions.login(accessToken);
    let channelname = params.channelname;
    let username = params.username;
  
    var locale = conv.user.locale;
    if(locale === 'hi-IN') {
      channelname = await helperFunctions.hinditranslate(channelname);
      username = await helperFunctions.hinditranslate(username);
    }
  
    const channelDetails = await helperFunctions.resolveChannelname(channelname, headers);
    const userDetails = await helperFunctions.resolveUsername(username, headers);
  
    if(!userDetails){
      conv.ask(i18n.__('NO_USER', username))
      conv.ask(i18n.__('GENERIC_REPROMPT'))
    } else if(!channelDetails){
      conv.ask(i18n.__('NO_ROOM', channelname))
      conv.ask(i18n.__('GENERIC_REPROMPT'))
    } else {
      conv.ask(i18n.__(`${intentData.intentResource}.CONFIRM_INTENT`, userDetails.name, channelDetails.name))
      conv.data.channelDetails = channelDetails
      conv.data.userDetails = userDetails
      conv.contexts.set(intentData.intentContext, 1, {channelname, username})
      conv.ask(new Suggestions(["yes", "no"]))
    }
  })
}

handleConfirmationUserAndChannelResolution(app, {intentName: 'Add Leader Intent Slot Collection', intentResource: 'ADD_LEADER', intentContext: 'add_leader'});
handleConfirmationUserAndChannelResolution(app, {intentName: 'Add Moderator Intent Slot Collection', intentResource: 'MAKE_MODERATOR', intentContext: 'add_moderator'});
handleConfirmationUserAndChannelResolution(app, {intentName: 'Add Owner Intent Slot Collection', intentResource: 'ADD_OWNER', intentContext: 'add_owner'});
handleConfirmationUserAndChannelResolution(app, {intentName: 'Invite User Intent Slot Collection', intentResource: 'INVITE_USER_TO_CHANNEL', intentContext: 'invite_user'});
handleConfirmationUserAndChannelResolution(app, {intentName: 'Kick User Intent Slot Collection', intentResource: 'KICK_USER_FROM_CHANNEL', intentContext: 'kick_user'});

const handleConfirmationUserWithRoleAndChannelResolution = async (app, intentData) => {
  app.intent(intentData.intentName, async (conv, params) => {
    const accessToken = conv.user.access.token;
    const headers = await helperFunctions.login(accessToken);
    let channelname = params.channelname;
    let username = params.username;
  
    var locale = conv.user.locale;
    if(locale === 'hi-IN') {
      channelname = await helperFunctions.hinditranslate(channelname);
      username = await helperFunctions.hinditranslate(username);
    }
  
    const channelDetails = await helperFunctions.resolveChannelname(channelname, headers);
    if(!channelDetails){
      conv.ask(i18n.__('NO_ROOM', channelname))
      conv.ask(i18n.__('GENERIC_REPROMPT'))
      return
    }

    const userDetails = await helperFunctions.resolveUsersWithRolesFromRoom(username, channelDetails, intentData.role, headers);
  
    if(!userDetails){
      conv.ask(i18n.__('NO_USER_WITH_ROLE', {role: intentData.role, username, channelname: channelDetails.name}))
      conv.ask(i18n.__('GENERIC_REPROMPT'))
    } else {
      conv.ask(i18n.__(`${intentData.intentResource}.CONFIRM_INTENT`, {username: userDetails.name, role: intentData.role, channelname: channelDetails.name}))
      conv.ask(new Suggestions(["yes", "no"]))
      conv.data.channelDetails = channelDetails
      conv.data.userDetails = userDetails
      conv.contexts.set(intentData.intentContext, 1, {channelname, username})
    }
  })
}

handleConfirmationUserWithRoleAndChannelResolution(app, {intentName: 'Remove Leader Intent Slot Collection', intentResource: 'REMOVE_LEADER', intentContext: 'remove_leader', role: 'leader'})
handleConfirmationUserWithRoleAndChannelResolution(app, {intentName: 'Remove Owner Intent Slot Collection', intentResource: 'REMOVE_OWNER', intentContext: 'remove_owner', role: 'owner'})
handleConfirmationUserWithRoleAndChannelResolution(app, {intentName: 'Remove Moderator Intent Slot Collection', intentResource: 'REMOVE_MODERATOR', intentContext: 'remove_moderator', role: 'moderator'})

const handleExecutionUserAndChannelResolution = async (app, {intentName, helperFunction}) => {
  app.intent(intentName, async(conv, params) => {
    var accessToken = conv.user.access.token;
    const headers = await helperFunctions.login(accessToken);
  
    const speechText = await helperFunction(conv.data.userDetails, conv.data.channelDetails, headers);
    conv.ask(speechText);
    conv.ask(i18n.__('GENERIC_REPROMPT'))
  })
}

handleExecutionUserAndChannelResolution(app, {intentName: 'Add Leader Intent Confirmed', helperFunction: helperFunctions.addLeader})
handleExecutionUserAndChannelResolution(app, {intentName: 'Add Moderator Intent Confirmed', helperFunction: helperFunctions.makeModerator})
handleExecutionUserAndChannelResolution(app, {intentName: 'Add Owner Intent Confirmed', helperFunction: helperFunctions.addOwner})
handleExecutionUserAndChannelResolution(app, {intentName: 'Invite User Intent Confirmed', helperFunction: helperFunctions.inviteUser})
handleExecutionUserAndChannelResolution(app, {intentName: 'Kick User Intent Confirmed', helperFunction: helperFunctions.kickUser})
handleExecutionUserAndChannelResolution(app, {intentName: 'Remove Leader Intent Confirmed', helperFunction: helperFunctions.removeLeader})
handleExecutionUserAndChannelResolution(app, {intentName: 'Remove Owner Intent Confirmed', helperFunction: helperFunctions.removeOwner})
handleExecutionUserAndChannelResolution(app, {intentName: 'Remove Moderator Intent Confirmed', helperFunction: helperFunctions.removeModerator})

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

handleConfirmationChannelResolution(app, {intentName: 'Delete Channel Intent Slot Collection', confirmationLogic: ({conv, channelDetails}) => {
  conv.ask(i18n.__(`DELETE_CHANNEL.CONFIRM_INTENT`, { roomname: channelDetails.name }))
  conv.data.channelDetails = channelDetails
  conv.contexts.set('delete_channel', 1, {channelname: channelDetails.name})
}})

handleExecutionChannelResolution(app, {intentName: 'Delete Channel Intent Confirmed', executionLogic: async ({conv, headers}) => {
  const speechText = await helperFunctions.deleteChannel(conv.data.channelDetails, headers);
  conv.ask(speechText);
}})

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

app.intent('Post Channel Message Intent Slot Collection', async (conv, params) => {
  const accessToken = conv.user.access.token;
  const headers = await helperFunctions.login(accessToken);
  let channelname = params.channelname;
  const message = params.message;

  var locale = conv.user.locale;
  if(locale === 'hi-IN') {
    channelname = await helperFunctions.hinditranslate(channelname);
  }

  const channelDetails = await helperFunctions.resolveChannelname(channelname, headers);

  if(channelDetails) {
    conv.ask(i18n.__('POST_MESSAGE.CONFIRMATION', message, channelDetails.name))
    conv.data.channelDetails = channelDetails
    conv.contexts.set('post_message', 1, {channelname, message})
    conv.ask(new Suggestions(["yes", "no"]))
  } else {
    conv.ask(i18n.__('POST_MESSAGE.NO_CHANNEL', channelname))
    conv.ask(i18n.__('GENERIC_REPROMPT'))
  }
})

app.intent('Post Channel Message Intent Confirmed', async (conv, params) => {

  var accessToken = conv.user.access.token;

  var message = params.message;

  const channelName = conv.data.channelDetails.name

  const headers = await helperFunctions.login(accessToken);
  const speechText = await helperFunctions.postMessage(channelName, message, headers);

  conv.ask(speechText);
  conv.ask(i18n.__('GENERIC_REPROMPT'))
  conv.ask(new Suggestions("Read last message"))
});

app.intent('Get Last Message From Channel', async (conv, params) => {
  var accessToken = conv.user.access.token;
  const headers = await helperFunctions.login(accessToken);
  let channelname = params.channelname;
  var locale = conv.user.locale;

  if (locale === 'hi-IN') {
    channelname = helperFunctions.hinditranslate(channelname)
  }

  const channelDetails = await helperFunctions.resolveChannelname(channelname, headers);

  if(!channelDetails) {
    conv.ask(i18n.__('NO_ROOM', channelname))
    conv.ask(i18n.__('GENERIC_REPROMPT'))
    return
  }

  const lastMessage = await helperFunctions.getLastMessage(channelDetails, headers);
  let speechText;
  let imageURL;
  let download;
  if(!lastMessage.file && !lastMessage.t){
    speechText = i18n.__('MESSAGE_TYPE.TEXT_MESSAGE', {username: lastMessage.u.username, message: lastMessage.msg})
  } else if (!lastMessage.file) {
    if(lastMessage.t === 'room_changed_description'){
      speechText = i18n.__('MESSAGE_TYPE.CHANGE_DESCRIPTION', {username: lastMessage.u.username, description: lastMessage.msg})
    } else if (lastMessage.t === 'room_changed_topic'){
      speechText = i18n.__('MESSAGE_TYPE.CHANGE_TOPIC', {username: lastMessage.u.username, topic: lastMessage.msg})
    } else if (lastMessage.t === 'room_changed_announcement') {
      speechText = i18n.__('MESSAGE_TYPE.CHANGE_ANNOUNCEMENT', {username: lastMessage.u.username, announcement: lastMessage.msg})
    } else {
      speechText = i18n.__('MESSAGE_TYPE.UNKNOWN_MESSAGE', {username: lastMessage.u.username})
    }
  } else if (lastMessage.file) {
    if(lastMessage.file.type.includes('image')){
      speechText = i18n.__('MESSAGE_TYPE.IMAGE_MESSAGE', {username: lastMessage.u.username, title: lastMessage.attachments[0].title}) 
      imageURL = await helperFunctions.getLastMessageFileDowloadURL(`${SERVER_URL}${lastMessage.attachments[0].image_url}`, headers)
    } else if (lastMessage.file.type.includes('video')){
      speechText = i18n.__('MESSAGE_TYPE.VIDEO_MESSAGE', {username: lastMessage.u.username, title: lastMessage.attachments[0].title}) 
      download = await helperFunctions.getLastMessageFileDowloadURL(`${SERVER_URL}${lastMessage.attachments[0].title_link}`, headers)
    }else {
      speechText = i18n.__('MESSAGE_TYPE.FILE_MESSAGE', {username: lastMessage.u.username, title: lastMessage.attachments[0].title}) 
      download = await helperFunctions.getLastMessageFileDowloadURL(`${SERVER_URL}${lastMessage.attachments[0].title_link}`, headers)
    }
  } else {
    speechText = i18n.__('MESSAGE_TYPE.UNKNOWN_MESSAGE', {username: lastMessage.u.username})
  }
  conv.ask(speechText)
  const url = `${SERVER_URL}/${channelDetails.type === 'c' ? 'channel' : 'group'}/${channelDetails.name}`
  if(imageURL){
    conv.ask(new BasicCard({
      text: `${lastMessage.attachments[0].title}`,
      buttons: new Button({
        title: 'Open in Browser',
        url: `${url}`,
      }),
      image: new Image({
        url: `${imageURL}`,
        alt: 'Rocket Chat Image Message',
      }),
      display: 'CROPPED',
    }));
  } else if(download) {
    conv.ask(new BasicCard({
      title: `Message from ${lastMessage.u.username}`,
      subtitle: `${ lastMessage.attachments[0].title}`,
      buttons: new Button({
        title: 'View File',
        url: `${download}`,
      })
    }));
  } else {
    conv.ask(new BasicCard({
      title: `Message from ${lastMessage.u.username}`,
      subtitle: lastMessage.msg || '',
      buttons: new Button({
        title: 'Open in Browser',
        url: `${url}`,
      })
    }));
  }
  conv.ask(i18n.__('GENERIC_REPROMPT'))

})

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

handleConfirmationChannelResolution(app, {intentName: 'Archive Channel Intent Slot Collection', confirmationLogic: ({conv, channelDetails}) => {
  conv.ask(i18n.__(`ARCHIVE_CHANNEL.CONFIRM_INTENT`, { roomname: channelDetails.name }))
  conv.data.channelDetails = channelDetails
  conv.contexts.set('archive_channel', 1, {channelname: channelDetails.name})
}})

handleExecutionChannelResolution(app, {intentName: 'Archive Channel Intent Confirmed', executionLogic: async ({conv, headers}) => {
  const speechText = await helperFunctions.archiveChannel(conv.data.channelDetails, headers);
  conv.ask(speechText);
}})

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

handleConfirmationChannelResolution(app, {intentName: 'Leave Channel Intent Slot Collection', confirmationLogic: ({conv, channelDetails}) => {
  conv.ask(i18n.__(`LEAVE_CHANNEL.CONFIRM_INTENT`, { roomname: channelDetails.name }))
  conv.data.channelDetails = channelDetails
  conv.contexts.set('leave_channel', 1, {channelname: channelDetails.name})
}})

handleExecutionChannelResolution(app, {intentName: 'Leave Channel Intent Confirmed', executionLogic: async ({conv, headers}) => {
  const speechText = await helperFunctions.leaveChannel(conv.data.channelDetails, headers);
  conv.ask(speechText);
}})

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

handleConfirmationChannelResolution(app, {intentName: 'Rename Room Intent Slot Collection', confirmationLogic: ({conv, params, channelDetails}) => {
  conv.ask(i18n.__('RENAME_ROOM.CONFIRM_INTENT', { roomname: channelDetails.name, newname: helperFunctions.replaceWhitespacesFunc(params.newname) }))
  conv.data.channelDetails = channelDetails
  conv.contexts.set('rename_room', 1, {channelname: channelDetails.name, newname: params.newname})
}})

handleExecutionChannelResolution(app, {intentName: 'Rename Room Intent Confirmed', executionLogic: async ({conv, params, headers}) => {
  const newname = helperFunctions.replaceWhitespacesFunc(params.newname);
  const speechText = await helperFunctions.channelRename(conv.data.channelDetails, newname, headers);
  conv.ask(speechText);
}})

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

handleConfirmationChannelResolution(app, {intentName: 'Unarchive Channel Intent Slot Collection', confirmationLogic: ({conv, channelDetails}) => {
  conv.ask(i18n.__(`UNARCHIVE_CHANNEL.CONFIRM_INTENT`, { roomname: channelDetails.name }))
  conv.data.channelDetails = channelDetails
  conv.contexts.set('unarchive_channel', 1, {channelname: channelDetails.name})
}})

handleExecutionChannelResolution(app, {intentName: 'Unarchive Channel Intent Confirmed', executionLogic: async ({conv, headers}) => {
  const speechText = await helperFunctions.unarchiveChannel(conv.data.channelDetails, headers);
  conv.ask(speechText);
}})

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

handleConfirmationChannelResolution(app, {intentName: 'Change Topic Intent Slot Collection', confirmationLogic: ({conv, params, channelDetails}) => {
  conv.ask(i18n.__(`CHANNEL_TOPIC.CONFIRM_INTENT`, { roomname: channelDetails.name, topic: params.topic }))
  conv.data.channelDetails = channelDetails
  conv.contexts.set('change_topic', 1, {channelname: channelDetails.name, topic: params.topic})
}})

handleExecutionChannelResolution(app, {intentName: 'Change Topic Intent Confirmed', executionLogic: async ({conv, params, headers}) => {
  const speechText = await helperFunctions.channelTopic(conv.data.channelDetails, params.topic, headers);
  conv.ask(speechText);
}})

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

handleConfirmationChannelResolution(app, {intentName: 'Change Description Intent Slot Collection', confirmationLogic: ({conv, params, channelDetails}) => {
  conv.ask(i18n.__(`CHANNEL_DESCRIPTION.CONFIRM_INTENT`, { roomname: channelDetails.name, description: params.description }))
  conv.data.channelDetails = channelDetails
  conv.contexts.set('change_description', 1, {channelname: channelDetails.name, description: params.description})
}})

handleExecutionChannelResolution(app, {intentName: 'Change Description Intent Confirmed', executionLogic: async ({conv, params, headers}) => {
  const speechText = await helperFunctions.channelDescription(conv.data.channelDetails, params.description, headers);
  conv.ask(speechText);
}})

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

app.intent('Set Announcement Intent Slot Collection', async (conv, params) => {
  const accessToken = conv.user.access.token;
  const headers = await helperFunctions.login(accessToken);
  let channelname = params.channelname;
  const announcement = params.announcement;

  var locale = conv.user.locale;
  if(locale === 'hi-IN') {
    channelname = await helperFunctions.hinditranslate(channelname);
  }

  const channelDetails = await helperFunctions.resolveChannelname(channelname, headers);

  if(channelDetails) {
    conv.ask(i18n.__('CHANNEL_ANNOUNCEMENT.CONFIRM_INTENT', announcement, channelDetails.name))
    conv.data.channelDetails = channelDetails
    conv.contexts.set('set_announcement', 1, {channelname, announcement})
  } else {
    conv.ask(i18n.__('CHANNEL_ANNOUNCEMENT.NO_ROOM', channelname))
    conv.ask(i18n.__('GENERIC_REPROMPT'))
  }
})

app.intent('Set Announcement Intent Confirmed', async (conv, params) => {

  var accessToken = conv.user.access.token;
  const headers = await helperFunctions.login(accessToken);

  const speechText = await helperFunctions.setAnnouncement(conv.data.channelDetails, params.announcement, headers);
  conv.ask(speechText);
  conv.ask(i18n.__('GENERIC_REPROMPT'))
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

app.intent('Post DM Message Intent Slot Collection', async (conv, params) => {
  try{
    const accessToken = conv.user.access.token;
    const headers = await helperFunctions.login(accessToken);
    let username = params.username;
    const message = params.message;
  
    var locale = conv.user.locale;
    if(locale === 'hi-IN') {
      username = await helperFunctions.hinditranslate(username);
    }
  
    const userDetails = await helperFunctions.resolveUsername(username, headers);
  
    if(userDetails) {
      conv.ask(i18n.__('POST_MESSAGE.CONFIRM_DM_INTENT', message, userDetails.name))
      conv.data.userDetails = userDetails
      conv.contexts.set('post_dm_message', 1, {username, message})
      conv.ask(new Suggestions(['yes', 'no']))
    } else {
      conv.ask(i18n.__('POST_MESSAGE.NO_USER', username))
      conv.ask(i18n.__('GENERIC_REPROMPT'))
      conv.ask(new Suggestions(['post message discussion', 'post message to room']))
    }
  }catch(err){
    conv.ask(i18n.__('GENERIC_REPROMPT'))
    conv.ask(i18n.__('SOMETHING_WENT_WRONG'))
    conv.ask(new Suggestions(['post message discussion', 'post message to room']))
  }

})

app.intent('Post DM Message Intent Confirmed', async (conv, params) => {
  try{
    var accessToken = conv.user.access.token;
    var message = params.message;
    const userDetails = conv.data.userDetails
    const headers = await helperFunctions.login(accessToken);
    const speechText = await helperFunctions.postDirectMessage(message, userDetails.rid, headers);
    conv.ask(speechText);
    conv.ask(i18n.__('GENERIC_REPROMPT'))
    conv.ask(new Suggestions(['post message discussion', 'post message to room']))
  }catch(err){
    conv.ask(i18n.__('GENERIC_REPROMPT'))
    conv.ask(i18n.__('SOMETHING_WENT_WRONG'))
    conv.ask(new Suggestions(['post message discussion', 'post message to room']))
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
  

handleExecutionChannelResolution(app, {intentName: 'Change Status Intent Confirmed', executionLogic: async ({conv, params, headers}) => {
  const speechText = await helperFunctions.setStatus(params.status, headers)
  conv.ask(speechText);
}})

handleExecutionChannelResolution(app, {intentName: 'Create Channel Intent Confirmed', executionLogic: async ({conv, params, headers}) => {
  let channelname = helperFunctions.replaceWhitespacesFunc(params.channelname);
  const speechText = await helperFunctions.createChannel(channelname, headers);
  conv.ask(speechText);
}})

handleExecutionChannelResolution(app, {intentName: 'Create Group Intent Confirmed', executionLogic: async ({conv, params, headers}) => {
  let channelname = helperFunctions.replaceWhitespacesFunc(params.channelname);
  const speechText = await helperFunctions.createGroup(channelname, headers);
  conv.ask(speechText);
}})

app.intent('Denied Intent', (conv) => {
  const contexts = [
    'change_description',
    'change_topic',
    'rename_room',
    'archive_channel',
    'unarchive_channel',
    'change_status',
    'add_leader',
    'add_moderator',
    'add_owner',
    'invite_user',
    'kick_user',
    'leave_channel',
    'delete_channel',
    'remove_owner',
    'remove_moderator',
    'remove_leader',
    'change_status',
    'post_dm_message',
    'post_message',
    'set_announcement',
    'post_discussion_message',
    'create_channel',
    'create_group'
  ]

  let inputContexts = Object.keys(conv.contexts.input)

  if(helperFunctions.hasCommonElement(contexts, inputContexts)){
    conv.ask(i18n.__('GENERIC_DENIED_MESSAGE'))
  } else {
    conv.close(i18n.__('GOODBYE.MESSAGE'))
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