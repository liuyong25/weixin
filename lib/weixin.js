/*
 * 微信公众平台
 * @author TZ <atian25@qq.com>
 * http://mp.weixin.qq.com/cgi-bin/readtemplate?t=wxm-callbackapi-doc&lang=zh_CN
 * 1. 公众平台用户提交信息后，我们将以GET请求方式请求到填写的Url上,若此次GET请求原样返回echostr参数内容，则接入生效，否则接入失败。
 * 2. 当普通微信用户向公众账号发消息时，公众平台将POST该消息到填写的Url上（现支持文本消息以及地理位置消息）。
 * 注意：
 * 1.图文的服务器地址需要申请'可信网址'方可显示，http://mp.weixin.qq.com/cgi-bin/indexpage?t=wxm-systemi-p&type=info&lang=zh_CN
 */
var _ = require('underscore')._;

/**
 * 允许自定义的消息组装
 * 根据你的需求,覆盖req.mpReplyMessage中的content字段或articles数组.
 */
exports.getHandler = function(token,customHandler){
  exports.token = token;
  return [
    exports.auth,
    exports.recieveMsg,
    exports.unpackMsg,
    exports.packMsg,
    customHandler || function(req,res,next){next()},
    exports.replyMsg
  ];
}

/**
 * 校验该请求是否来源于微信
 * 加密流程：
 * 1.将token、timestamp、nonce三个参数进行字典序排序
 * 2.将三个参数字符串拼接成一个字符串进行sha1加密(key是开发者token)
 * 3.将加密后的字符串与signature对比,相同则表示该请求来源于微信。
 */
exports.auth = function(req, res, next){
  var token = exports.token;
  var signature = req.query.signature;
  var timestamp = req.query.timestamp;
  var nonce = req.query.nonce;
  var echostr = req.query.echostr;

  //校验
  var tmp = [token, timestamp, nonce].sort().join('');
  var tmpStr = require('crypto').createHash('sha1').update(tmp).digest('hex');
  var isAuth = (tmpStr==signature);
  if(isAuth){
    switch(req.route.method){
      //GET请求,原样返回echostr参数内容，则接入生效，否则接入失败。
      case 'get':
        console.log('微信接入鉴权',req.query);
        res.end(echostr);
        break;

      //处理用户消息
      case 'post':
        next();
        break;

      //不支持
      default:
        next(new Error('未支持的HTTP METHOD: ' + req.route.method));
    }
  }else{
    console.log('Auth Fail,need:[%s], but:[%s],params:%j.',tmpStr,signature,req.query);
    next(new Error('校验请求来源失败,加密签名不正确!!!'));
  }
};

/**
 * 接收微信发送过来的XML并解析成JSON,传递给下一层处理
 */
exports.recieveMsg = function(req, res, next){
  //if(req.headers['content-type'].indexOf('application/xml')!=-1 || req.headers['content-type'].indexOf('text/xml')!=-1){
  try{
    var xml = require("xml2js");
    var parser = new xml.Parser();
    var data = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) { data += chunk; });
    req.on('end', function(){
      parser.parseString(data, function(err, result){
        req.originXML = data;       //原始XML
        req.originJSON = result;    //解析后的原始JSON
        next();
      });
    });
  }catch(e){
    console.log('解析用户消息失败,',e)
    //console.log('req.headers不正确:',req.headers['content-type'],req.headers)
    next(new Error('解析用户消息失败,'+ e));
  }
}

/**
 * 把微信平台发送的信息进行分析,然后传递给下一层处理
 */
exports.unpackMsg = function(req, res, next){
  var originXML = req.originXML;
  var originJSON = req.originJSON.xml;

  req.mpRecieveMessage = {
    user: originJSON.FromUserName,      //普通用户的微信号
    sp: originJSON.ToUserName,          //公众帐号的微信号
    createTime: originJSON.CreateTime,  //消息发送时间
    msgType: originJSON.MsgType,        //消息类型,文本消息:text,地理位置消息:location,图片消息:image
    content: originJSON.Content,        //消息内容
    xPos: originJSON.Location_X,        //地理位置纬度
    yPos: originJSON.Location_Y,        //地理位置经度
    scale: originJSON.Scale,            //地图缩放大小
    label: originJSON.Label,            //地理位置信息
    imageUrl: originJSON.PicUrl,        //图片URL,需通过HTTP GET获取,
    originXML: originJSON,              //原始XML,
    originJSON: originXML               //解析后的原始JSON
  };

  console.log('收到来自',originJSON.FromUserName,'的消息,类型:',originJSON.MsgType);
  console.log(req.mpRecieveMessage)
  next();
}

/**
 * 组装要回复给微信的消息
 * 消息格式:
   {
      toUser: '',                                //普通用户的微信号,自动检测,不要覆盖
      fromUser: '',                              //你的微信号,自动检测,不要覆盖
      createTime: 1356696388132,                 //消息创建时间,timestamp数值格式,自动检测,不要覆盖
      msgType: 'text',                           //消息类型,文本消息:text,图文消息:news,自动检测,无需覆盖
      content: '这是消息内容',                   //消息内容,仅在消息类型为text时有效,大小限制在2048字节，字段为空为不合法请求
      funcFlag: 0,                               //星标标识,1为加星标
      articles: [{                               //图文列表,仅在消息类型为news时有效.
        title: '图文1标题',                      //图文标题
        description: '图文1内容',                //图文内容
        picUrl: 'http://your-server-image-path', //支持JPG、PNG格式，尺寸:第一条640*320,其他80*80,限制图片链接的域名需要与开发者填写的基本资料中的Url一致
        url: 'http://www.qq.com'                 //点击图文消息跳转链接
      },{
        title: '图文2标题',
        description: '图文2内容',
        picUrl: 'http://http://your-server-image-path2',  //小图
        url: 'http://www.qq.com' 
      }]
   }
 */
exports.packMsg = function(req, res, next){
  var recieveMsg = req.mpRecieveMessage;
  var msg = {
    toUser: recieveMsg.user,
    fromUser: recieveMsg.sp,
    createTime: new Date().getTime(),
    content: '已收到您发送的消息:「'+ recieveMsg.content +'」...',
    funcFlag: 0
  }
  req.mpReplyMessage = msg;
  next();
}

/**
 * 回复消息的XML模版
 */
exports.replyTpl = 
   '<xml>'
  +  '<ToUserName><![CDATA[<%=toUser%>]]></ToUserName>'
  +  '<FromUserName><![CDATA[<%=fromUser%>]]></FromUserName>'
  +  '<CreateTime><%=createTime%></CreateTime>'
  +  '<FuncFlag><%=funcFlag%></FuncFlag>'
  +  '<% if(typeof(articles)!=="undefined"){ %>'
  +    '<MsgType><![CDATA[news]]></MsgType>'
  +    '<ArticleCount><%=articles.length%></ArticleCount>'
  +    '<Articles>'
  +      '<% _.each(articles, function(item){ %>'
  +        '<item>'
  +          '<Title><![CDATA[<%=item.title%>]]></Title>'
  +          '<Description><![CDATA[<%=item.description%>]]></Description>'
  +          '<PicUrl><![CDATA[<%=item.picUrl%>]]></PicUrl>'
  +          '<Url><![CDATA[<%=item.url%>]]></Url>'
  +        '</item>'
  +      '<% }); %>'
  +    '</Articles>'
  +  '<% }else{ %>'
  +    '<MsgType><![CDATA[text]]></MsgType>'
  +    '<Content><![CDATA[<%=content%>]]></Content>'   
  +  '<% }%>'
  +'</xml>';

/**
 * 发送回复消息给微信(XML格式)
 */
exports.replyMsg = function(req, res, next){
  var replyObj = req.mpReplyMessage;
  console.log('xx')
  console.log(replyObj)
  res.set('Content-Type', 'application/xml');
  var replyMsg = _.template(exports.replyTpl)(replyObj);
  console.log('yy',replyMsg)
  res.end(replyMsg);

  console.log('回复:',replyObj);
  console.log('回复XML:',replyMsg)
}

