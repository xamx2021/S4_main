#!/usr/bin/node
"use strict";

/// What is it: This module contains implementation of a WEB server. Delivers client's files & performs signin/out procedures.



// Module config --------------
// Auth bypass:

//var Debug_login_bp_flag = false;
//var Debug_logout_bp_flag = true;
//var Debug_login_bp_flag = false;

var Debug_logout_bp_flag = false;
var Debug_login_bp_flag = true;

//-------------------------------





var SBCONF = require("./_config.js").SBCONF;
var WSCONF = require("./_config.js").WSCONF;
var Temp_token_file_PATH = require("./_config.js").Temp_token_file_PATH;
var Temp_plugin_file_PATH = require("./_config.js").Temp_plugin_file_PATH;
var ldb_file = require("./_config.js").db_access;

var sqlite3 = require('sqlite3').verbose();
var dlb = new sqlite3.Database(ldb_file);
 
function createDB()
{
	dlb.all( "	CREATE TABLE login (\
		account     INTEGER PRIMARY KEY ON CONFLICT REPLACE AUTOINCREMENT UNIQUE,\
		user          TEXT UNIQUE,\
		grp_HC_users TEXT,\
		password TEXT,\
		passwordH TEXT,\
		enabled    BOOLEAN DEFAULT true,\
		access   TEXT\
	);", 
		function(e,d)			{ 	 console.log('New access db created, ' + e);   		});
}
 

var token_list = {} 


//-----------------------------------------------------------[ BEGIN NEW token-interface (file) ]-------------------------------------------------------------------
var fs = require('fs'); 
var file_send_token = function(  username, token, access, account, account_vrf, key )  
		{
				// ver 2:
				token_list[token] = {};
				token_list[token].username = username;
				token_list[token].token = token;
				token_list[token].access = access;
				token_list[token].account = account;
				token_list[token].account_vrf = account_vrf;
				token_list[token].key = key;
				token_list[token].ttl = 10;
				token_list[token].logon = true;				
				try{		fs.writeFileSync(Temp_token_file_PATH, JSON.stringify(  token_list  ));	}catch(e){console.log('Warning #018885, cannot write  token list to file ');}
		}
//-----------------------------------------------------------[ END NEW token-interface (file) ]-------------------------------------------------------------------





//--------------------------------------------------------------------[ GUI web-server ]-------------------------------------------------------------------------
var http = require('http'); 
var https = require('https');
var fs = require('fs');
var __dirname = '';
var realm = 'Digest Authenticatoin';
var crypt = require('crypto');
crypt.toMD5 = function (data) {    return crypt.createHash('md5').update(data).digest('hex');	}

var sslOptions = {	 key: fs.readFileSync(WSCONF.sslKey),  	 cert: fs.readFileSync(WSCONF.sslCert),  	 passphrase: WSCONF.sslPassphrase		};


//=======================================================
function devel_login(request, response, that, cb)
{
	var username = 'ADMIN';
	dlb.all( "SELECT * FROM login WHERE user = '"+username+"';", 
	function(e,d)
		{ 	
				if(e){  console.log('DB ERROR 99324');  return send_LoginForm(response);	} //'Internal error 99324'
				if(d[0] === undefined){   console.log('Unknown user "' + username );   return send_LoginForm(response); }//  'Login failed'
				if(d[0].enabled !== 'true')  {  console.log('Login forbidden for user ' + username);  return send_LoginForm(response);  } // 'Login forbidden'
				
				if(d.length == 0) console.log('Client ['+username+']. Authentication failed');

				var password = d[0].password;	
				var access = d[0].access;
				var accountNo = d[0].account;	 
				var account_vrf = d[0].account_vrf;
				var digestAuthObject = {};
				//digestAuthObject.ha1 = crypt.toMD5(username + ':' + realm + ':' + password);
				//digestAuthObject.ha2 = crypt.toMD5(request.method + ':' + authInfo.uri);
				//digestAuthObject.response = crypt.toMD5([digestAuthObject.ha1, authInfo.nonce, authInfo.nc, authInfo.cnonce, authInfo.qop, digestAuthObject.ha2].join(':'));
				// any password:
				// if (authInfo.response !== digestAuthObject.response) return send_LoginForm(response);
				var key;
				var token = digestAuthObject.ha2;
		//		token = crypt.toMD5( new Buffer(Math.random().toString(), "binary") );						// This token is being to be sent via NOT secure socket during handshake routine to identify client.
				token = crypt.toMD5( new Buffer.alloc(Math.random(), "binary") );						// This token is being to be sent via NOT secure socket during handshake routine to identify client.
		//		key = crypt.toMD5( new Buffer(Math.random().toString(), "binary") );					// This secret key is used for AES. Not to be transmitted via socket anyway.
				key = crypt.toMD5( new Buffer.alloc(Math.random(), "binary") );					// This secret key is used for AES. Not to be transmitted via socket anyway.
						 				
			//	if(token_stream)	token_stream.send_token( username,  token,  access, accountNo, account_vrf, key );						
				file_send_token( username,  token,  access, accountNo, account_vrf, key );

				that.authorization_confirmed = true;
				that.token = token;
				response.token = token;//проверить надобно 
				response.key = key;
				that.key = key;
				
				console.log('Client ['+username+'] connected, new token= ', that.token, '.  Total registered users: '  );
			
				//redirecTo('/', response);
				sendFile('./webIncludes/webIndex.html', response);  
			});

}






//=======================================================
// Show digest login form. Looks ok, but needs more testing:
function send_LoginForm(response)
{
	if(Debug_logout_bp_flag)return;
   response.writeHead(401, { 'WWW-Authenticate': 'Digest realm="' + realm + '",qop="auth",nonce="' + Math.random() + '"' });
   response.end('User logout. \nPress F5 to reconnect.  ');   
}

//=======================================================
// Show login page + drop stored password:  Not so good:
function send_LoginPage(response)
{
   // sendFile('./webIncludes/webLogin.html', response, 401, undefined, buildHeaders(false, "html", true));
   fs.readFile( './webIncludes/webLogin.html', function (err, data)
   	{
	   try {
				if (err || data === undefined) {  response.writeHead(404);	response.end("404.");	  return;	}			
				var header = {};
				header['Content-Type'] = 'text/html; charset=utf-8';
				header['WWW-Authenticate'] = 'Digest realm="' + realm + '",qop="auth",nonce="' + Math.random() + '"';
				header['Cache-Control'] = 'public, max-age=3600';
				response.writeHead(401, header);
			//		response.writeHead(200, headers);
				response.end(data);
			}catch(e){console.log('Warning #440 ', e)}
   });
}

//=======================================================
// Redirect client to location. Works good:
function redirecTo(location, response) {	response.writeHead(302, {	'Location': location		});			response.end();			}




//=======================================================
// Auth. Works good:
function doAuth(request, response, that, cb)
{
	if( !request.headers.authorization )return;
	//if(that.authorization_confirmed ) return sendFile('./webIncludes/webIndex.html', response); 		// already signed in.
	
	var authInfo = {};
	authInfo = request.headers.authorization.replace(/^Digest /, '');
	var authenticationObj = {};
	authInfo.split(', ').forEach(function (d) {			d = d.split('=');	authenticationObj[d[0]] = d[1].replace(/"/g, '');		});
	authInfo = authenticationObj;	

	// Will not work with Digest :    var username = authInfo.username.toUpperCase();//	If it's a auth form, not a file  get request
	var username = authInfo.username;
	
	dlb.all( "SELECT * FROM login WHERE user = '"+username+"';", 
		function(e,d)
			{ 	
					if(e){  console.log('DB ERROR 99324');  return send_LoginForm(response);	} //'Internal error 99324'
					if(d[0] === undefined){   console.log('Unknown user "' + username );   return send_LoginForm(response); }//  'Login failed'
					if(d[0].enabled !== 'true')  {  console.log('Login forbidden for user ' + username);  return send_LoginForm(response);  } // 'Login forbidden'
					if(d.length == 0) console.log('Client ['+username+']. Authentication failed');
					// Selected user's data:
					var password = d[0].password;	
					//var passwordH = d[0].passwordH;	
					var access = d[0].access;
					var accountNo = d[0].account;
					var account_vrf = d[0].account_vrf;
					var digestAuthObject = {};
					digestAuthObject.ha1 = crypt.toMD5(username + ':' + realm + ':' + password);
					digestAuthObject.ha1 = password;
					digestAuthObject.ha2 = crypt.toMD5(request.method + ':' + authInfo.uri);
					digestAuthObject.response = crypt.toMD5([digestAuthObject.ha1, authInfo.nonce, authInfo.nc, authInfo.cnonce, authInfo.qop, digestAuthObject.ha2].join(':'));
					
					if (authInfo.response !== digestAuthObject.response) return send_LoginForm(response);
				
					var key;
					var token = digestAuthObject.ha2;
					// This token is being to be sent via NOT secure socket during handshake routine to identify client.
					token = crypt.toMD5( new Buffer.alloc()(Math.random(), "binary") );		
					// This secret key is used for AES. Not to be transmitted via socket anyway.		
					key = crypt.toMD5( new Buffer.alloc()(Math.random(), "binary") );
					token_stream.send_token( username,  token,  access, accountNo, account_vrf, key );
					that.authorization_confirmed = true;
					that.token = token;
					response.token = token;
					response.key = key;
					that.key = key;
					// DEBIG: console.log('Client ['+username+'] connected, new token= ', that.token);
					var size = 0;
					//		for (var i in client_array) if(client_array.hasOwnProperty(i)) size++;
					console.log('Client ['+username+'] connected, new token= ', that.token, '.  Total registered users: '  );
				//	console.log('Client ['+username+'] connected, new token= ', that.token, '.  Total registered users: ', size);
					///redirecTo('/', response);					 		
					sendFile('./webIncludes/webIndex.html', response);  
				});
}


//=======================================================
// Sends a file to the client. Works good:
 function sendFile(fpath, response, status)
{		
	status = status || 200;
	fpath = fpath.split('?')[0];
	
	fs.readFile( fpath, function (err, data)
	{
	  try{		
		if (err || data === undefined) {  response.writeHead(404);	response.end("404"); console.log('File missing: ',   fpath);	  return;	}			
		var headers = {};
		var dotIndex = fpath.lastIndexOf(".") + 1;
		var contentType =  fpath.substr(dotIndex, fpath.length - dotIndex);		
		  
		switch (contentType) 
		{
			case "html": 
			case "htm": 								
        							headers['Content-Type'] = 'text/html; charset=utf-8';
									data = ht_update(data);									
									data = data.toString().replace('%*S4_session_iv_value_*%', WSCONF.client_iv);
									data = data.toString().replace('%*S4_session_token_value_*%', response.token);
									data = data.toString().replace('%*S4_session_AES_key_value_*%', response.key);
									data = data.toString().replace('%*S4_api_port_value_*%', WSCONF.serverWebSockport);
									data = data.toString().replace('%*S4_api_wss_ws_value_*%', WSCONF.WebSockType);
									break;						
			case 'svg':	headers['Content-Type'] = 'image/svg+xml';	break;				
            case 'css': headers['Content-Type'] = 'text/css'; break;
            case 'gz': headers['Content-Encoding'] = "gzip"; break;
            case 'js': headers['Content-Type'] = "text/javascript";   break;
            case 'ico': headers['Content-Type'] = "image/ico";   break;
            case 'png': headers['Content-Type'] = "image/png";   break;
            case 'jpeg': headers['Content-Type'] = "image/jpeg";   break;
            case 'gif': headers['Content-Type'] = "image/gif";   break;
           
			//default:  {  response.writeHead(404);	response.end("Wrong format");	  return;	}	 
		}	
		response.writeHead(status, headers);
		response.end(data);
	  }catch(e){console.log('Warning #441 ', e)}
	});
}


		
function stringStartsWith (string, prefix) {    return string.slice(0, prefix.length) == prefix;}		
function stringEndsWith (string, suffix) {    return string.indexOf(suffix, string.length - suffix.length) !== -1;	};



//-------------------------============[ Express ]============-----------------


var express = require('express');
var server = express()
var cookieSession = require('cookie-session');
server.use(cookieSession({ secret: require("./_config.js").cookieSession_secret }));

 

//=======================================================
function websProc_new (request, response)
{

	/*if( CORE_NOT_CONNECTED )
	{
		response.writeHead(200);
		response.end('S4 core isn\'t running or overloaded, try reconnecting in fiew minutes. \nTry again later.');
		return;
	}
	*/

	var	ci = crypt.toMD5(request.socket.remoteAddress + '.' + request.headers["user-agent"]);
	if( !client_array[ ci ]){			client_array[ ci ] = {};	/*	thisClient.logSw = true; */  }
	var thisClient = client_array[ ci ];
	response.token = thisClient.token;
	response.key = thisClient.key;


	if( request.method == "POST" )
		{			
			if( request.headers.do_logout ){		thisClient.authorization_confirmed = false;		 return sendFile('./webIncludes/webLogin.html', response);		}
			if( thisClient.logSw )	if( request.headers.authorization ){		thisClient.logSw = false;		return doAuth(request, response, thisClient);		}
			if( request.headers.show_login_form ){		thisClient.authorization_confirmed = false;	thisClient.logSw = true;		return send_LoginForm(response);		}			
		}

		
	if( request.url === '/' && !thisClient.authorization_confirmed )return sendFile('./webIncludes/webLogin.html', response);		// good  default page
	


	var fpath = "./webIncludes" + request.url;			
	if(request.url === '/')	  fpath = './webIncludes/webIndex.html';	// URL index page:			
	sendFile(fpath, response);
}




//=======================================================
server.post('*', function(request, response, next) 
{
		//if(request.headers.cookie)
		//var	ci = crypt.toMD5(request.headers.cookie);	//request.socket.remoteAddress 
		//if( !client_array[ ci ]){			client_array[ ci ] = {};	/*	thisClient.logSw = true;	*/  }
		//var thisClient = client_array[ ci ];
 		if(!request.session.thisClient) request.session.thisClient = {};
		var thisClient = request.session.thisClient;

		if( request.method == "POST" ){	
			if( request.headers.do_logout ){		
				thisClient.authorization_confirmed = false;		
				return sendFile('./webIncludes/webLogin.html', response, 401);		
			}	
			if( request.headers.authorization ){	
					request.session.save();
					return doAuth(request, response, thisClient);		
				}
			else{		
				thisClient.authorization_confirmed = false;	
				request.session.save();		
				return send_LoginForm(response);		
			}			
		}
});



//=======================================================
server.get('*', function(request, response, next) 
{	
		if(!request.session.thisClient) request.session.thisClient = {};
		var thisClient = request.session.thisClient;

		// DEVEL: !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		if( Debug_login_bp_flag == true ) 
		{			
			console.log('----- Developer mode ------')
			if( request.url === '/' && !thisClient.authorization_confirmed ){ 	devel_login(request, response, thisClient, 0);		return;		}
			response.token = thisClient.token;
			response.key = thisClient.key;
			var fpath = "./webIncludes" + request.url;			
			if(request.url === '/')	  fpath = './webIncludes/webIndex.html';	// URL index page:			
			sendFile(fpath, response);  
			 return;
		}
		// DEVEL:  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

		if( request.url === '/' && !thisClient.authorization_confirmed )return sendFile('./webIncludes/webLogin.html', response);// good  default page
		response.token = thisClient.token;
		response.key = thisClient.key;
		var fpath = "./webIncludes" + request.url;			
		if(request.url === '/')	  fpath = './webIncludes/webIndex.html';	// URL index page:			
		sendFile(fpath, response);  
	//	next();
	//websProc_new (request, response)
	});
	
	
	
if(WSCONF.WebSockType === 'wss') https.createServer( sslOptions, server ).listen(WSCONF.serverHTTPSwebport, WSCONF.serverip);
if(WSCONF.WebSockType === 'ws') http.createServer( server ).listen(WSCONF.serverHTTPwebport, WSCONF.serverip);

if(WSCONF.WebSockType === 'ws')console.log('HTTP_WEBServer started at '+ WSCONF.serverip +':'+ WSCONF.serverHTTPwebport);
if(WSCONF.WebSockType === 'wss')console.log('HTTPS_WEBServer started at '+ WSCONF.serverip +':'+ WSCONF.serverHTTPSwebport);

 


// ===================[ S3 core BEGIN ]===============================

var inc_m = [];

//------------------- BUILD SUBMENU: -----------
var ht_update = function( din )  
{	
	var fs = require('fs');		
	var buffer = fs.readFileSync(Temp_plugin_file_PATH);
	inc_m = JSON.parse(buffer);
	
	
	var shtml = '<div id="tabs">';	// tabs
	shtml+= '<ul>';		
	shtml+= '<li id="tabsLogo"  > <img src="/images/testLogo.png" class="menu-logo-image"> </img></li>	';
	for( var i in inc_m ) if( inc_m[i] ) shtml += '<li><a href="#tabs-'+ i +'">'+ inc_m[i].module_name + '</a></li>';					// For each plugin
	shtml+= '</ul>';

	for( var i in inc_m ) if( inc_m[i] )  shtml+= '<div id="tabs-'+ i +'">' + inc_m[i].html + '</div>';				// For each plugin
	 shtml+= '</div>';	// tabs
	din = din.toString().replace ('%*tabmenucontent*%', shtml );	 	// Replace %*tabmenucontent*% wit HTML code of all modules
	

	// Dashboard list view:
	var shtml_s =  '';		
	for( var i in inc_m ) if( inc_m[i] 		&&	 inc_m[i].htmlShort	 !== undefined )	
		{
				 shtml_s +=  inc_m[i].module_name + ': <br>' + inc_m[i].htmlShort  +'<br><br>';
				// shtml_s +=  inc_m[i].module_name + '  ' + inc_m[i].htmlShort  +'</br>';
				// console.log( i , inc_m[i].htmlShort  )
		}
		shtml_s+= '';
		din = din.toString().replace ('%*dashboard*%', shtml_s );		


	return din;
}
 // ===================[ S3 core END ]===============================