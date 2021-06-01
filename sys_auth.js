#!/usr/bin/node
"use strict"; 

var Temp_token_file_PATH = require("./_config.js").Temp_token_file_PATH;
var tokenList = {};
 

function onlyUnique(value, index, self) {     return self.indexOf(value) === index;	}
function removeToken(token){  	delete tokenList[token];  	}
function max_clients() {		if(tokenList.length > 100)return true; else return false; 		 }
function checkToken(token)
{	
		if(token === undefined) return false;
		var fs = require('fs');
		try{
				var  buffer = fs.readFileSync( Temp_token_file_PATH );
				tokenList = JSON.parse(buffer);
				if( tokenList[ token ] ) return true;	return false;
			}
		catch(e){	return false;	}
}
function getUsernameByToken(token){	  if(tokenList[ token ])     return tokenList[ token ].username;  }
function getAccessByToken(token){	      if(tokenList[ token ])   return tokenList[ token ].access;  }
function getAccountNoByToken(token){	      if(tokenList[ token ])   return tokenList[ token ].account;  }
function getAccount_vrfByToken(token){	    if(tokenList[ token ])   return tokenList[ token ].account_vrf;  }
function getAccount_AESKeyByToken(token){	    if(tokenList[ token ])   return tokenList[ token ].key;  }
function removeOldToken(dtm){	 for(var i in tokenList) if(tokenList[i].entered < dtm)	delete tokenList[i];   }

// == End of client == //

  
 
var moduleScope = {}
module.exports = moduleScope; 					// Expose the moduleScope / event emitter, entire exports value.
 
 
moduleScope.init = function(sb, _, common)
{
		console.log('mod: inc_SYS_logins');
		var MOSI_ACK = common.MOSI_ACK;
		sb.checkToken = checkToken; 
		sb.removeToken = removeToken; 
		sb.max_clients = max_clients; 
		sb.getUsernameByToken = getUsernameByToken; 
		sb.getAccessByToken = getAccessByToken; 
		sb.getAccountNoByToken = getAccountNoByToken; 
		sb.getAccount_vrfByToken = getAccount_vrfByToken;
		sb.getAccount_AESKeyByToken = getAccount_AESKeyByToken;

					
		//------------------- MISC: set new login ----------
		sb.on('WEBAccessUser', function(input)
		{
			console.log('m001, WEBAccessUser');
			MOSI_ACK(input, true, 'ok');
		});

		//------------------- MISC: new pass ----------
		sb.on('WEBAccessPass', function(input)
		{
			console.log('m000, WEBAccessPass');
			MOSI_ACK(input, true, 'ok');		
		});
		
		//------------------- MISC: update login ----------
		sb.on('on_WEBAccess_login_BTN', function(input)
		{
			var l = input.data.value;
			var p = input.data.param; 
			dlb.all( "UPDATE login SET user = '"+l+"',  password = '"+p+"' WHERE account = 1;" , function(e){if(!e)MOSI_ACK(input, true, 'ok'); MOSI_ACK(input, false, e);console.log(e);}	);	
		});
				
		//------------------- MISC: logout ----------
		sb.on('on_logout_EVT', function(input)
		{
			// Logout all clients of this user:
			sb.removeToken( input.wsock_new_v.stored_token);
			console.log('User "' +input.wsock_new_v.username+ '" / token "' +input.wsock_new_v.stored_token+'"  logout.');		
			MOSI_ACK(input, true, 'Logout completed');		
		});
		
		//------------------- MISC: login log message ----------
		sb.on('on_login_EVT', function(input, token)
		{
			console.log('User "' +input.username+ '" / "' +input.stored_token+'"  login.');
		}); 
					
		// get user
		sb.on('on_get_current_user', function(input) 
		{			
			MOSI_ACK(input, true, 'current user ', { login: input.wsock_new_v.username,  access: input.wsock_new_v.access, 	token: input.wsock_new_v.stored_token,	account_vrf: input.wsock_new_v.account_vrf });
		});
		 
};
