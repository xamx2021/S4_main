
const DEBUG_MESSAGES_0 = false;
var apiTransport = {}

var settings = {    apiPort: 00000,    iv:111111}
apiTransport.client = {}
apiTransport.session = {}

document.dt=0;


var api_wss_ws;
var client = apiTransport.client;
var meAdmin = false;
apiTransport.transport_Init = function() 
{
 		var api_port = document.getElementById('S4_api_port').getAttribute("value");
 		api_wss_ws = document.getElementById('S4_api_wss_ws').getAttribute("value");

//==========================		
			var con_el = document.querySelector('#connection');
			var socketOpenListener = function(evt)
				{	
						if( con_el) {con_el.classList.add('connected'); con_el.classList.remove('disconnected'); }															
						var token = document.getElementById('S4_session_token').getAttribute("value");

						// To be sent upon connection:
						//1. Token
						//2. MISO_getAdminGUIupdate requiest to update UI
						client.send( JSON.stringify({MISO_getAdminGUIupdate: true, token:token}) );
						//client.send( JSON.stringify({ token:token	}) );
						document.dispatchEvent(new CustomEvent('on_connection_est'));															
						client.readyStateX=true;														
						$(document).trigger('____on_ws_connect', [0, 0, 0]);					 
				}
				

			var socketMessageListener = function(evt)
				{			
			//	try{
						client.readyStateX=true;
						if(client.authFailed) return;
						var raw_data = evt.data;
						var data = {};
						var obj = {};
						key = document.getElementById('S4_session_AES_key').getAttribute("value");
						token = document.getElementById('S4_session_token').getAttribute("value");
						 
						try{
								if( api_wss_ws === 'ws' )
									{
										// Enc. protocol:
										var decrypted = CryptoJS.AES.decrypt(  raw_data,  key);//,  {    iv: iv,    mode: CryptoJS.mode.CBC,   padding: CryptoJS.pad.Pkcs7  });
										var dec_data = decrypted.toString(CryptoJS.enc.Utf8);		
										obj = JSON.parse(dec_data);
									}
									else 
										obj = JSON.parse(raw_data);
							}							
						catch(w)
							{
									if(DEBUG_MESSAGES_0)		console.log('Warninng, #8114, PTD, cannot decrypt'	);	
									// Try plain text data:
									try{obj = JSON.parse(raw_data);} catch(e){	if(DEBUG_MESSAGES_0)console.log('2Warninng, JSON parsing error, ',  raw_data);}
							}
														
						try{	obj = JSON.parse(obj);		} catch(e){if(DEBUG_MESSAGES_0)	console.log('3 ', obj);				}		
																						
						for ( var property in obj )  document.dispatchEvent(new CustomEvent(property, {detail:  obj}));	   // Event emitter
						//=============						
						if(obj.MOSI_GUI_SETelement) MOSI_GUI_SETelement(obj);		// update component by ID. Sets value, bgcolor, error message
						//=============
						else if(obj.Auth_rq){   console.log(' WebSocket Authentication failed ' );client.authFailed = true;   GET_logout ();	}
						else if(obj.Dup_ssn_disabled){  client.authFailed = true;    	modal_alert( "Multiple login is not allowed.\n\r Another instance is running.", GET_logout);	}	 
						else if(obj.Max_users_r){  client.authFailed = true;   	modal_alert( "Too many users", GET_logout);	}
						else if(obj.S4Maint){   if(meAdmin)return; 	client.authFailed = true;   if(obj.value.AMSMaint_flag == true){modal_alert( "The system is closed for maintenance. Please try again later.", GET_logout);}	}
						else if(obj.loginError){  	modal_error( "Login impossible.", GET_logout);	}
				//	}catch (e){	alert (e);	};				
				};			
					
 
			var socketCloseListener_rws = function(evt){ GET_logout ();   };
			//var socketCloseListener_rws = function(evt){ GET_logout ();   client.readyStateX=false; con_el.classList.remove('connected'); con_el.classList.add('disconnected');  }
						
	//		try{     if(client.readyStateX)client.close();	}catch (e){};			//Close ws if possible before re-initializing.
	/*
	try{
		//throw('');
			client = new ReconnectingWebSocket('wss:/'+window.location.hostname+':'+api_port, null, {reconnectInterval: 2000, automaticOpen: false} );
			console.log( 'ss,', client );
			if( client.readyState != 1){	cleint.colse();	throw('');		}
			console.log(" Connected with secure Websocket. ");
		}
	catch(e)
		{
			client = new ReconnectingWebSocket('ws:/'+window.location.hostname+':'+api_port, null, {reconnectInterval: 2000, automaticOpen: false} );
			console.log( 's, ',  client );
			console.log(" Connected with Websocket. ");
		}
*/
/*
		client = new ReconnectingWebSocket('wss:/'+window.location.hostname+':'+api_port, null, {reconnectInterval: 2000, automaticOpen: false} );
		
		client.onopen  = function(e){		console.log(" Connected with secure Websocket. ");		}
		client.onerror  = function(e, a)
			{
				console.log(  'SS Error = ', e, ' client= ', client, 'a = ', a);
				//client.colse();
				
				console.log(" Failed with secure Websocket. ");
				client = 0;
			}
	 
		
		if( client.readyState != 1)
			{			 
				
		
			}
		else 	;
		*/
		if( api_wss_ws === 'wss' ){	var st = 'wss:/';	console.log("Note: Connecting with secure Websocket. ");		}	 
		else {	var st = 'ws:/';	console.log("Note: Connecting with Wesocket + CryptoJS. ");	}
			client = new ReconnectingWebSocket(st+window.location.hostname+':'+api_port, null, {reconnectInterval: 2000, automaticOpen: false} );
			client.readyStateX=false;
			client.onmessage = socketMessageListener;
			client.onopen = socketOpenListener;
			client.onclose = socketCloseListener_rws;
}
 
apiTransport.status = 0;
apiTransport.onBroadcast = function(){}
apiTransport.onUnicast = function(){}


setTimeout(function()
{
	apiTransport.transport_Init();
}, 300);

//===========================================================================================================
//	ADD include to DOM: New version
//===========================================================================================================
document.addEventListener("Dom_remote_element_bulk_upd", function(o) 
{
	var obj = o.detail.Dom_remote_element_bulk_upd;	
	for (var i in obj)
		{
			var e = document.getElementById( obj[i].elmt_ID ); 	
			if(!e) return console.log("Warning, element '" +obj[i].elmt_ID+ "' not found @ Dom_remote_element_upd");
			if(obj[i].s_param    && obj[i].value !== undefined  ) e[obj[i].s_param]  = obj[i].value;
			if(obj[i].s_attribute) e.setAttribute(obj[i].s_attribute, obj[i].value);			
		}
});



//===========================================================================================================
//	ADD include to DOM:
//===========================================================================================================
document.addEventListener("Dom_remote_element_upd", function(o) 
{
	var obj = o.detail.Dom_remote_element_upd;		 	
 	var e = document.getElementById( obj.elmt_ID ); 	
	if(!e) return console.log("Warning, element '" +obj.elmt_ID+ "' not found @ Dom_remote_element_upd");
	if(e && e.type === 'checkbox'){  if(obj.value == true)e.checked = true;  else e.checked = false;}		
	else if( obj.code!==undefined && e ) e.innerHTML = obj.code;
	else if( obj.s_param && obj.value !== undefined )e[obj.s_param]	= obj.value;
});



//===========================================================================================================
//	ADD include to DOM:
//===========================================================================================================
document.addEventListener("Dom_remote_procedure_call", function(o) 
{
	var obj = o.detail.Dom_remote_procedure_call;
	try
		{
			if( !window[ obj.function_ID ] ) return console.log( 'Warning #1460:  calling not existing function "' + obj.function_ID +'".');
			window[ obj.function_ID ](obj.params); 
		}catch(e)
		{
			console.log('Error #1462:   Error on RPC', e)
		} 
});



//===========================================================================================================
// run code remotely:
//===========================================================================================================
document.addEventListener("Dom_remote_code_call", function(o) 
{
	var obj = o.detail.Dom_remote_code_call;
	eval[obj.code];
});






//========================================================================================================
function GET_logout ()
{
	MISO_cmd3( 'on_logout_EVT', null, function(o)
	   {
		    var request = new XMLHttpRequest();
			request.open("POST", './', true);	
			request.setRequestHeader("do_logout", "true");
			//request.onreadystatechange  = function ()	{				window.location.href = './logout';				};
			request.onreadystatechange  = function ()	{		window.location.href = './';				};
			request.send();				
		});
}





	
	

	


//==================================================================
// DEPRICATING Эта функция нужна для передачи состояния органов управления на сервер.				
//==================================================================
function MISO_ectrl (sender_elmt_ID, input_value, input_param, cb)
{	
  console.log(' depricated MISO_ectrl was called: ');

					if( !this.i_nun ) this.i_nun = 0;
								this.i_nun++;
								var i_nun = this.i_nun;	
								var e = document.getElementById(sender_elmt_ID);		if(!e)return;
								var obj =  {};
								obj['sender_elmt_ID'] = sender_elmt_ID;
								if( e.value )obj['value'] = e.value;
								if( e.type === 'checkbox' )obj['value'] = e.checked;						// If this it's a ckbox:
								if( e.type === 'label' )obj['text'] = input_value;						// If this it's a label
								if( input_value )obj['value'] = input_value;
								if( input_param )obj['param'] = input_param;
								
				 MISO_cmd3(sender_elmt_ID, obj, ui_button(sender_elmt_ID));
}



function MISO_cmd3_stream(cmd, data, callback)		
{
				var obj = {cmd:cmd, data:data, tsmp:new Date().getTime()};
				obj[cmd] = true;				
				obj.token = document.getElementById('S4_session_token').getAttribute("value");
				try{				
						var key = document.getElementById('S4_session_AES_key').getAttribute("value");
						var message = JSON.stringify(obj);
						if( api_wss_ws === 'ws' )
									{
										//console.log('encrypt3:  ', key );
										var encrypted = CryptoJS.AES.encrypt(  message,  key);//,  {    iv: iv,    mode: CryptoJS.mode.CBC,    padding: CryptoJS.pad.Pkcs7  });
										message = encrypted.toString();
									}
								
								client.send( message );
						} catch (ex) {					
								clearTimeout(timeout_h);
								document.removeEventListener( "S4_opr_progress", progress_listener );
								document.removeEventListener( cmd, listener );
								if(callback) callback({cmd:cmd,  error:true,  transport_error:true});
								console.log("MISO_cmd3_stream >> transport error: " + cmd );
								return;
						}
				if(callback) callback({cmd:cmd,  error:false});
}
	

	
///**********************************************************************************************
/// Очередь должна быть ограничина по длинне
/// команды в очереди должны передаваться на сервер с заданным интервалом
/// Не все команды надлежить пропускать через очередь, для scrollbar нужен простой ограничитель частоты следования
///************************************************************************************************
var cmdTHold = 10;
var lastTimeCMD = {};	
// Limiter
function MISO_Filtered_cmd3(cmd, data, callback)		
{
	if( ! lastTimeCMD[ cmd ] )lastTimeCMD[ cmd ] = 0;
	var now = new Date().getTime();
	if( (now - lastTimeCMD[ cmd ]) < cmdTHold ) {   lastTimeCMD[ cmd ] = now; return console.log('MISO_cmd3 >> Too many commands...');	}
	lastTimeCMD[ cmd ] = now;				
	MISO_cmd3(cmd, data, callback);
}
		
	
	
var queueCmd = {};
// =============== Main API workhorse: ============
function MISO_cmd3(cmd, data, callback)				
{
	if (!queueCmd[cmd])	queueCmd[cmd] = [];

	var _callback = callback
	if(callback)
		callback = function()
			{
				queueCmd[cmd].splice(0, 1);
				//console.log( 'arguments= ', arguments,  '_callback= ', _callback);
				_callback.apply(null, arguments);
				if (queueCmd[cmd].length)		queueCmd[cmd][0]();
			}
		
	queueCmd[cmd].push(execute);
	
	if (queueCmd[cmd].length == 1)	execute();

	function execute()
		{
					//	if(!callback)callback = function(){console.log("no callback. test console.out");}
					//	if(!ui_proc)ui_proc = function(){ if(0)console.log("no ui_proc. test console.out");}						
					//	console.log( 'CB= ', callback);	
					//	ui_proc(0, 'Called');					
			
						// Operation timeout for the ACK event:
						var apiTimeout = function()
						{	
							//ui_proc(0, 'Timeout'); 
							apiProgress.hidden = true;		
							if(callback) callback({cmd: cmd,  error: true,  timeout: true});	
							console.log("MISO_cmd3 >> Timeout: " + cmd );		
						}
							
						var timeout_h = setTimeout(apiTimeout, 6000);									
						
						var obj = {cmd:cmd, data:data, tsmp:new Date().getTime()};
						obj[cmd] = true;				
						obj.token = document.getElementById('S4_session_token').getAttribute("value");		
						//obj.token  = localStorage.getItem("token");		// bad if it doesn't get cleared!
					
						var listener = function eListener(cmd_, e)
							{								
									clearTimeout(timeout_h);
									apiProgress.hidden = true;
									if(e.detail.status == 3){	e.detail.error = false;	e.detail.warning = true;		return callback( e.detail );		}		
								//	else
							//		if(e.detail.status == true) e.detail.error = false;		else e.detail.error = true;							// else e.detail.error = e.detail.status
									e.detail.cmd = e.detail.ack_event_name;
									//e.target.removeEventListener(e.type, arguments.callee);														// remove the timeout's event						
									document.removeEventListener( cmd, listener );
								//	if(e.detail.error) 
									if(e.detail.status == false) 
										{
										//	if(e.detail.ack_event_name)e.detail.ack_event_name = e.detail.type;
											//stop_dialog_table_loading();
											console.log("MISO_cmd3 >> Error at "+e.detail.ack_event_name+" >> ", e.detail.msg, "   \n\r ", e );
										}									
									//if(e.detail.return_data && e.detail.return_data.log) 	console.log("MISO_cmd3 >> Log >> ", e.detail.log );
									if( e.detail.error && e.detail.return_data ) 	console.log("MISO_cmd3 >> return data >> ", e.detail.return_data );									
							//		if( e.detail.error && e.detail.return_data && e.detail.return_data.msg ) 	console.log("MISO_cmd3 >> return data >> ", e.detail.return_data.msg );
									//try{	
									callback( e.detail );
									//} catch(e){	if(e.detail)console.log('MISO_cmd3 failed cb @	', e.detail.ack_event_name); else console.log('MISO_cmd3!!! failed cb @	', e.detail2, '  <<   ' , cmd_);}
							}.bind(0, cmd)

						// Waiting for the ACK event:
						document.addEventListener( cmd, listener );						
						
						var elem = document.getElementById("apiBar");
												
						//apiProgress.hidden = false;						
						
						var progress_listener = function eListener(e)
							{
								clearTimeout(timeout_h);
								apiProgress.hidden = false;	
								// timeout_h = setTimeout(apiTimeout, 6000);	// reset timeout with 6 seconds									
								var width = e.detail.index / e.detail.of * 100;
								width = width.toFixed(0);																
								//console.log( width, '% >> ', e.detail.index, ' of ', e.detail.of);
								elem.style.width = width + '%';
								if( e.detail.index == e.detail.of)
									{
										document.removeEventListener( "S4_opr_progress", progress_listener );
										apiProgress.hidden = true;
										//ui_proc(0, 'Ended');
									}
							}
						document.addEventListener( "S4_opr_progress", progress_listener);
						
						try{
								var key = document.getElementById('S4_session_AES_key').getAttribute("value");				
								//var key = localStorage.getItem("key");
								var message = JSON.stringify(obj);
								if( api_wss_ws === 'ws' )
									{
										//console.log('encrypt1:  ',  key );
										var encrypted = CryptoJS.AES.encrypt(  message,  key);//,  {    iv: iv,    mode: CryptoJS.mode.CBC,    padding: CryptoJS.pad.Pkcs7  });
										message = encrypted.toString();
									}
								
								client.send( message );
						} catch (ex) {					
								clearTimeout(timeout_h);
								document.removeEventListener( "S4_opr_progress", progress_listener );
								document.removeEventListener( cmd, listener );
								callback({cmd:cmd,  error:true,  transport_error:true});
								console.log("MISO_cmd3 >> transport error: " + cmd );
						}   
					
		}
}




// Updates element, called by the server.
function MOSI_GUI_SETelement(obj)
{
		var e = document.getElementById(obj.elmt_ID);
		if(!e) return;
		if(obj.value !== undefined)
				{
					if(e.nodeName  === 'LABEL')e.innerHTML= obj.value;
					else if(e.type === 'checkbox'){  if(obj.value == true)e.checked = true;  else e.checked = false;}
					else e.value = obj.value;
				}
		ui_button(obj.elmt_ID, obj);		
}
			


















	function modal_confirm(o, cb) 
		{
			if(typeof o === 'string')
			o = {title: '',	content:	 '<table> <tr><td><img src="/images/question.png"></img></td><td>	&nbsp;	&nbsp; </td> <td>  <font><b>' + o + '</b><br></td></tr></table>',	theme: 'red'	};
			
					var dlg_hndl = BootstrapDialog.show(
						{							
											title: o.title,												
											//message:   msg,							
										//	message:   '<table> <tr><td><img src="/images/question.png"></img></td><td>	&nbsp;	&nbsp; </td> <td>  <font><b>' + msg + '</b><br></td></tr></table>',								
											message:  o.content,
											draggable: true,
											closeByBackdrop: false,
											closable : false,
											animate: false,
									//		cssClass: 'ddd-dialog',	 
											close : function(){	cb(false); },
											buttons: [	
																{ label: 'Yes', id: 'dlg_btn1q', cssClass: "dt-button  round-btn ",	action:  function(d){	d.close(); cb(true); }},  
																{ label: 'No', cssClass: "dt-button  round-btn ",	action:  function(d){	d.close(); cb(false); }} 
															]
						});

				// Set size:
				dlg_hndl.$modal.find('.modal-dialog').css("width", "30%");

				setTimeout(function()
						{
							$('#dlg_btn1q').focus();
						},100);	// 25 - too short		
		}

		
		
	function modal_alert(o, cb) 
		{	
					if(typeof o === 'string')
					o = {title: '',	content: '<br><table class="bootstrap-dialog-message_selected_text"> <tr><td><img src="/images/information.png"></img> </td><td>	&nbsp;	&nbsp; </td> <td> <b>' + o + '</b><br> <b>' + '</b><br></td></tr></table>',	theme: 'red'	};
					
					if(o === undefined) return;
					var dlg_hndl = BootstrapDialog.show(
						{								
											title: o.title,												
											message:   o.content,							
											draggable: true,
											closeByBackdrop: false,
											animate: false,
											cssClass: 'ddd-dialog',	             
											buttons: [{label: 'Ok',  id: 'dlg_btn1q', cssClass: "dt-button  round-btn ",	action:  function(d){	d.close(); if(cb)cb();	}}]     
						});					
								
				// Set size:
				dlg_hndl.$modal.find('.modal-dialog').css("width", "30%");			
			
				setTimeout(function()
					{
						$('#dlg_btn1q').focus();
					},100);	// 25 - too short								
		}
			
		

	function modal_error(o, cb) 
		{
					if(typeof o === 'string')
					o = {title: 'Error',	content: '<br><table class="bootstrap-dialog-message_selected_text"> <tr><td><img src="/images/error.png"></img> </td><td>	&nbsp;	&nbsp; </td> <td> <b>' + o + '</b><br> <b>' + '</b><br></td></tr></table>',	theme: 'red'	};
					
					if(o === undefined) return;
					var dlg_hndl = BootstrapDialog.show(
						{								
											title: o.title,												
											message:   o.content,							
											draggable: true,
											closeByBackdrop: false,
											animate: false,
											cssClass: 'ddd-dialog',	             
											buttons: [{label: 'Ok',  id: 'dlg_btn1q', cssClass: "dt-button  round-btn ",	action:  function(d){	d.close(); if(cb)cb();	}}]     
						});				
				
				// Set size:
				dlg_hndl.$modal.find('.modal-dialog').css("width", "30%");			
			
				setTimeout(function()
					{
						$('#dlg_btn1q').focus();
					},100);	// 25 - too short								
		}
			
	
		
	function modal_prompt(cb, o, default_value) 
		{
			var dlg= (function () {/*
				<fieldset class="form">			
					 <table class="bootstrap-dialog-message_selected_text">
						 <tr><td><img src="/images/question.png"></img> </td>
						 <td>			 &nbsp;			 &nbsp; 			 </td>
						<center>	 <tr class="col-full"><td>____p1___:</td><td><input id="value_box"  class="form-control" type="text"  value = "___p2____" ></input></td>	<center>
					 </table>			
				</fieldset>
				*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1].replace(/\r\n/g, "").replace(/____p1___/g, o  )  .replace(/___p2____/g, default_value  ) ; 
				

			if(typeof o === 'string')	o = {		title: ' ',			content: dlg,				theme: 'red'	};
				if(o === undefined) return;
				var dlg_hndl = BootstrapDialog.show(
						{								
							title: o.title,												
							message:   o.content,							
							draggable: true,
							closeByBackdrop: false,
							animate: false,
							cssClass: 'ddd-dialog',	             
							buttons: 
							[
								{label: 'Ok',  id: 'dlg_btn1q', cssClass: "dt-button  round-btn ",	action:  function(d){  if(cb)cb( value_box.value ); d.close();	}},
							]    											
						});					
			
			// Set size:
			dlg_hndl.$modal.find('.modal-dialog').css("width", "30%");			
			
			// Keyboard input listener:
			$("#value_box").bind("keypress", {}, keypress);

			
			function keypress(e)
				{
					var code = (e.keyCode ? e.keyCode : e.which);
					if(code == 13) {
						e.preventDefault();
						if(cb)cb( value_box .value );					
						dlg_hndl.close();
					}
				};
									
			// Make 'Ok' default focus:
			if(0)
			setTimeout(function(){	$('#dlg_btn1q').focus();	},100);	// 25 - too short								
						
			// Make text area default focus:	
			setTimeout(function(){	$('#value_box').focus();	},100);	// 25 - too short
		}
					

			
	function modal_input_number(cb, title, default_value) 
		{
				var dlg= (function () {/*
					<fieldset class="form">			
						 <table class="bootstrap-dialog-message_selected_text">
							 <tr><td><img src="/images/number_sign.png" width="50" height="50"></img>  </td>
							 <td>			 &nbsp;			 &nbsp; 			 </td>
							<center>	 <tr class="col-full"><td>____p1___:</td><td><input id="value_box"  class="form-control" type="text"  value = "___p2____" ></input></td>	<center>
						 </table>			
					</fieldset>
					*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1].replace(/\r\n/g, "").replace(/____p1___/g, title  ).replace(/___p2____/g, default_value);
				
				
				var dlg_hndl = BootstrapDialog.show(
						{								
							title: 'Number',												
							message:   dlg,							
							draggable: true,
							closeByBackdrop: false,
							animate: false,
							cssClass: 'ddd-dialog',	             
							buttons: 
							[
								{label: 'Ok',  id: 'dlg_btn1q', cssClass: "dt-button  round-btn ",	action:  function(d){  getValue() ; d.close();	}},
							]    											
						});					
			
			
				function getValue() 
				{
					var p = value_box.value;
					p = p.replace(/,/, ".");				
					p = parseInt(p);
					if( isNaN(p) ) return  modal_error('Wrong walue');					
					if(cb)cb( p );
				}				
				
				// Set size:
				dlg_hndl.$modal.find('.modal-dialog').css("width", "30%");			
				
				// Keyboard input listener:
				$("#value_box").bind("keypress", {}, keypress);
				
				function keypress(e)
					{
						var code = (e.keyCode ? e.keyCode : e.which);
						if(code == 13)
						{
							e.preventDefault();
							getValue();					
							dlg_hndl.close();
						}
					};
							
				// Make text area default focus:	
				setTimeout(function(){	$('#value_box').focus();	},100);	// 25 - too short
		}
			







//=======================
function ui_button(id, obj)
{ 
			var e = document.getElementById( id );

		 	if(typeof obj !== 'object')
				{
					//console.log('Button pressed:  id= ', id, '  o= ', obj);
					// 1. Enable progress bar animation.
					//	apiProgress.hidden = false;
					// 2. Apply default button class.

					//---- e.setAttribute('class', 'neutral_c'); 
					e.classList.remove('green_c');
					e.classList.remove('red_c');
					e.classList.remove('amber_c');
					//e.classList.add('neutral_c');
					
					return ui_button.bind(0,  id);
				}					
			else
				{
					if(obj.color)
						{

							console.log('  OLD CODE CALLEDHERE!');
							if(obj.color === 'green')e.classList.add('green_c');
							else if(obj.color === 'red')e.classList.add('red_c');
							else if(obj.color === 'amber')e.classList.add('amber_c');
							//---- setTimeout(function(){e.setAttribute('class', "neutral_c"); }, 6000);
							setTimeout(function(){						
								e.classList.remove('green_c');				e.classList.remove('red_c');			e.classList.remove('amber_c');
								//e.classList.add('neutral_c');						
								}, 8000);
						}
				
					else
						{				
							// 1. Dissable progress bar animation.
							//	apiProgress.hidden = false;	
							// 2. Apply status button class.
							if( obj.timeout ) classColor = 'amber_c';
							//--- else if( obj.error || obj.status==false || obj.status==undefined || obj.status.error) var classColor = 'red_c';
							else if( obj.error || obj.status==false || (obj.status &&obj.status.error)) var classColor = 'red_c';
							else if( obj.status ) classColor = 'green_c';												

						//	if( obj.error === undefined && obj.status === undefined ) var classColor = 'neutral_c';
							
							if( obj.status && obj.status.det )  console.log( "msg #8812: ", obj.status.det )

							e.classList.remove('green_c');
							e.classList.remove('red_c');
							e.classList.remove('amber_c');
							e.classList.add(classColor);
							setTimeout(function(){				e.classList.remove(classColor);			}, 8000);			
						}
					

					// 3. Show messages:
					//if(obj.error || obj.status==false || obj.status==undefined  )create_balloonAtElementId(id, obj.msg);
					//create_balloonAtElementId(id, obj.msg);
				}
}



var outerWrapper;


//=======================
function compUdp_oninput (id)	
						{
							// 1. update indicator
							var e =  document.getElementById(id);
							var indicator = e.getAttribute('indicator');

							function tt_Init(e)
							{
								if(outerWrapper) return;
								outerWrapper              = document.createElement('span');
								var inpHeight = 20;
								outerWrapper.style.height = inpHeight + "px";
							}

							var setValue = function(range, rangeV)
							{
								//range = document.getElementById('range'),
								rangeV = document.getElementById('rangeV');
								const      newValue = Number( (range.value - range.min) * 100 / (range.max - range.min) ),     newPosition = 10 - (newValue * 0.2);
								rangeV.innerHTML = `<span>${range.value}</span>`;
								rangeV.style.left = `calc(${newValue}% + (${newPosition}px))`;
							};
														 
							
							tt_Init(e);
							setValue (e, indicator);

							// Add/Remove classname utility functions
							var addClass = function(e,c) {
								if(new RegExp("(^|\\s)" + c + "(\\s|$)").test(e.className)) { return; };
								e.className += ( e.className ? " " : "" ) + c;
							};

							var removeClass = function(e,c) {
								e.className = !c ? "" : e.className.replace(new RegExp("(^|\\s)" + c + "(\\s|$)"), " ").replace(/^\s\s*/, '').replace(/\s\s*$/, '');
							};


							addClass(outerWrapper, 'fd-slider-active');
							addClass(outerWrapper, 'fd-slider-focused');

							e.parentNode.insertBefore(outerWrapper, e);
						}
						
						
//=======================
function compUdp_onchange (id)	
						{												
							var data = {};
							var e =  document.getElementById(id);													//console.log('on onchange' , id);
							// 2. send value to server:
							var APIcmd = e.getAttribute('command');
							var APIparam = e.getAttribute('parameter');						

							var APIobject = e.getAttribute('sendObject');
							if(APIobject) data = APIobject;

							if(!APIparam)data = e.value; 
							else data[APIparam] = e.value;

							MISO_cmd3(APIcmd, data, function(ret)
									{
										// 3. update indicator with server's response:
										//document.getElementById( e.getAttribute('indicator') ).innerText = serversValue;	e.value = serversValue;
										// 3.1. API feedback:
										ui_button(id, ret);
										// 4. show error bubble:
		//								if(!ret.status && ret.msg) create_balloonAtElementId_new(id, ret.msg);
									});			
						}





						



//========================= 4 devel ============================
//=======================
function create_balloonAtElementId_new(id, text)
					{	 
	return;
							if( ! document.getElementById("bubbleID")  )  $('<div id="bubbleID" ></div>').appendTo('body');
							   $("#bubbleID").dialog({
									width: 'auto', 	//	'min-height': 'auto',
								 	keyboard: true,		backdrop: 'enable', 				// modal: true, 
									clickOutside: true, // clicking outside the
									title:  'Error occurred:' ,
									//buttons: [{       text: "Ok",    click: function() {       $( this ).dialog( "close" );     }   }],
									position: { my: "left+" + $('#'+id).width()    + "px", of: '#'+id 	},
								}).html(    text   ) .css( "background","lightgrey").css( "opacity","0.90").css("overflow: auto;");
					}




/*
			


function create_balloonAtElementId(id,text)
{
	if( ! document.getElementById("bubbleID")  )  $('<div id="bubbleID" ></div>').appendTo('body');
				   $("#bubbleID").dialog({
						width: 'auto', //'100px',
						'min-height': 'auto',
					//	backdrop: 'static', 
						keyboard: true,
						clickOutside: true, // clicking outside the
		 				title:  'Error occurred:' ,
					 //	buttons: [{       text: "Ok",    click: function() {       $( this ).dialog( "close" );     }   }],
						position: { my: "left+10  bottom", of: '#'+id 	},
					// }).css("font-size", "15px").css( "background","grey").css( "opacity","0.95");	//	}).css("overflow: auto;").next(".ui-widget-overlay");
					}).html(    text   ).css("font-size", "15px").css( "background","lightgrey") ;	//	}).css("overflow: auto;").next(".ui-widget-overlay");

					//$("#bubbleID").css( "opacity","1.35");
	
					$(".ui-dialog-title").css("font-size", "13px").css("width", "auto").css("height", "14px");
				//	$(".ui-widget-content").css( "opacity","0.35");
			
}*/

/*
function create_balloonAtElementId(id,text)
{
	if( ! document.getElementById("bubbleID")  )  $('<div id="bubbleID" ></div>').appendTo('body');
				   $("#bubbleID").dialog({
						//width: 'auto', //'100px',
						width: '300px',
					//	'min-height': 'auto',
					//	backdrop: 'static', 
						backdrop: 'enable', 
						keyboard: true,
						clickOutside: true, // clicking outside the
		 				//title:  'Error occurred:' ,
					 //	buttons: [{       text: "Ok",    click: function() {       $( this ).dialog( "close" );     }   }],
						position: { my: "left+10  bottom", of: '#'+id 	},
					// }).css("font-size", "15px").css( "background","grey").css( "opacity","0.95");	//	}).css("overflow: auto;").next(".ui-widget-overlay");
					}).html(    text   ).css("font-size", "15px").css( "background","lightgrey") ;	//	}).css("overflow: auto;").next(".ui-widget-overlay");

					//$("#bubbleID").css( "opacity","1.35");
	
		//			$(".ui-dialog-title").css("font-size", "13px").css("width", "auto").css("height", "14px");
				//	$(".ui-widget-content").css( "opacity","0.35");
			
}




*/


//=======================================================================================
			


