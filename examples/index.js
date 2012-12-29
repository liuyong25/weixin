var express = require('express');
var http = require('http')
var path = require('path');

var app = express();
app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

//注册微信公众平台回调接口
var weixin = require('weixin') || require('../index.js') ;
app.all('/weixin', weixin.getHandler('your-private-token',function(req, res, next){
  var recieveMsg = req.mpRecieveMessage;
  var replyMsg = req.mpReplyMessage;
  var isImage = recieveMsg.content?recieveMsg.content.toString().match(/^pic(\d?)$/):null
  if(isImage){
    var count = isImage[1] || 1
    for(var i=0;i<count;i++){
      if(i==0) req.mpReplyMessage.articles = []
      req.mpReplyMessage.articles.push({
        title: '这是第' + (i+1) + '条图文消息标题',
        description: '这是第' + (i+1) + '条图文消息的内容:asssssssssssssssssssssssssssssssssssssssssssssdsff',
        picUrl: 'http://agile_gz.cloudfoundry.com/weixin/' + (i+1),
        url: 'http://wap.soso.com/sweb/search.jsp?key=%E5%BE%AE%E4%BF%A1&sid=ATxtK4kzZMBWcL7cO-7hGpAz&pno=' + (i+1)
      })
    }
  }else{
    console.log('回复文本消息')
    req.mpReplyMessage.content = '这是对消息「'+recieveMsg.content+'」的回复。'
  }
  next();
}));

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
