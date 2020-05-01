$(document).ready(function () {

  function PubNub() {
    
    this.publishKey = 'pub-c-cad65686-bd3c-4dc7-8789-3948635af779';//offical
    this.subscribeKey = 'sub-c-2fdccaf0-0704-11ea-a6bf-b207d7d0b791';//offical
    
    this.subscriptions = localStorage["pn-subscriptions"]||[];

    if(typeof this.subscriptions == "string") {
      this.subscriptions = this.subscriptions.split(",");
    }
    this.subscriptions = $.unique(this.subscriptions);
  }

  PubNub.prototype.connect = function(username) {
    this.username = username;
    this.connection = PUBNUB.init({
      publish_key: this.publishKey,
      subscribe_key: this.subscribeKey,
      uuid: this.username,
      ssl: true
    });
  };

  PubNub.prototype.addSubscription = function(channel) {
    this.subscriptions.push(channel);
    this.subscriptions = $.unique(this.subscriptions);
    this.subscriptions = Array.from(new Set(this.subscriptions));
  };
  
  PubNub.prototype.saveSubscriptions = function() {
    localStorage["pn-subscriptions"] = this.subscriptions;
  };
  
  PubNub.prototype.removeSubscription = function(channel) {
    if (this.subscriptions.indexOf(channel) !== -1) {
      this.subscriptions.splice(this.subscriptions.indexOf(channel), 1);
    }
    this.saveSubscriptions();
  };

  PubNub.prototype.subscribe = function(options) {
    this.connection.subscribe.apply(this.connection, arguments);
    this.addSubscription(options.channel);
    this.saveSubscriptions();
  };

  PubNub.prototype.unsubscribe = function(options) {
    this.connection.unsubscribe.apply(this.connection, arguments);
  };

  PubNub.prototype.publish = function() {
    this.connection.publish.apply(this.connection, arguments);
  };

  PubNub.prototype.history = function() {
    this.connection.history.apply(this.connection, arguments);
  };
  
  var chatChannel = '',
      username = '',
      users = [],
      passwordInput = $('#password'),
      usernameInput = $('#username'),
      chatRoomName = $("#chatRoomName"),
      chatButton = $("#startChatButton"),
      setPassword = $("#setPassword"),
      homePage = $("#homePage"),
      chatLIST = $("#ChatList"),
      newChatButton = $("#newChatButton"),
      newChat = $("#newChat"),
      RoomName = $("#RoomName"),
      chatListEl = $("#chatList"),
      sendMessageButton = $("#sendMessageButton"),
      backButton = $("#backButton"),
      messageList = $("#messageList"),
      messageContent = $("#messageContent"),
      userList = $("#userList"),
      pubnub = new PubNub(),
      isBlurred = false,
      timerId = -1,
      pages = {
        home: $("#homePage"),
        chatList: $("#chatListPage"),
        chat: $("#chatPage"),
        delete: $("#delete")
      };

  // Blur tracking
  $(window).on('blur', function () {
    isBlurred = true;
  }).on("focus", function () {
    isBlurred = false;
    clearInterval(timerId);
    document.title =" Messenger";
  });

  // Request permission for desktop notifications.
  Notification.requestPermission().then(function(result) {
  
  });
  function askNotificationPermission() {
  // function to actually ask the permissions
  function handlePermission(permission) {
    // Whatever the user answers, we make sure Chrome stores the information
    if(!('permission' in Notification)) {
      Notification.permission = permission;
    }

    // set the button to shown or hidden, depending on what the user answers
    if(Notification.permission === 'denied' || Notification.permission === 'default') {
      notificationBtn.style.display = 'block';
      
    } else {
      notificationBtn.style.display = 'none';
    }
  }

  // Let's check if the browser supports notifications
  if (!('Notification' in window)) {
    console.log("This browser does not support notifications.");
  } else {
    if(checkNotificationPromise()) {
      Notification.requestPermission()
      .then((permission) => {
        handlePermission(permission);
      });
    } else {
      Notification.requestPermission(function(permission) {
        handlePermission(permission);
      });
    }
  }
}

  ////////
  // Home View
  /////
  function HomeView() {
     if (localStorage.username) {
       usernameInput.val(localStorage.username);
     }
    if (localStorage.password) {
      passwordInput.val(localStorage.password);
    }
    passwordInput.off('keydown');
    passwordInput.bind('keydown', function (event) {
      if((event.keyCode || event.charCode) !== 13) return true;
      chatButton.click();
      return false;
    });
    
    //setting password clicking function
    setPassword.click(function (event) {
      if(passwordInput.val() !== ''){
        password = passwordInput.val();
        localStorage.password=password;
      }
      if(usernameInput.val() !== '') {
        username = usernameInput.val();
        localStorage.username= username;
      }
    });
      homePage.off('keydown');
      homePage.bind('keydown', function (event) {
        if(passwordInput.val()==="3501"){
        if((event.keyCode || event.charCode) != 191) return true;
          var show;
            show = document.getElementById('setPassword');
            show.style.visibility = 'visible';
          return false;
        }
      });
      
    //login clicking button function
    chatButton.click(function (event) {
      if(passwordInput.val() !== ''){
        password = localStorage.password;
        localStorage.password=password;
      }
      if(usernameInput.val() !== '') {
        username=localStorage.username;
        localStorage.username=username;
      }
      if(localStorage.username===usernameInput.val() && localStorage.password===passwordInput.val()){
          pubnub.connect(username);
          $.mobile.changePage(pages.chat);
          chatChannel = " ";
      }
    });
  }

  /////
  // Chat List View
  ///////
  
  function ChatListView(event, data) {
    for(var i = 0; i !=pubnub.subscriptions.length; i++) {
      pubnub.subscribe({
      channel:pubnub.subscriptions[i],
      callback: function(message, env, channel){
        var colon = message.text.indexOf(":");
        var user = message.text.slice(0,colon);
        var txt = message.text.slice(colon+1);
     
        const title = "New Message";
        const options = {
        body: channel+"\n"+user+" said "+txt,
        icon: 'favicon.png'
      };
        var blocked = [];
        if (window.Notification && Notification.permission === "granted") {
          new Notification(title,options);
        }
      }
    });
    }
  }

  function ChatPageList(event,data){
    chatLIST.empty();
    for(var i = 0; i !=pubnub.subscriptions.length; i++) {
      
      var ChatName = pubnub.subscriptions[i],
          ChatEl = $("<li><a href='#chatPage' data-channel-name='" + ChatName + "'>"
            + ChatName
            + "</a><a href='#delete' data-rel='dialog' data-channel-name='" + ChatName + "'></a></li>");
    
      chatLIST.append(ChatEl);
      chatLIST.listview('refresh');
    };
    
    newChat.off('click');
    newChat.click(function (event) {
      if(RoomName.val() !== '') {
        chatChannel = RoomName.val();

        $.mobile.changePage(pages.chat);
      }
    });
  }


  //////
  // Delete Chat View
  ///////
  function DeleteChatView(event, data) {
    if (data.options && data.options.link) {
      var channelName = data.options.link.attr('data-channel-name'),
          deleteButton = pages.delete.find("#deleteButton");

      deleteButton.unbind('click');
      deleteButton.click(function (event) {
        pubnub.removeSubscription(channelName);
        console.log(pages.delete.children());
        pages.delete.find('[data-rel="back"]').click();
      });
    }
  }
  
  /////
  // Chatting View
  //////
  function ChatView(event, data) {
    var self = this;
    var d = new Date();
    var n;
    var m;
    var s = d.toLocaleString();
    
    if (data.options && data.options.link) {
      chatChannel = data.options.link.attr('data-channel-name');
    }
    
    users = [];
    messageList.empty();
    userList.empty();

     pubnub.unsubscribe({
       channel: chatChannel
    
    });
    
    pubnub.subscribe({
      channel: chatChannel,
      message: self.handleMessage,
        
      presence: function( message, env, channel ) {
        if (message.action == "join"&&isBlurred === false) {
          users.push(message.uuid);
          userList.append("<li data-username='"+message.uuid + "'>" + message.uuid+"</li>");
        } else {
          if(message.action == 'leave'){
            users.splice(users.indexOf(message.uuid), 1);
            userList.find('[data-username="' + message.uuid + '"]').remove();
          }
        }

        userList.listview('refresh');
        
      }
    });
  
    pubnub.history({
      channel: chatChannel,
      limit: 100
    }, function (messages) {
      messages = messages[0];
      messages = messages || [];

      for(var i = 0; i < messages.length; i++) {
        self.handleMessage(messages[i], false);
      }

      $(document).scrollTop($(document).height());
    });

    // Change the title to the chat channel.
    pages.chat.find("h1:first").text(chatChannel);
    messageContent.off('keydown');
    messageContent.bind('keydown', function (event) {
      if((event.keyCode || event.charCode) !== 13) return true;
      sendMessageButton.click();
      return false;
    });
    
    sendMessageButton.off('click');
    sendMessageButton.click(function (event) {
      var message = messageContent.val();
      self = this;
      d = new Date();
      s = d.toLocaleString();
      if(s.includes("AM")){
 	      m = d.getMinutes()+" "+"AM";
      }else{
  	    m = d.getMinutes()+" "+"PM";
      }
      if(d.getMinutes()<10){
  	    n =  d.getHours()+":"+"0"+m;
      }else{
  	    n =  d.getHours()+":"+m;
      }
      time=d.getMonth()+1+"/"+d.getDate()+", "+n;
      if(message !== "") {
        pubnub.publish({
          channel: chatChannel,
          message: {
            username: time,
            text: username+": "+message
          }
        });
        }
      messageContent.val("");
    });
    
    backButton.off('click');
    backButton.click(function (event) {
      pubnub.unsubscribe({
        channel: chatChannel
      });
    });
    };

function send(mess){
  pubnub.publish({
    channel: chatChannel,
      message: {
          username: time,
          text: username+": "+mess
        }
  });
}
  // This handles appending new messages to our chat list.
  ChatView.prototype.handleMessage = function (message, animate) {
    if (animate !== false){ animate = true;}

    var messageEl = $("<li class='message' style='word-wrap: break-word;'>"+ "<span class='username'>"
      +message.username+" "+ "</span>"
      +message.text
      
      +"</li>");
    messageList.append(messageEl);
    messageList.listview('refresh');
    
    // Scroll to bottom of page
    if (animate === true) {
      $("html, body").animate({ scrollTop: $(document).height() - $(window).height() }, 'fast');
    }
   
    if (isBlurred) {
      // Flash title if blurred
         
      // Notification handling
      colon = message.text.indexOf(":");
      user = message.text.slice(0,colon);
      txt = message.text.slice(colon+1);
     
      const title = "New Message";
      const options = {
      body: chatChannel+"\n"+user+" said "+txt,
      icon: 'favicon.png'
    };
      var blocked = [];
      if (window.Notification && Notification.permission === "granted") {
        new Notification(title,options);
      }
    }
  };

  // Initially start off on the home page.
  $.mobile.changePage(pages.home);
  var currentView = new HomeView();

  // It takes the page destination and creates a view based on what
  // page the user is navigating to.
  $(document).bind("pagechange", function (event, data) {
    if (data.toPage[0] == pages.chatList[0]) {
      currentView = new ChatListView(event, data);
      $.mobile.changePage(pages.chat);
    } else if (data.toPage[0] == pages.delete[0]) {
      currentView = new DeleteChatView(event, data);
    } else if (data.toPage[0] == pages.chat[0]) {
      currentView = new ChatView(event, data);
      new ChatPageList(event,data);
    }
  });
});
