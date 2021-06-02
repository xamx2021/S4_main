#!/usr/bin/node
"use strict";





//------------------- MODULE CONSTRUCTOR: -----------
var _moduleScope = function(){};

_moduleScope.Loader = function  (moduleScope,  moduleScope1, params)
{
	// (_module_name, id, _sb,  _GCONF, _cindex) 
}

_moduleScope.Constructor = function ( moduleScope1, params ) 
	{
		var moduleScope  = function(){};
		moduleScope.prototype.module_name = params[0];
		moduleScope.prototype.local_id = params[1];
		moduleScope.prototype.sb = params[2];
		moduleScope.prototype.html = moduleScope1.html_n;
		moduleScope.prototype.htmlShort = moduleScope1.htmlShort_n;
		moduleScope1.GCONF = params[3];
		moduleScope.prototype.remoteConnected = false;				// offline | online	  as  true | false (default value if false)
		moduleScope.prototype.mod_rnd =Math.floor(Math.random() * 1000) + 1;
		moduleScope.prototype.pluginEnabled = true;
		try{
			moduleScope.prototype.html = moduleScope.prototype.html.replace( /___UnId___/g, moduleScope.prototype.mod_rnd );
			if(moduleScope.prototype.htmlShort )moduleScope.prototype.htmlShort = moduleScope.prototype.htmlShort.replace( /___UnId___/g, moduleScope.prototype.mod_rnd );
		}catch(e)
		{
			console.log('Error #410000, when initializing a plugin: ' + moduleScope.prototype.module_name);
		}



			//------------------- Device connection status indicator: -----------
 		moduleScope.prototype.gui_rdev_status = function()
				{
					moduleScope.prototype.sb.broadcast(JSON.stringify({Dom_remote_element_upd: { elmt_ID: 'module_ID' + moduleScope.prototype.mod_rnd, code: 'ModuleID: '+moduleScope.prototype.local_id, color: ''}	} ));
					if( moduleScope.prototype.remoteConnected )
							moduleScope.prototype.sb.broadcast(JSON.stringify({Dom_remote_element_upd: { elmt_ID: 'status_icon' + moduleScope.prototype.mod_rnd, code: 'ONLINE', status: 'ok'}	} )); 
					else moduleScope.prototype.sb.broadcast(JSON.stringify({Dom_remote_element_upd:  { elmt_ID: 'status_icon' + moduleScope.prototype.mod_rnd, code: 'Offline', status: 'red'}	} ));
 
					moduleScope.prototype.sb.broadcast(JSON.stringify({Dom_remote_procedure_call: { function_ID: 'setstatus' + moduleScope.prototype.mod_rnd, params: [moduleScope.prototype.remoteConnected]}	} ));

					///  show RSSI here?

				}



			
		/*					
			moduleScope.dev.events.on('device_connected', function(socket)
				{
					console.log('Device connected: ' + socket.remote_id + ' @ '+ socket.remote_ip + ' as ' + exemplar.prototype.module_name );		
				});
		*/



							
			//------------------- Device reset: -----------
		if(moduleScope.prototype.sb)
			moduleScope.prototype.sb.on('on_reset' + moduleScope.prototype.mod_rnd, function(input)
			{
				if(!moduleScope.dev) return input.ACK_MOSI(  false, 'Device transport error');
				moduleScope.dev.DEVICE_MOSI( 
					{
							dev_cmd: 'reset', 							
					},
							function(obj){			input.ACK_MOSI(  true, 'Device reset, no feedback');		});
			});
				



			//-------------------  Update rolefile: ----------- 
		if(moduleScope.prototype.sb)
			moduleScope.prototype.sb.on('role_update' + moduleScope.prototype.mod_rnd, function(input)
			{ 
				if( !input.data ) return input.ACK_MOSI( false, 'bad input value');
				var buf = input.data.role_file_data;
				var roleName = input.data.role_file_name;
						
				if(!moduleScope.dev) return input.ACK_MOSI(  false, 'Device transport error');
			 
				if(buf.length < 1253)												// 1253 is determined by tcp packet size.
					moduleScope.dev.DEVICE_MOSI(
						{	dev_cmd: 'role_update', role_file_name: roleName, role_file_data: buf	},
						function(obj)
							{									 
								if( obj.error ) input.ACK_MOSI( false, obj.det);		
								else input.ACK_MOSI( true );
								moduleScope.prototype.gui_rdev_status();
							});
				else
					{	
						var chunks = [];		const chunkSize = 550;		//	500-byte chunk might be sent via MQTT.
						while (buf) 
							{
								if (buf.length < chunkSize) {		chunks.push(buf);			break;			}
								else {		chunks.push(buf.substr(0, chunkSize));							buf = buf.substr(chunkSize);						}
							}	
											
						
						function r_sn( i )
								{										
											console.log( 'sending chunk ' + i + ' of ' + chunks.length)
											if( i==0 ) var mode = false; else var mode = true;
											moduleScope.dev.DEVICE_MOSI(
												{dev_cmd: 'role_update', role_file_name: roleName, role_file_data: chunks[ i ], role_update_append: mode},
												function(obj)
													{	
														if( obj.error ) input.ACK_MOSI( false, obj.det);		
														else if(i == chunks.length){		input.ACK_MOSI( true );				moduleScope.prototype.gui_rdev_status();	}
														else r_sn( ++i );	//else 	setTimeout (function(){ 	r_sn( ++i );	}, 10);
													});
								}
						r_sn(0);				 					
					}				
			});
		return	moduleScope;
	};




	_moduleScope.round2precision = function (x, precision) 
		{		
			var y = +x + (precision === undefined ? 0.5 : precision/2);
			return y - (y % (precision === undefined ? 1 : +precision));
		}
		



	_moduleScope.bytesToSize = 	function (bytes) 
		{
			const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];				if (bytes === 0) return 'n/a';
			const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
			if (i === 0) return `${bytes} ${sizes[i]}`;
			return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
		}
	


	_moduleScope.secondsToDhms = function (seconds)
		{
			seconds = Number(seconds);
			var d = Math.floor(seconds / (3600*24));
			var h = Math.floor(seconds % (3600*24) / 3600);
			var m = Math.floor(seconds % 3600 / 60);
			var s = Math.floor(seconds % 60);		
			var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
			var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
			var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
			var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
		 return dDisplay + hDisplay + mDisplay + sDisplay;
		};


				

_moduleScope.deviceResetUpdateHTML = (function () {/*
									
<!-- COMMON PROCEDURES  (Upload and reset) -->
<br>
		<fieldset><legend>[ Device ]</legend>
		<span id= "module_ID___UnId___"></span>	<label id= "status_icon___UnId___"></label>
		<br>	
		<br>
		<button id="btn_010___UnId___" onclick= "MISO_cmd3('on_reset___UnId___', {}, ui_button(id));  "> Device reset</button>
		<input type="file" id="file_input___UnId___" />
</fieldset>


<script>
function readSingleFile(e) 
		{									
			var file = e.target.files[0];
			if (!file) return;
			var reader = new FileReader();
			reader.onload = function(e) 
				{
						var contents = e.target.result;
						var fName = file_input___UnId___.value.replace(/.*[\/\\]/, '');
						var code = this.result;	
						if( !fName ) return modal_alert('cannot load file');
						if( !code ) return modal_alert('cannot load file');
						modal_confirm('Save file "' + fName + '" to FLASH?', function(r)
								{											
									if(r) MISO_cmd3('role_update___UnId___',  {role_file_name: fName, role_file_data: code},  function(o)
										{ 
											if( o.status == true)
												modal_alert ( 'Upload successful, reset the device to apply changes' );
												else if(o.msg)modal_error( o.msg ); 
											ui_button('file_input___UnId___', o);															
										}); 
									else  document.getElementById('file_input___UnId___').value = "";
								});
				 };
			 reader.readAsText(file);
		}					 	

		document.getElementById('file_input___UnId___') .addEventListener('change', readSingleFile, false);			 
</script>

<script>		function setstatus___UnId___(status){}					</script>

*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];	
			

	
module.exports = _moduleScope;