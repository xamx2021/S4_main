#!/usr/bin/node
"use strict"; 
var superConstructor = require('./inc__common.js'); 
var secondsToDhms = require('./inc__common.js').secondsToDhms;

var bytesToSize = require('./inc__common.js').bytesToSize;




var HW_PLATFORM_RPI  = require("../_config.js").HW_PLATFORM_RPI;
var LOG = require('../sys_logBox.js')();


//------------------- MODULE CONSTRUCTOR: -----------
var _moduleScope = function () 
	{ 
		var moduleScope  =	superConstructor.Constructor(_moduleScope, arguments);
		init(moduleScope);	 
		return moduleScope.prototype;
	};
module.exports = _moduleScope; 
 

//==================================================================================
//==================================================================================
function init(exemplar)
{
	var mod_rnd  = exemplar.prototype.mod_rnd;
	var sb = exemplar.prototype.sb;
			
		//------------------- GUI update: (on gui connecter/reloaded) -----------
		sb.on('MISO_getAdminGUIupdate', function(input)
			{						
				LOG.load(function(row)
					{
						if(row)input.MOSI_UCT( {Dom_remote_procedure_call: { function_ID: 'showMiniLogTable', params: row}}  );
					});
			});
	
				
		//------------------- Get log : -----------			
		sb.on('on_log_test_BTN' + mod_rnd, function(input)
		{
				input.ACK_MOSI( true);
				LOG.load(function(row)
					{
						if(row)input.MOSI_UCT( {Dom_remote_procedure_call: { function_ID: 'showMiniLogTable', params: row}}  );
					});				
			});

		//------------------- Delete log : -----------			
		sb.on('on_log_delete_BTN' + mod_rnd, function(input)
			{				  					
				LOG.delete(	function(err)
					{
						if(err) return input.ACK_MOSI( false, 'History error.');		
						input.ACK_MOSI( true );
						sb.emit( 'MISO_getAdminGUIupdate', input );
					});					
			});		
			
		//------------------- Test log : -----------			
		sb.on('on_log_test_BTN' + mod_rnd, function(input)
			{
				LOG.write(null, null, 'TEST', input.data.value, function(err)
					{
						if(err) return input.ACK_MOSI( false, 'History was not updated.');		
						input.ACK_MOSI( true, 'ok' );
						sb.emit( 'MISO_getAdminGUIupdate', input );
					});					
			});			
							

		
			
		//------------------- Get stdio log : -----------			
		sb.on('on_stdio_log_BTN' + mod_rnd, function(input)
			{
				if( !HW_PLATFORM_RPI ) return input.ACK_MOSI( false , 'Only available in POSIX' );
				var fs = require('fs');
				fs.readFile('/var/log/ESP_4_ESPserver.log.txt', 'utf8', function(err, data)
				 {
					if (err) throw err;
					console.log(data);
					input.ACK_MOSI( true, data );
				});
			});			
							


		//------------------- Geta all module's IDs : -----------			
		sb.on('on_infrastructureIDs_BTN' + mod_rnd, function(input)
			{
				if(input.data === 'clear') sb.all_infrastructure_IDs = {};

				var str = '';
				for( var i in sb.all_infrastructure_IDs )	str += 'Device ID: ' + i + ',  registered in the system: ' +  sb.all_infrastructure_IDs[i] +  '\n';			
				input.ACK_MOSI( true, str );
			});			
							
						


		//------------------- Shutdown : -----------			
		//sb.on('dev_sdown' + mod_rnd, function(input)
		//	{					
		//		if( !HW_PLATFORM_RPI )return input.ACK_MOSI( false , 'Only available in POSIX' );
		//		require('child_process').execFile("shutdown",	 ["-h", "now"],	function(err, stdout, stderr) 	{ 	});
		//	});			
			



		//-------------------------------[ H/W sensors ]------------------------------------------ Begin
		var os = require('os');		
		if( HW_PLATFORM_RPI )
			{
				var RpiThrottled = require('rpi-throttled');
				var rpi = new RpiThrottled();
				rpi.update(false);
				var vcgencmd = require('vcgencmd');		
			}




		setInterval( function()
			{
						// Platform independed:
						var loads = os.loadavg();	//Returns an array containing the 1, 5, and 15 minute load averages.
						if( loads[1] )	
							   sb.broadcast(JSON.stringify({MOSI_GUI_SETelement: true, elmt_ID: 'cpuLoadMin', value: loads[1].toFixed(2) }));
										
						var freeMem = os.freemem();			// Returns the amount of free system memory in bytes as an integer.
						if(freeMem)
							   sb.broadcast(JSON.stringify({MOSI_GUI_SETelement: true, elmt_ID: 'systemFreeMem', value: bytesToSize(freeMem) }));

						var totalMem = os.totalmem();		// Returns the total amount of system memory in bytes as an integer.</integer>
						if(totalMem)
							   sb.broadcast(JSON.stringify({MOSI_GUI_SETelement: true, elmt_ID: 'systemTotalMem', value: bytesToSize(totalMem) }));

						var uptime = os.uptime();			//    Returns the system uptime in number of seconds.
							   if(uptime)
									sb.broadcast(JSON.stringify({MOSI_GUI_SETelement: true, elmt_ID: 'systemUptime', value:  secondsToDhms(uptime	) }));
	   
						// Platform depended:
					 	if( !HW_PLATFORM_RPI ) return;
						rpi.update();			//read current values from rPi, wait until ready								
						var f = vcgencmd.measureClock('core')/1000000;
						var t = vcgencmd.measureTemp();
						var volt = vcgencmd.measureVolts('core');
						vcgencmd.cacheFlush();						
						if(rpi.underVoltage != false)	
							   sb.broadcast(JSON.stringify({MOSI_GUI_SETelement: true, elmt_ID: 'boardUnderpowered', value: 'Low PSU voltage'}));
						else sb.broadcast(JSON.stringify({MOSI_GUI_SETelement: true, elmt_ID: 'boardUnderpowered', value: ''}));						
						sb.broadcast(JSON.stringify({MOSI_GUI_SETelement: true, elmt_ID: 'cpuVoltage', value: volt }));
						sb.broadcast(JSON.stringify({MOSI_GUI_SETelement: true, elmt_ID: 'cpuTemp', value: t }));
						sb.broadcast(JSON.stringify({MOSI_GUI_SETelement: true, elmt_ID: 'cpuFreq', value: f.toFixed(1)}));						
						//cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq
						//vcgencmd measure_clock arm						
			}, 5000);		
		//-------------------------------[ H/W sensors ]------------------------------------------ End

 
}	







//==================================================================================
//==================================================================================
var html = (function () {/*
<table style="table-layout:fixed;">			
			
			<tr><td colspan="2"  >			
						<textarea rows="20" cols="100" id="Sys_log___UnId___"  style=" background: rgba(150, 150, 150, 0.5) "> 		</textarea> 
						<script>
				
								function showMiniLogTable (tt)
								{							
									document.getElementById('Sys_log___UnId___').value = ''   ;
									for(var i in tt)document.getElementById('Sys_log___UnId___').value += tt[i].dtime +  ' '  + tt[i].data  + '\r\n'; 
								}
						</script>
			<!--			 

			
			</td></tr>
					<tr><td>
					<label>Keep data on the system:</label></td><td>		
					<select id="keepDataDays" onchange="MISO_cmd3(id, value , ui_button(id));">
					<option value="1">1 day</option>
					<option value="2">2 days</option>
					<option value="3">3 days</option>
					<option value="4">4 days</option>
					<option value="5">5 days</option>
					<option value="6">6 days</option>				
					<option value="10">10 days</option>
					<option value="7">1 week</option>
					<option value="30">1 month</option>
					<option value="360">1 year</option>
					</select>
			</td></tr>
		-->
		<!--
		<tr><td>
					<label data-hint="Save system log to a file.">Export log:</label></td><td>
					<input  id="get_log_request" type="button" value="Export log" onchange=" 	MISO_cmd3('get_log_request', {} , ui_button(id));">
			</td></tr>
			<script>		
			function downLog(log)
				{
					var txt = '';
					for(var i in log)
						{
						var EPC = log[i].epc;
						if ( EPCs[EPC] && EPCs[EPC].itemName ) var epc_edit = EPCs[EPC].itemName;				else  var epc_edit = EPC;					
						txt+=log[i].dtime + ';' + log[i].action + ';' + epc_edit + ';' + log[i].ch + ';' + log[i].data + ';\n';					
						}
					download('log.txt', txt );
				}
			
			//================DOWNLOAD FILE VIA WEBSOCKET:===============
			function download(filename, text)
				{  		var element = document.createElement('a');  
						element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));element.setAttribute('download', filename);
						element.style.display = 'none';  document.body.appendChild(element);  element.click();  document.body.removeChild(element);	
				}		
				
			document.addEventListener("MOSI_file_upload", function(e) {  download(e.detail.MOSI_file_upload.fname, e.detail.MOSI_file_upload.data);});
			</script>			 
			-->		 

			<!--
			<tr><td>
					<label data-hint="Test system log, add a new line .">Test log:</label></td><td>			
					<button class="s_ctrl_btn_c"  id="test_log___UnId___" onclick= " MISO_cmd3('on_log_test_BTN___UnId___', {value:' Hello world, it\'s a small test'},   ui_button(id));    "> Test </button>
			</td></tr>
			-->
					




					

			<tr><td>
					<label data-hint="Delete all data in the system log.">Erase log:</label></td><td>					
					<button 
						class="s_ctrl_btn_c"  
						id="erase_log_request"
						 onclick= " modal_confirm('Delete the log?', function(r)
						 	{	
								 if(r) MISO_cmd3('on_log_delete_BTN___UnId___',  {},   ui_button(id));
							})  "> Erace </button>					
			</td></tr>

			<tr><td>
					<label data-hint="">Clear local storage:</label></td><td>
					<button 
						class="s_ctrl_btn_c"  
						id = 'btn_clear_locStr_173' 
						onclick="modal_confirm('Empty local storage?', function(r)
						{
							 if(r) localStorage.clear();  
						 });"> Clear</button>					
			</td></tr>			
			
			<tr><td>
					<label data-hint="">Get stdio log:</label></td><td>
					<button 
						class="s_ctrl_btn_c"  
						id = 'LOG_std_get' 
						onclick=" console.log(id); MISO_cmd3('on_stdio_log_BTN___UnId___', {},  function(id,data)
							{		
								if( data.msg === undefined || data.msg.length == 0) data.msg = 'No data';						
								document.getElementById('Sys_log___UnId___').value =data.msg;
								ui_button(id,data);
							}.bind(0, id)  );  ">Get stdio log</button>					
			</td></tr>
			
			<tr><td>
					<label data-hint="">Get IDs in the infrastructure:</label></td><td>
					<button 
						class="s_ctrl_btn_c"  
						id = 'ID_dev_get' 
						onclick="  MISO_cmd3('on_infrastructureIDs_BTN___UnId___', 'get',  function(id,data)
							{
								if( data.msg === undefined || data.msg.length == 0) data.msg = 'No data';
								document.getElementById('Sys_log___UnId___').value = data.msg;
								ui_button(id, data);
							}.bind(0,id)   ); ">Get infrastructure IDs</button>
					<button 
						class="s_ctrl_btn_c"  
						id = 'ID_dev_get' 
						onclick="  MISO_cmd3('on_infrastructureIDs_BTN___UnId___', 'clear',  function(id,data)
							{
								if( data.msg === undefined || data.msg.length == 0) data.msg = 'No data';
								document.getElementById('Sys_log___UnId___').value = data.msg;
								ui_button(id, data);
							}.bind(0,id)   ); ">Clear infrastructure IDs</button>			
							
							

			</td></tr>






			
			<!--
			<tr><td>
					<label data-hint="Safely turn the system off.">System shutdown:</label></td><td>			
					<button class="s_ctrl_btn_c"  id="b02___UnId___"  onclick="if( confirm('Shut down?') )MISO_cmd3('dev_sdown___UnId___',  {},   ui_button(id));" > Shutdown </button>
			</td></tr>			
			-->

			<tr><td>
					<label>CPU temperature, °C:</label></td><td>
					<div> <label  id="cpuTemp"> n/a </label> &nbsp; <font color="red"><label id ="cpuTempOver"  ></label></font></div> 
			</td></tr>				
			
			<tr><td>
					<label>CPU Frequency, Mhz:</label></td><td>
					<div> <label  id="cpuFreq"> n/a </label> </div> 
			</td></tr>	
			
			<tr><td>
					<label>CPU 5 minute average load, %:</label></td><td>
					<div> <label  id="cpuLoadMin"> n/a </label> </div> 
			</td></tr>
			
			<tr><td>
					<label>CPU voltage, V:</label></td><td>
					<div> <label  id="cpuVoltage"> n/a </label> &nbsp; <font color="red"><label id ="boardUnderpowered"  ></label></font></div> 
			</td></tr>	
 
			<tr><td>
					<label>Available system memory:</label></td><td>
					<div> <label  id="systemFreeMem"> n/a </label> </div> 
			</td></tr>		
						
			<tr><td>
					<label>Total system memory:</label></td><td>
					<div> <label  id="systemTotalMem"> n/a </label> </div> 
			</td></tr>
			
			<tr><td>
					<label>System uptime:</label></td><td>
					<div> <label  id="systemUptime"> n/a </label> </div> 
			</td></tr>		

			<tr><td>
					<!-----[ Theme selector ]----------------------------------->
					<!-- <script src="/theme_css_loader.js"></script> -->
					<label>Theme:</label></td><td>
                    <select id="user_theme_box" onchange=" css_from_path_and_save_new( this );">						
						<option value="white_1">white/green</option>
                        <option value="white">white(windows10)</option>
                        <option value="black">black</option>                      
                       <!-- <option value="green">le-frog</option>	-->
                    </select>
                    <script>
                        $(document).on('____on_ws_connect', function (o, data) { user_theme_box.selectedIndex = userTheme_sn; });
                    </script>
			</td></tr>	

		
		
	</table>
		

 */}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];

 


 



_moduleScope.html_n = html;