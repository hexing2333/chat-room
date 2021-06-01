function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return decodeURIComponent(r[2]); return null;
}
var uname = getQueryString("name");
$("#name1").html(uname);
$("#name2").html(uname);
$("#share").click(function () {
    var sharecode = window.location.origin + "/login?uuid=" + getQueryString("uuid");
    $(".modal-body").html(sharecode);
})
$("#leavebtn").click(function(){
    if (navigator.userAgent.indexOf("MSIE") > 0) {
        if (navigator.userAgent.indexOf("MSIE 6.0") > 0) {
            window.opener = null; window.close();
        }
        else {
            window.open('', '_top'); window.top.close();
        }
    }
    else if (navigator.userAgent.indexOf("Firefox") > 0) {
        window.location.href = 'about:blank '; //火狐默认状态非window.open的页面window.close是无效的
        //window.history.go(-2);
    }
    else {
        window.opener = null;
        window.open('', '_self', '');
        window.location.href="about:blank";
        window.close();
    }
})

var socket = io()
//发送昵称给后端，并更改网页title
socket.emit("join", { name: uname, uuid: getQueryString("uuid") })
document.title = "聊天室"
socket.on("join", function (user) {
    if (user.uuid == getQueryString("uuid")) {
        addLine(`${user.name}加入了群聊,时间:${user.date}`)
    }
})

function showDeskTopNotice(title, msg) {
    var Notification = window.Notification || window.mozNotification || window.webkitNotification;
    if (Notification) {
        Notification.requestPermission(function (status) {
            //status默认值'default'等同于拒绝 'denied' 意味着用户不想要通知 'granted' 意味着用户同意启用通知
            if ("granted" != status) {
                return;
            } else {
                var tag = "sds" + Math.random();
                var notify = new Notification(
                    title,
                    {
                        dir: 'auto',
                        lang: 'zh-CN',
                        tag: tag,//实例化的notification的id
                        icon: 'https://admin.hms.xin/group1/M00/00/01/rB_YCFsY0OeAX6Q8AAAQvnJ6aNc109.ico',//通知的缩略图,//icon 支持ico、png、jpg、jpeg格式
                        body: msg //通知的具体内容

                    }
                );
                notify.onclick = function () {
                    //如果通知消息被点击,通知窗口将被激活
                    window.focus();
                },
                    notify.onerror = function () {
                        console.log("HTML5桌面消息出错！！！");
                    };
                notify.onshow = function () {
                    setTimeout(function () {
                        notify.close();
                    }, 5000)
                };
                notify.onclose = function () {
                    console.log("HTML5桌面消息关闭！！！");
                };
            }
        });
    } else {
        console.log("您的浏览器不支持桌面消息");
    }
};

//接收到服务器发来的message事件
socket.on("message", function (msg) {
    if (msg.uuid == getQueryString("uuid")) {
        if (msg.username == getQueryString("name")) {
             $('#chats-right-content').append("<div class='msgWrap'><div class='msgtxt' style='float:right'>"+msg.msg+"<div style='float: right;color:seagreen;'>--"+msg.username+"</div></div></div>");
        } else {
            showDeskTopNotice('来新消息了', msg.msg);
            $('#chats-right-content').append("<div class='msgWrap'><div class='msgtxt'>"+msg.msg+"<div style='float: right;color:seagreen;'>--"+msg.username+"</div></div></div>");
        }
    }
})

//收到离开聊天室广播后，显示消息
socket.on('broadcast_quit', function (data) {
    if (data.uuid == getQueryString("uuid")) {
        $('#chats-right-content').append($('<li style="margin-top:10px;">').text(`${data.username}离开了聊天室`));
    }
});

//获取用户列表
socket.on('getUserList', function (data) {
    var arr = [];
    data.firendList.length && data.firendList.map((item) => {
        if (item.uuid == getQueryString("uuid")) {
            arr.push(item)
        }
    })
    var str1 = '';
    $.each(arr, function (i, item) {
        str1 += ''
        str1 += "<div class='chatbox'><div class='intoflex first'><img src='https://cdn4.iconfinder.com/data/icons/hipster-items-cartoon/512/val71_14-512.png' class='medium-img'><div class='verticalflex'><div class='colorred'>" 
        + item.username + "</div></div></div><div class='intoflex spacebetween verysmallf'><div>"
        +new Date()+"</div></div></div>";
        $("#chats-left-content").html(str1)
    });
});

$("#send").click(function(){
    var msg = $("#chats-right-footer").val() //获取用户输入的信息
    console.log(msg);
    socket.emit("message", { msg: msg, username: getQueryString("name"), uuid: getQueryString("uuid") }) //将消息发送给服务器
    socket.emit("disconnect") //将消息发送给服务器
    $("#chats-right-footer").val("") //置空消息框
})


function addLine(msg) {
    $('#chats-right-content').append($('<li style="margin-top:10px;">').text(msg));
}