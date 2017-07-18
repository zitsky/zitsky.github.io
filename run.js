$(function(){
    console.log("init peer js");
    var $login=$("#login");
    var $chat=$("#chat");
    var $loading=$("#loading");
    var $connect=$("#login .connect");
    $connect.hide();
    var $create=$("#login .create_server");
    $create.hide();
    
    $login.show();
    $chat.hide();
    $loading.fadeOut();

    var peer = null;
    var clients=[];
    var messages=[];
    var MyId=null;
    var MyLogin='';
    var MyConnect=null;

    var Message=function(type,value,from) {
        return {
            type:type,
            text:value,
            from:from
        };
    };

    var hash=window.location.search.slice(1);
    var isServer=0;
    if(hash.length) {
        $connect.show();
    }else{
        $create.show();
    }

    var RenderBalloon=function(type,from,content,date) {
        return '<div class="ballon '+((from==MyLogin)?"me":"")+'">'+
            '<div class="content">'+
                '<div class="message">'+
                    content
                '</div>'+
                '<h4>'+from+' <small>'+date+'</small></h4>'+
            '</div>'+
        '</div>';
    }

    var AddMessage=function(msg)
    {
        console.log("add msg",msg);
        $(".messages").append(RenderBalloon("message",msg.login||'',msg.content||'',msg.date||''));
    }

    var onServerRecv=function(data){
        console.log("=>server::",data);
        switch(data.type) {
            case "connect":
            AddMessage({content:'подключился '+data.login});
            break;
            case "ping":
            break;
            case "msg":
            AddMessage(data.msg);
            $.each(clients,function(i,conn){
                conn.send({type:'msg',msg:data.msg});
            });
            break;
        }
    };

    var onClientRecv=function(data) {
        console.log("client",data);
        switch(data.type) {
            case "who":
                AddMessage({content:'Выполнено подключение к серверу'});
                MyConnect.send({
                    type:'connect',
                    login:MyLogin
                });
            break;
            case "ping":
            break;
            case "msg":
            AddMessage(data.msg);
            break;
        }
    }

    var prepareChat=function()
    {
        $chat.find(".top h2").text("Chat: "+myId+", send this link to firend to start talk: ");
        $chat.find(".top p").text(window.location.href+"?"+myId);
        $chat.show();
        $login.fadeOut();
    };

    $create.on("click",function(){
        MyLogin=$("#login input").val();
        if(!MyLogin.length)
            return alert("Enter login!");
        $(this).attr("disabled","disabled");
        peer=new Peer({key: 'u4sivw1wxwrvn29',secure:true});
        peer.on('open', function(id) {
            isServer=true;
            myId=id;
            console.log("my-id",id);
            prepareChat();
            AddMessage({content:'Создан чат, ожидаем собеседников'});
            peer.on('connection', function(conn) { 
                console.log("connected client");
                clients.push(conn);
                conn.on("data",onServerRecv);
                conn.send({type:'ping'});
                conn.send({
                    type:'who'
                });
            });
        });
        
    });

    $connect.on("click",function(){
        MyLogin=$("#login input").val();
        if(!MyLogin.length)
            return alert("Enter login!");
        $(this).attr("disabled","disabled");
        peer=new Peer({key: 'u4sivw1wxwrvn29',secure:true});
        myId=hash;
        MyConnect=peer.connect(hash);
        MyConnect.on("data",onClientRecv);
        MyConnect.on("open",function(){
            isServer=false;
            console.log("test",hash);
            MyConnect.send({type:'ping'});
            MyConnect.send({
                    type:'connect',
                    login:MyLogin
                });
            prepareChat();
        });        
    });

    var sendMessageD=function() {
        var msg=$(".send-line input").val();
        if(!msg.length)
            return false;
        if(isServer) {
            $.each(clients,function(i,conn){
                conn.send({type:'msg',msg:{
                    content:msg,
                    login:MyLogin,
                    date:Date.now().toString()
                }});
            });
        }else {
            MyConnect.send({type:'msg',msg:{
                content:msg,
                login:MyLogin,
                date:Date.now().toString()
            }});
        }
        $(".send-line input").val("");
        return false;

    };

    $(".send-line input").on("keydown",function(e){
        if(e.keyCode=='13')
            sendMessageD();
    });

    $(".send-line button").on("click",sendMessageD);
/*
    
    peer.on('open', function(id) {
        console.log('My peer ID is: ' + id);
        var conn = peer.connect(id);

        conn.on('open', function() {
            console.log("opened");
            conn.on('data', function(data) {
                console.log('Received', data);
            });

            // Send messages
            conn.send('Hello!');


        });
    });
*/
    
});