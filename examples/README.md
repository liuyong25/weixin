# 微信公众平台API - 使用示例

## 使用步骤:
1. 注册微信公众平台: http://mp.weixin.qq.com/cgi-bin/loginpage?t=wxm-login&lang=zh_CN

2. 填写接口消息信息: http://mp.weixin.qq.com/cgi-bin/callbackprofile?t=wxm-callbackapi&type=info&lang=zh_CN
2.1 接口URL: 本示例为 http://you-server-ip/weixin
2.2 接口token: 本示例为your-private-token
2.3 需部署本程序后,才能保存,因为需要校验GET
2.4 测试校验:http://localhost:3000/weixin?signature=8caaaad66fd1812b35a696ecc800ee9123ecb5ea&timestamp=1356683495&nonce=1356736167&echostr=random-string

3. 本地测试方法
3.1 安装RESTClient: https://code.google.com/p/rest-client/downloads/detail?name=restclient-ui-3.1-jar-with-dependencies.jar&can=2&q=
3.2 执行: java -jar restclient-ui-3.1-jar-with-dependencies.jar
3.3 URL填: http://localhost:3000/weixin?signature=3cb20283ebcfef44fb03dc9c79923071a7dc9360&timestamp=1356683495&nonce=1356736167&echostr=xxx
3.4 HTTP METHOD选: POST
3.5 BODY选String body , text/xml; charset=UTF-8, 内容为:
 <xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>1348831860</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[pic2]]></Content></xml> 

 ## 备注:
 1. 微信的平台调试很不友好,没有出错日志,只能自己试验了~
 2. 图文消息,地址需要通过申请白名单.