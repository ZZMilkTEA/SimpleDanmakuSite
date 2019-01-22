/*
The MIT License (MIT)
Copyright (c) luojia@luojia.me
*/
'use strict';
//config
var Config={
	set:function(name,value){
		localStorage.setItem('NyapConfig:'+name,value);
	},
	get:function(name){
		localStorage.getItem('NyapConfig:'+name);
	},
	delete:function(name){
		localStorage.removeItem('NyapConfig:'+name);
	}
}

var randCharList='1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
function randomPageID(){
	return '||||||||||||||||'.replace(/\|/g,function(){return randCharList[(Math.random()*(randCharList.length-1)+0.5)|0]});
}

if(!window.upid){//定义upid
	window.upid=randomPageID();
}

if(touchMode)window.NyaP=NyaPTouch;


var pageSettings={
	withoutDanmaku:getSearchArg('withoutDanmaku')==1,
}


//初始化播放器
var tmp,opt={
	volume:(tmp=Config.get('volume'))!=undefined?tmp:1,
	enableDanmaku:!pageSettings.withoutDanmaku,
	danmakuModuleArg:{
		TextDanmaku:{
			//defaultStyle:{},
			options:{
				allowLines:true,
				screenLimit:0,
			},
		}
	},
	danmakuSend:function(d,callback){
		var data={
			vid:vid,
			content:d.text,
			mode:d.mode,
			time:d.time,
			color:d.color,
			size:d.size
		};
		console.log(d);
		var d2={_:'text',text:d.text,time:d.time,mode:d.mode,style:{fontSize:d.size},date:Date.now(),did:null};
		if(d.color)d2.style.color=d.color;
		callback(d2);
		SAPI.getAccess(function(access) {
			SAPI.get('danmaku',{opt:'add',value:data,access:access},function(err,r){
				console.log(err,r);
				if(err){
					console.error(err);
					return;
				}
				d2.did=Number(r);
			});
		});
	},
	playerFrame:document.body,
};
if(playerOpt){
	playerOpt=base64.decode(playerOpt);
	try{
		playerOpt=JSON.parse(playerOpt);
	}catch(e){
		alert('播放器配置错误');
	}
	if(typeof playerOpt === 'object')
	for(var sopt in playerOpt){
		opt[sopt]=playerOpt[sopt];
	}
}
if(NyaP_plugins){
	opt.plugins||(opt.plugins=[]);
	NyaP_plugins.forEach(function(p){opt.plugins.unshift(p);});
}


var NP=new NyaP(opt);
NP.player.focus();

if(self != top){//在iframe中，向父窗口发送信号
	NP.globalHandle=function(e,arg){
		window.parent.postMessage({
			type:'playerEvent',
			name:e,
			arg:arg,
			upid:upid,
		},'*');
	}
	window.addEventListener("message",function(msg){
		var data=msg.data;
		if(typeof data =='object'&&data!=null){
			switch(data.type){
				case 'playerControl':{
					playerControl(data.name,data.arg);
				}
			}
		}
	});
}
function playerControl(name,arg){
}

function getSearchArg(name){
	return SXHR.parseQuery(document.location.search)[name];
}
function getHashArg(name){
	return SXHR.parseQuery(document.location.hash)[name];
}

var vid=getSearchArg('id'),
	danmakuLoaded=false;

SAPI.refreshAccess(accessCallback);

function accessCallback(r){
	if(!r){
		alert('请刷新重试');
		return;
	}
	getVideo();
	pageSettings.withoutDanmaku||getDanmaku();
}

//获取视频信息
function getVideo(){
	var _ligva=NP.loadingInfo('获取视频地址',true);
	NP.video.addEventListener('error',function(e){
		console.error(e)
		_ligva.append('error:'+e.message);
	});
	SAPI.getAccess(function(access){
		SAPI.get('video',{opt:'video',vid:vid,access:access},function(err,r){
			if(err)return;
			document.title=r.title;
			if(!r.address || !r.address.length){
				_ligva.append('无地址');
				return;
			}
			_ligva.append(NP.opt.loadingInfo.doneText);
			var addr=r.address[((r.address.length-1)*Math.random()+0.5)|0];
			if(danmakuLoaded){
				loadVideo(addr.addr);
			}else{
				setTimeout(function(){
					loadVideo(addr.addr);
				},600);
			}
		});
	});
}
function loadVideo(address){
	NP.loadingInfo(NP.i18n._('Loading video'));
	NP.src=address;
}


//获取弹幕
function getDanmaku(){
	var _ligd=NP.loadingInfo('获取弹幕',true);
	SAPI.getAccess(function(access){
		SAPI.get('danmaku',{opt:'get',vid:vid,access:access},function(err,r){
			if(err)return;
			var list=[];
			r.forEach(function(d){
				list.push({
					_:'text',
					text:d.c,
					time:d.t,
					mode:d.m,
					style:{
						fontSize:d.s,
						color:(d.co||'fff')
					},
					date:d.d,
					did:d.did
				});
			});
			NP.Danmaku.loadList(list);
			_ligd.append(NP.opt.loadingInfo.doneText);
			danmakuLoaded=true;
		});	
	});
}
