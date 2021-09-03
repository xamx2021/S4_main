#!/usr/bin/node
"use strict";


var vrb_dbg_console_log = true;
var vrb_dbg_console_log_1 = false;


var SBCONF = require("./_config.js").SBCONF;
var WSCONF = require("./_config.js").WSCONF;
var PLUGINS = require("./_config.js").PLUGINS.plugins;


//==================================================================
var EventEmitter = require('events').EventEmitter;
var moduleScope = new EventEmitter(); 			// Create an instance of our event emitter. 
moduleScope.setMaxListeners(0);
module.exports = moduleScope; 						// Expose the moduleScope / event emitter, entire exports value.
moduleScope.ackRx = {};
moduleScope.SBCONF = SBCONF;
var CryptoJS = require("crypto-js");
var iv  = CryptoJS.enc.Hex.parse(WSCONF.server_iv);


//--------------------------------------------------------------------[ API Server ]-------------------------------------------------------------------------
if(WSCONF.WebSockType === 'wss') 
{
		var fs = require('fs');
		var https = require('https');		
		var server = new https.createServer({
		key: fs.readFileSync(WSCONF.sslKey),  	 
		cert: fs.readFileSync(WSCONF.sslCert),  	 
		passphrase: WSCONF.sslPassphrase
		});

		var WebSocket = require('ws');
		var wss = new WebSocket.Server({ server,
			perMessageDeflate: {
				zlibDeflateOptions: 
				{
					chunkSize: 1024,
					memLevel: 7,
					level: 6,
				},
				zlibInflateOptions: {	chunkSize: 10 * 1024	},
				clientNoContextTakeover: true, 	// Defaults to negotiated value.
				serverNoContextTakeover: true, 	// Defaults to negotiated value.
				clientMaxWindowBits: 10,       	  // Defaults to negotiated value.
				serverMaxWindowBits: 10,       	// Defaults to negotiated value.
				concurrencyLimit: 10,         		 // Limits zlib concurrency for perf.
				threshold: 1024,              			 // Size (in bytes) below which messages should not be compressed.
			}
		});
		wss.on( 'connection',	server_proc );
		server.listen(WSCONF.serverWebSockport, WSCONF.serverip);
 }

 else if(WSCONF.WebSockType === 'ws') 
 {
		var webSocketServer = require('ws').Server;
		webSocketServer.key  = false;													//  Handshake data is not encrypted.
		var webSocketServerObject = new webSocketServer({ port: WSCONF.serverWebSockport, host: WSCONF.serverip });
		webSocketServerObject.on('connection', server_proc);
 }

else return console.log('Incorrect websocket type, ', WSCONF.WebSockType);


moduleScope.wsock_array = [];
var clients = [];
function server_proc(wsock) 
{
					wsock.on('close', function()
						{
							for(var i = 0; i < clients.length; i++) 	if(clients[i] == wsock)
							{	clients.splice(i);		console.log('User "'+ wsock.username + '" disconnected');		break;	}// Remove from connections
						});			
				
					wsock.on('message', function(raw_data)
						{					
							var data = {};
							if( wsock.command_count === undefined )wsock.command_count = 0; 
							else wsock.command_rx_count++;							
							try
								{								
									if( WSCONF.WebSockType === 'ws'  && wsock.key) 
										 {
											var decrypted = CryptoJS.AES.decrypt(  raw_data,  wsock.key);//,  {  iv: iv,    mode: CryptoJS.mode.CBC,   padding: CryptoJS.pad.Pkcs7  });
											raw_data = decrypted.toString( CryptoJS.enc.Utf8 );											 
										 }
									// if WSS -> The raw_data has already been decrypted by the socket.
									data = JSON.parse(raw_data);
								}
							catch(w){		try{	data = JSON.parse(raw_data);	} catch(e){			if(vrb_dbg_console_log)	console.log(' Warning #7430: bad JSON');		}	}				//				console.log('Warning: plane text rx data!');

							// New client connects:
							// 1. Check if token exists in TokenList;
							// 2. Verify the socket to the client;
							// 3. Replace token in TokenList with a new one and send it to the client.   TODO
							if( ! wsock.auth_confirm_socket )
								{
									if( moduleScope.checkToken(data.token) == false ) 	// Unknown token
										{
											if( data.token === undefined) return;			// protocol mismatch
											var ack_event_name = 'Auth_rq';
											var obj = {};																																				
											obj[ack_event_name] = true;
											obj['ack_event_name'] = ack_event_name;
											obj['status'] = false;
											obj['msg'] = 'Authentication failed';																		
											try{	wsock.send(JSON.stringify(obj));	  } catch(e){   		if(vrb_dbg_console_log_1)	console.log('error at ('+ack_event_name+'): '+e); 		 }
											wsock.close();	
											return;
										}
											
									if( clients.length >= SBCONF.maxCUsers )		//  "MAX CON REACHED"
										{												
												var ack_event_name = 'Max_users_r';
												var obj = {};																																				
												obj[ack_event_name] = true;
												obj['ack_event_name'] = ack_event_name;
												obj['status'] = false;
												obj['msg'] = 'Max user limit = ' + SBCONF.maxCUsers;																		
												try{	wsock.send(JSON.stringify(obj));	  } catch(e){   		if(vrb_dbg_console_log_1)	console.log('error at ('+ack_event_name+'): '+e); 		 }
												wsock.close();	
												return console.log('Concurrent user limit reached'); 		
										}
									
									wsock.username = moduleScope.getUsernameByToken(data.token);	
									wsock.account = moduleScope.getAccountNoByToken(data.token);
									wsock.account_vrf = moduleScope.getAccount_vrfByToken(data.token);									
									wsock.key = moduleScope.getAccount_AESKeyByToken(data.token);
									/*
									wsock.encryptAndSend = function(message, key)
									{
										//var message = JSON.stringify(obj);
										//var key = data.wsock_new_v.key;	
										var encrypted = CryptoJS.AES.encrypt(  message,  key,  {    iv: iv,    mode: CryptoJS.mode.CBC,    padding: CryptoJS.pad.Pkcs7  });
										message = encrypted.toString();
										try{	wsock.send( message );	  } catch(e){   console.log('Error #0801 at ('+ack_event_name+'): ' + e); 		 }
									}
									*/
									wsock.stored_token = data.token;
									wsock.auth_confirm_socket = true;																										
									wsock.ACK_MOSI_e = data.ACK_MOSI_e;																										
									var tmp  = moduleScope.getAccessByToken(data.token);											
									wsock.access = {};
									try{	wsock.access = JSON.parse(tmp);		} catch(e){ 	 console.log('Warning #8858, can\'t  parse JSON '+e);		}
									//		moduleScope.removeToken(data.token);
								
									// Check if user log on:
									if( ! SBCONF.multiple_sns ) 
									for(var i in clients) 							
										if(clients[i].username === wsock.username  && clients[i].token !== data.token ) 									
											{
														// Override old client:
														/*		
														var ack_event_name = 'Dup_ssn_disabled';
														var obj = {};																																				
														obj[ack_event_name] = true;
														obj['ack_event_name'] = ack_event_name;
														obj['status'] = false;
														obj['msg'] = 'Another instance of "' + clients[i].username + '"  is about to open. Multiple session not allowed. ';
														try{	clients[i].send(JSON.stringify(obj));	 } catch(e){   if(vrb_dbg_console_log)console.log('error at ('+ack_event_name+'): '+e);  }

													//	clients[i].close();													
														clients[i] = wsock;			// override previous client
														return;
														*/
												
														// Prevent new client:													
														if(vrb_dbg_console_log)console.log('Warning #8812, Multiple session prevented. ');
														var ack_event_name = 'Dup_ssn_disabled';
														var obj = {};																																				
														obj[ack_event_name] = true;
														obj['ack_event_name'] = ack_event_name;
														obj['status'] = false;
														obj['msg'] = 'Multiple session not allowed. ';
														obj['msg'] += 'User "' + clients[i].username + '" is already logged in.';
														try{	wsock.send(JSON.stringify(obj));	 } catch(e){   if(vrb_dbg_console_log)console.log('error at ('+ack_event_name+'): '+e);  }

														wsock.close();
														return;			
																			
											} // end of dup. sess.


									/// Yes, the user can now log in, however we have to load some additional data from client's profile in HCDB:  [permissions, personal settings, roles ...]				
									moduleScope.emit('on_login_EVT', wsock, data.token, function(res)
										{
											if(!res){		wsock.close();		return;		}					// Not loading data profile -> disconnect client
											//clients.push(wsock);
											//Sends " __on_api_connected " event to the client after login sequence:
											var ack_event_name = '__on_api_connected';
											var obj = {};																																				
											obj[ack_event_name] = true;
											obj['ack_event_name'] = ack_event_name;					
											
											if(WSCONF.WebSockType === 'ws') 
												{
													var message = JSON.stringify(obj);
													var key = wsock.key;
													var encrypted = CryptoJS.AES.encrypt( message,  key );//,  {    iv: iv,    mode: CryptoJS.mode.CBC,    padding: CryptoJS.pad.Pkcs7  });
													message = encrypted.toString();
													try{	wsock.send( message );	  } catch(e){   console.log('error at ('+ack_event_name+'): ' + e); 		 }
												}											
											else	
												try{	wsock.send(JSON.stringify(obj));	  } catch(e){   console.log('error at ('+ack_event_name+'): ' + e); 		 }
										});	


									clients.push(wsock);								

								} // end of new client.


							data.wsock_new_v = wsock;



						
//----------------------------------------------------
//API
										data.MOSI_ACK = data.ACK_MOSI = function (status, msg, return_data) 
																{																
																	moduleScope.MOSI_ACK (data, status, msg, return_data);
																}																
																															
										data.MOSI_UCT = data.unicast =  function (obj) 
																{															
																	moduleScope.MOSI_UCT(data, obj);							
																}																
																
										data.MOSI_BCT = data.broadcast = function (obj)
																{															
																	moduleScope.MOSI_BCT(obj);
																}

//----------------------------------------------------
																	


					// Multiple commands in API request:				
						for ( var property in data )
									{
										 if( data[property] === true ) moduleScope.emit(property, data);
									}
						});



} // server proc. end


console.log('WEBSOCKET Server listening at '+ WSCONF.serverip +':'+ WSCONF.serverWebSockport);


//======================================================================
//			FW   //  status, no error
//======================================================================
moduleScope.MOSI_ACK = function (data, status, msg, return_data)
{
	try{		
		var ack_event_name = data.cmd;
		var obj = {ack_event_name:ack_event_name, status:status, msg:msg, return_data:return_data, session_cmd_count:data.wsock_new_v.command_rx_count}; // Initial transport data
		obj[ack_event_name] = true;  		// deprected 
		var message = JSON.stringify(obj);
		if(WSCONF.WebSockType === 'ws') 
			{
				var key = data.wsock_new_v.key;	
				var encrypted = CryptoJS.AES.encrypt(  message,  key);//,  {    iv: iv,    mode: CryptoJS.mode.CBC,    padding: CryptoJS.pad.Pkcs7  });
				message = encrypted.toString();
			}
		data.wsock_new_v.send( message );	
	 } catch(e){	if(vrb_dbg_console_log)	console.log('Error #4415 at MOSI_ACK: '+e);		}
}
 
//======================================================================
//		
//======================================================================
moduleScope.unicast = 
moduleScope.MOSI_UCT = function (data, obj)
{
	try{							
			var message = JSON.stringify(obj);
			if(WSCONF.WebSockType === 'ws') 
				{	
					var key = data.wsock_new_v.key;
					var encrypted = CryptoJS.AES.encrypt(  message,  key );//,  {    iv: iv,    mode: CryptoJS.mode.CBC,    padding: CryptoJS.pad.Pkcs7  });
					message = encrypted.toString();
				}
			data.wsock_new_v.send(message);	 		
	} catch(e)
	{	
		if(vrb_dbg_console_log) console.log('Error #4416 at MOSI_UCT: '+e, obj);	
	}     
}

//======================================================================
//		
//======================================================================
moduleScope.broadcast = 
moduleScope.MOSI_BCT =  function( obj )
{	
	var message = JSON.stringify(obj);
	for(var i = 0; i < clients.length; i++) 
		{ 
			if(! clients[i] )return; 
			try{
				if(WSCONF.WebSockType === 'ws') 
					{
						var key = clients[i].key;
						var encrypted = message;
						message = encrypted.toString();			
					}
				clients[i].send(message);				
			} catch(e){  if(vrb_dbg_console_log)	console.log('Error #4417 at MOSI_BCT: '+e);}     
		}
}











 
//--------------------------------------------------------------------[ Server ESP ]-------------------------------------------------------------------------
var realTimeUpdateServer = require('net').createServer(  serverThr  ); 
realTimeUpdateServer.listen(SBCONF.serverremotedataInport, SBCONF.serverremotedataserverip); 
console.log('serverRealtimeEvents service is running at '+ SBCONF.serverremotedataserverip +':'+ SBCONF.serverremotedataInport);

function serverThr(socket) 
{
		socket.setEncoding("ascii");
		socket.setNoDelay(true);
		socket.ackArray = [];		
		//socket.registered = false;
		//socket.remoteConnected = false;	
		//socket.DEVICE_MOSI = command2device.bind(null, socket);
		//socket.DEVICE_Stream = stream2device.bind(null, socket);
		socket.transport_sender = function(data){ 	socket.write(data);		};				//		try{	socket.write(data);			} catch(e) {	console.log( 'Warning 234111 at socket.write' );	}
		socket.transport_initialized = true;
				
		socket.on('close', function( )
			{
				//socket.Command = device_command_default;
				//socket.remoteConnected = false;	
				//socket.registered = false; 
				//socket.transport_sender = transport_sender_default;
				moduleScope.emit('on_ss_module_disconnected', socket);
			});	

	 	socket.on("data", device_proto_parser.bind(null, socket));  
		socket.on('error', function(e){ 								console.log('Warning 3511 "Socket error": ', e.message);		   });	//, arguments
		socket.on('uncaughtException', function (err){	  	console.error('Exception uncaught #44157, ', err.stack);			});			
}
 





//===================================================================
// Streams large packet of data to the device without  ack
//===================================================================
function stream2device( instance, cmd_data, cb )
{
		if(!cb) cb = function(){};

		try{						
			//	if(instance.socket.destroyed)		{	  console.log('error 51922, Socket closed.');    return cb( {  error: true, cmd: cmd_data.dev_cmd, det: 'error 51922, Socket closed.'}); 	}
	
		//		try{
			instance.socket.write(new Buffer(cmd_data));								 
		//			} catch(e) {	console.log( 'Warning 234111 at socket.write' );	}

//				//3. create new element if needed:
//				socket.ackArray[ cmd_index ] = {};
//				socket.ackArray[ cmd_index ].callback = cb;
//				socket.ackArray[ cmd_index ].timestamp = new Date().getTime();
//				socket.ackArray[ cmd_index ].timeout = setTimeout (function()
//						{ 
//							cb( { error:true, status: 'timeout', cmd: cmd_data.dev_cmd, cmd_index:cmd_index, det: 'error 0913448, command response timeout'}); 
//							socket.ackArray[ cmd_index ] = undefined;
//							socket.remoteConnected = false;				// new11.21.20
//						}, 6000);									
			}
			catch(e){ cb( { status: false, cmd: cmd_data.dev_cmd, cmd_index:cmd_index, det: '2718 Transport error ' + e } ); 		console.log(' 2718 Transport error '  + e);		}		
}




var cmd_index = 0;
//===================================================================
// Sends command to the device with small amount of data. Using JSON
// TX: Driver protocol DE/ENCODER. Input data = JSON + callback / example command2device(socket, [ {cmd:'test', value1:'some testing'}, {cmd:'test2',  value1:123, value2:'ddddd'},....]
//===================================================================
function command2device( instance, cmd_data, cb )
{		
		if(!instance) return console.log('error 23492848');
		if(!cb) cb = function(){};

	//	if(!instance.remoteConnected)cb( { error:true, status: 'timeout', cmd: cmd_data.dev_cmd, cmd_index:cmd_index, det: 'error 0913448, command response timeout'}); 
		try
			{		
				// 1. find last unused element of ackArray:	
					var cmd_index=-1;
					for(var i=0; i<1000; ++i )
						{
							if( !instance.ackArray[i] ){ 	cmd_index = i; break;	}
						}
				
					if(  cmd_index < 0)
						{
							console.log('error 51178, Protocol overloaded with  "',   cmd_data.dev_cmd   , '" command.'  );
							return cb( {  error: true, cmd: cmd_data.dev_cmd, det: 'error 51178, Protocol overloaded.'});
						}

				//		if(cmd_data.dev_cmd == "config_device")
			//			{
			//				console.log('tx:config_device: ', cmd_index)
			//			}
	


					//2. add index ant time to the packet:
					cmd_data.cmd_index = cmd_index;									// dev_cmd & data  are  in	cmd_data
										
					function roughSizeOfObject( object ) 
						{
							var objectList = [];
							var stack = [ object ];
							var bytes = 0;
							while ( stack.length ) {
								var value = stack.pop();
								if ( typeof value === 'boolean' )	bytes += 4;
								else if ( typeof value === 'string' ) 	bytes += value.length * 2;
								else if ( typeof value === 'number' ) 	bytes += 8;
								else if( typeof value === 'object' && objectList.indexOf( value ) === -1  )
									{
										objectList.push( value );
										for( var i in value ) stack.push( value[ i ] );
									}
							}
							return bytes;
						}						
								
					var cmd_data_size = Number( roughSizeOfObject(cmd_data));
					if( cmd_data_size > 2580) 	return cb( {  error: true,  status: false, cmd: cmd_data.dev_cmd, cmd_index:cmd_index, det: 'error 09134000, data payload is too heavy. Maximum 2580 bytes.'}); 	
					
					//3. send data to the device:
					instance.transport_sender( JSON.stringify(cmd_data) );

					//4. create new element in acknowledgement  await table:
					instance.ackArray[ cmd_index ] = {};
					instance.ackArray[ cmd_index ].dev_cmd = cmd_data.dev_cmd;			//	if(instance.remote_id === 'c59e99')	if(cmd_data.dev_cmd !== "ping") console.log('data sender ', cmd_data.dev_cmd, '   ', instance.remote_id,  '  ', cmd_index )
					instance.ackArray[ cmd_index ].callback = cb;
					instance.ackArray[ cmd_index ].timestamp = new Date().getTime();
					instance.ackArray[ cmd_index ].timeout = setTimeout (function()
							{ 
								cb( { error:true, status: 'timeout', cmd: cmd_data.dev_cmd, cmd_index:cmd_index, det: 'error 0913448, command response timeout'});
								delete instance.ackArray[ cmd_index ] ;
							}, 5000);
			}
		catch(e){ cb( { status: false, cmd: cmd_data.dev_cmd, cmd_index:cmd_index, det: '2718 Transport error ' + e } ); console.log(' 2718 Transport error '  + e);	}		
}





/// It is assumed that a device is ONLINE if a data was received from it. 
/// The role-file might be missing o contain errors thus not functioning properly; in this cace a flag "rolefile_loaded_ok" should remain false.
/// If a device, connected with MQTT, is seen as ONLINE and being reset in between PING intervals, the core wont be able identify re-connection and the initialisation command won't be send, however 
/// that device should send PRESENCE packet which triggers 'state_change' event to provide re-initialization (device configuration).

//===================================================================
// RX: Driver protocol DECODER. Input data = JSON + callback
//===================================================================
function device_proto_parser( instance, din )
{				
				//V1. ACHTUNG: By default TCP connections use the Nagle algorithm, they buffer data before sending it off.
				// So it results in multiple JSONs in one string which needs to be parsed into an array before prcessing.
				// Сейчас используется режим моментальной посылки данных (TCP_NODELAY) - не эфективно.		
		
				din = din.toString();

				//V2.     If multiple_json	 -> split it toarray.  2.recursive call foreach element.
				var json_arr = din.match(/\{(.*?)\}/g);			// parse {} {}
				if( !json_arr ) return;
				if(	json_arr.length >1) 
					{
						for( var i in json_arr)device_proto_parser( instance, json_arr[i] );
						return;
					}

				try{	var Obj = JSON.parse(din);	}catch(e){ console.log( 'Transport error #14342, broken JSON ' + din );		return;	}
			

				// If possible  get the IP address of the device from the system. If not possible, get it from the remote 
				if(instance.remoteAddress)	  instance.remote_ip = instance.remoteAddress;														
				else 										instance.remote_ip = Obj.remote_ip;
			//	if(Obj.remote_id) 					 instance.remote_id = Obj.remote_id;

			// New device descovered via S4:
			if( !instance.remote_id )
				{
					instance.remote_id = Obj.remote_id;
					//console.log("Device presence @S4: ", Obj.remote_id);
					moduleScope.all_infrastructure_IDs[ Obj.remote_id ] =   'Discovered S4 device, not connected';
				}

			//	if(instance.remote_id  === 'd2d211')
			//	{
			//		console.log('ddddd');
			//	}
				instance.remoteConnectedLastState = instance.remoteConnected;
				instance.remoteConnected = true;
				if( !instance.registered )// && remote_id )
					{
						instance.registered = true;
						moduleScope.emit( 'on_ss_module_connected', instance);
					}

				else	if(instance.remoteConnectedLastState != instance.remoteConnected) 	instance.events.emit('state_change', instance);	

	
				// Either device-initiated event or command return. Not both:
				if( Obj.RDeviceEvent  && instance.events ) return instance.events.emit( 'on_device_event', Obj);

				var cmd_index = Number(Obj.cmd_index);			
				if( isNaN( cmd_index ) )return ;					// Protocol mismatch, the device returns data without command IndexID'
				if( instance.ackArray[cmd_index] )
					{
						//	var top = Math.abs((new Date().getTime()) - Obj.timestamp);						
						var top = Math.abs((new Date().getTime()) - instance.ackArray[cmd_index].timestamp);
						Obj.top=top;

					//	if(Obj.dev_cmd !== "ping") console.log('data tracker: ', Obj.dev_cmd, '   ',  instance.remote_id, '  ', Obj.cmd_index, '   top: ', Obj.top )
					//	if(Obj.dev_cmd == "config_device")
					//	{
							//console.log('rx:config_device: ', Obj.cmd_index)
				//			console.log('rx:config_device: ', Obj.dev_cmd, '   ',  instance.remote_id, '  ', Obj.cmd_index, '   top: ', Obj.top )
					//	}

						Obj.status = true;
						instance.ackArray[cmd_index].callback(  Obj  );
						clearTimeout( instance.ackArray[cmd_index].timeout );
						delete instance.ackArray[ cmd_index ];
					}				

}



moduleScope.all_infrastructure_IDs = {};


class Tdev {
	constructor ()
		{
			this.events = new EventEmitter();
			this.remote_id = undefined;
			this.remote_ip = undefined;
			this.remoteConnected = false;
			this.remoteConnectedLastState = false;
			this.ackArray = [];
			this.DEVICE_MOSI = command2device.bind(null, this);
			this.DEVICE_Stream = stream2device.bind(null, this);	
			this.device_proto_parser = device_proto_parser.bind(null, this);	//( this, data );	
			//this.transport_sender = this.transport_sender_default = function(cmd, rcb){    if( typeof rcb === 'function')  rcb( false, 'Transport is not initialized' );   console.log( 'Transport is not initialized, cmd: ', cmd, this.remote_id  ); }
			this.transport_sender = this.transport_sender_default = function(cmd, rcb){    if( typeof rcb === 'function')  rcb( false );  }


			moduleScope.on('on_ss_module_connected', function(instance)
			{		
				if( instance.remote_id && (instance.remote_id !== this.remote_id) )return;		// If id matches
				//console.log('module connected: ',  instance.remote_id )



				
				var module_name = undefined;

				for(var i in PLUGINS)if(PLUGINS[i].connected_to === instance.remote_id) { module_name = PLUGINS[i].name; break;}


				if(module_name){
						if(instance.remote_ip)	  console.log('Device connected: ' + instance.remote_id + ',  '+ instance.remote_ip + ' is ' + module_name );		
						else 								console.log('Device connected: ' + instance.remote_id + ', ( unknown IP ) is ' + module_name );		
					}
				else
				console.log('Device connected: ',  instance.remote_id)

			//	if(this.remoteConnected == true )return;				// prevent firing double events

			this.remoteConnected = true;

				moduleScope.all_infrastructure_IDs[ instance.remote_id ] = true;				  // Second set TRUE for registered devices
				this.socket = instance;																					 // Used in streaming.
				instance.events = this.events;																		// Used in S4 protocol.
				if(instance.transport_sender) this.transport_sender = instance.transport_sender;
				if(instance.transport_initialized) this.transport_initialized = true;
				instance.ackArray = this.ackArray;
				this.remote_ip = instance.remote_ip;
				this.events.emit('device_connected', this);
				this.events.emit('state_change', this);				
				this.events.emit('online', this);
				clearCmdTimeouts();				
				//console.log('Device connected: ' + this.remote_id + ' @ '+ this.remote_ip + ' as ' + exemplar.prototype.module_name );
			}.bind(this));
	


			moduleScope.on('on_ss_module_disconnected', function(socket)
			{
				if( socket.remote_id && (socket.remote_id !== this.remote_id) )return;		// If id matches
				if(this.remoteConnected == false )return;				// prevent firing double events
				console.log('device went offline, LWT, ',  socket.remote_id )
				this.remoteConnected = false;
				this.events.emit('state_change', this);
				//this.events.emit('offline', this);
				//this.transport_sender = this.transport_sender_default;
				//	clearCmdTimeouts();
			}.bind(this));

			



			var clearCmdTimeouts = function(cmd)
			{
				for(var i in this.ackArray)
				{
					if(this.ackArray[i]) clearTimeout( this.ackArray[i].timeout );
				}
			}.bind(this);
			


			var pinger = function()
			{
				function PING(obj)
					{
						if(obj.status === 'timeout')
							{
								//console.log('offline by ping')
								this.remoteConnected = false; 

								if(this.remoteConnected == true)
									{
										this.events.emit('offline', this);
										this.events.emit('state_change', this);	
										clearCmdTimeouts();
									}
							}
						else
							{
								this.remoteConnected  = true;
								this.RSSI = obj.RSSI;
							}

						//	Update infrastructure list:
						if(this.useingMQTT) 			var st = "MQTT"; 											else st = "S4";
						if(this.remoteConnected) 	 var sr =  " ONLINE, Wireless RSSI: " + this.RSSI; 	  else sr = " offline";						
						moduleScope.all_infrastructure_IDs[ this.remote_id ] = st + ',  ping:' + sr;
					}

			//	if( this.transport_initialized )
						this.DEVICE_MOSI( { dev_cmd: 'ping' }, PING.bind(this));
						
			}.bind(this);

		this.remoteDevicePingInterval = setInterval(pinger,  6000);

		}		// End of constructor.
}




moduleScope.S4Init = function(attach_device_by_ID)
{
	var dev = new Tdev();
	dev.remote_id = attach_device_by_ID;
	dev.useingMQTT = false;
	moduleScope.all_infrastructure_IDs[ dev.remote_id ] = false;
	return dev;
}





moduleScope.MQTTInit = function( cfg )
{

	if( cfg.DeviceID === undefined)return console.log( ' ERROR !!!!!!! DeviceID is not specified ');
	if( cfg.MQTTtxTopic === undefined) cfg.MQTTtxTopic = "/topic_MOSI/" + cfg.DeviceID;
	if( cfg.MQTTrxTopic === undefined) cfg.MQTTrxTopic = "/topic_MISO/" + cfg.DeviceID;
	if( cfg.MQTTclientID === undefined) cfg.MQTTclientID = "hub"+  cfg.DeviceID;

	var mqtt = require('mqtt');
	var client = mqtt.connect(cfg.MQTTserver,  {username:cfg.MQTTlogin, password:cfg.MQTTpassword, clientId:cfg.MQTTclientID});	//,clean:true})

	//client.on('outgoingEmpty', function (){	        }	);
	//client.on('packetsend', function (){	        }	);
	//client.on('error', function (){	        }	);
	//client.on('diconnect', function (){	socket.Command = device_command_default;	}	);

	client.on('connect', function (packet)
	 {
		client.subscribe('/presence', function (err) { 			 });
		client.subscribe(cfg.MQTTrxTopic,{qos:1});
	});

	client.on('message', function (topic, message, packet) 
	{
	//	console.log('*')
	//	if(topic == '/presence')		{		dev.device_proto_parser(  message );			this.events.emit('device_connected', this);		this.events.emit('state_change', this);		this.events.emit('online', this);		}
	//	if(topic == '/presence')	return		dev.device_proto_parser(  message );	
	//	if(topic == '/lwt')					moduleScope.emit( 'on_ss_module_disconnected',     {					} );
		if(topic == '/presence')
			{
					try{	
						var Obj = JSON.parse(message);
						//console.log("Device presence @MQTT: ", Obj.remote_id);
						moduleScope.all_infrastructure_IDs[ Obj.remote_id ] =   'Discovered MQTT device, not connected';
						if(topic == dev.rxTopic)return dev.device_proto_parser( message );
					   	}catch(e){ console.log( 'Transport error #11342, broken JSON ' + message );	return;	}
					
			}	// To make it compatible with other 100% MQTT devices.
		if(topic == dev.rxTopic)	dev.device_proto_parser( message );
	});
	
	



	var dev = new Tdev();
	dev.useingMQTT=true;
	dev.remote_id = cfg.DeviceID;
	dev.rxTopic = cfg.MQTTrxTopic;
	dev.txTopic = cfg.MQTTtxTopic;
	dev.transport_initialized = true;
	dev.transport_sender = function(data, topicTX){				client.publish(dev.txTopic, data);			}
	
	dev.DEVICE_Stream =	function ( data, cmd_data, cb )
		{
				if(!cb) cb = function(){};
				try{
						console.log('ACHTUNG!  Slow stream over MQTT. It is not working well');
						client.publish(dev.txTopic, data.toString());			
					}
				//	catch(e){ cb( { status: false, cmd: cmd_data.dev_cmd, cmd_index:cmd_index, det: '2718 Transport error ' + e } ); 		console.log(' 2718 Transport error '  + e);		}		
					catch(e){ cb( { status: false, det: '2718 Transport error ' + e } ); 		console.log(' 2718 Transport error '  + e);		}		
		}

	moduleScope.all_infrastructure_IDs[ dev.remote_id ] = false;		
	return dev;
}


 







moduleScope.shieldFn = function(fn)
{
	return async function exceptionShield(input){
		try
		{
			await fn.apply(null, arguments);
		}
		catch(e)
		{
			moduleScope.MOSI_ACK(input, false, e.message || e);
		}
	}
}