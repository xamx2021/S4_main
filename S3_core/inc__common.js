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
		var EventEmitter = require('events').EventEmitter;
		//var moduleScope  =  new EventEmitter(); 

		var moduleScope  = function(){};
		moduleScope.prototype.module_name = params[0];
		moduleScope.prototype.local_id = params[1];
		moduleScope.prototype.sb = params[2];
		moduleScope.prototype.html = moduleScope1.html_n;
		moduleScope.prototype.htmlShort = moduleScope1.htmlShort_n;
		moduleScope1.GCONF = params[3];		// bus here
		moduleScope.prototype.remoteConnected = false;				// offline | online	  as  true | false (default value if false)
		moduleScope.prototype.mod_rnd =Math.floor(Math.random() * 1000) + 1;
		moduleScope.prototype.pluginEnabled = true;
		moduleScope.prototype.common =  {};
		
		//exemplar.prototype.event = new EventEmitter(); 
		moduleScope.prototype.events = new EventEmitter(); 

		try{
			moduleScope.prototype.html = moduleScope.prototype.html.replace( /___UnId___/g, moduleScope.prototype.mod_rnd );
			if(moduleScope.prototype.htmlShort )moduleScope.prototype.htmlShort = moduleScope.prototype.htmlShort.replace( /___UnId___/g, moduleScope.prototype.mod_rnd );
		}catch(e)
		{
			console.log('Error #410000, when initializing a plugin: ' + moduleScope.prototype.module_name);
		}


		
		var common = moduleScope.prototype.common;



		//-------------------   TMP Subopt 1 functions: ---------------------------------------
		common.onGet_mosi_reply = function  (err, rows, fields)
		{					
							if( err && err.code ) { console.log( 'Error accessing table.' );  return this.input.MOSI_ACK( false, this.error_msg + '  ' + err.message );	}							// if error
							this.input.MOSI_ACK( true, null, rows[0]);
							if(this.cb) this.cb();					
		};
		
		//-------------------   TMP Subopt 2 functions: ---------------------------------------
		common.onGet_mosi_replyTable = function  (err, rows, fields)
		{					
							if( err && err.code ) { console.log( 'Error accessing table.' );  return this.input.MOSI_ACK( false, this.error_msg + '  ' + err.message );	}							// if error			
							if(rows.length == 0){  return this.input.MOSI_ACK(true, null, {tabData:[]});	}
							
							this.input.MOSI_ACK( true, null,  {tabData:rows});
							if(this.cb) this.cb();
		};
		




		// Convert Hashtable to array with element order:	Data names
		common.object_ord_element_Names = function( input, enabled_fields )
		{
			var output = [];
			for (var i in enabled_fields)if( input [ enabled_fields[i] ] ) output.push (  enabled_fields[i]  );
			return output;
		}

		// Convert Hashtable to array with element order: Values
		common.object_ord_element_Value = function( input, enabled_fields )
		{
			var output = [];
			for (var i in enabled_fields)if( input [ enabled_fields[i] ] ) output.push ( input [ enabled_fields[i] ]  );
			return output;
		}

		// Convert Hashtable to array with element order:  Both datafieldname and data
		common.object_ord_element_VN = function( input, enabled_fields )
		{
			var outputD = [];
			var outputN = [];
			var outputQMS = '';
			for (var i in enabled_fields)
				if( typeof( input [ enabled_fields[i] ]) !== "undefined" )
					{
						outputD.push ( input [ enabled_fields[i] ] );
						outputN.push ( enabled_fields[i] );
						outputQMS += ( enabled_fields[i] + '=?, ' );
					}
			return [outputD, outputN, outputQMS.substring(0, outputQMS.length - 2)];
		}


		// Makes update srting for SQL:
		common.object_ord_elements_for_QMS_SQLITE3 = function( input, enabled_fields )
		{
			var output = '';
			//	for (var i in enabled_fields)if( input [ enabled_fields[i] ] ) output += enabled_fields[i] + ' = ' + input [ enabled_fields[i] ]  + ', ';
			for (var i in enabled_fields)
				if( typeof( input [ enabled_fields[i] ]) !== "undefined" ) 
					output += (enabled_fields[i] + '=?, ');
			output = output.substring(0, output.length - 2);
			return output;
		}






//--------------------------------- begin
	common.baseTableMethods_GetAll_Fa = function( input, db, sql, error_code, fa , instanceID )
	{
	//	try {
			//var sql = "SELECT * AS TxButton  FROM  '"+tableName+"';" ;				// WHERE id = '" + this.configName +"'";,	var lim = Number( input.data.top );			take: lim > 0 ? lim : undefined,
			db.all( sql, function(a,b,c,d)
				{
					for( var i in b) if( fa[b[i][instanceID]]) b[i]["Status"] = true; //else  fa[b[i].AT_InstanceID] = false;
							common.onGet_mosi_replyTable.bind(  {error_msg: error_code, input: input}, a,b,c,d )()
				});
	//	} catch(e){			common.onGet_mosi_reply.bind(  {error_msg:"ir802", input: input} )(false, e);		}
	}
		
	common.baseTableMethods_GetAll = function( input, db, sql, error_code  )
	{
	//	try {
			//var sql = "SELECT * AS TxButton  FROM  '"+tableName+"';" ;				// WHERE id = '" + this.configName +"'";,	var lim = Number( input.data.top );			take: lim > 0 ? lim : undefined,
			db.all( sql,	common.onGet_mosi_replyTable.bind(  {error_msg: error_code, input: input} )	);
	//	} catch(e){			common.onGet_mosi_reply.bind(  {error_msg:"ir802", input: input} )(false, e);		}
	}
		

	common.baseTableMethods_GetOne = function(input, db, sql, error_code )
	{
	// try{	
			db.all(sql,  common.onGet_mosi_reply.bind(  {error_msg: error_code,  input: input} ) 	);
	//	}catch(e){		common.onGet_mosi_reply.bind(  {error_msg:"ir804", input: input} )(false, e);		}
	}

		
	common.baseTableMethods_SetOne = function( input, db, c )				// GOOD WAY
	{
		var enabled_fields = c.enabled_fields;
		var tablePKey = c.key;
		var tableName = c.table;
		var log_text = c.log_text;			if(!log_text) log_text = "Item in " + tableName ;
		var error_code = c.error_code;
		var item_ID = Number.parseInt( input.data.id );

		//var cb = c.cb;
		// if(!cb) cb = common.onGet_mosi_replyWithData.bind(  {error_msg: error_code,  input: input} );
		// if(!cb) cb = common.onGet_mosi_reply.bind(  {error_msg: error_code,  input: input} );
		// if(!cb) cb = function(res, msg)
		// {
		//	input.MOSI_ACK( true, ' ok ', msg);
		// }

		input.data.actor = input.wsock_new_v.access.HCuser;	

	//	try{
		var SQLdataArray = common.object_field_filter( input.data, enabled_fields );
		//for( var key in SQLdataArray )  if( !SQLdataArray[ key ] || SQLdataArray[ key ].length == 0 ) SQLdataArray[key] = null;				// default DB value	
		// Convert Hashtable to array with element order:
		//var SQL_QMS = common.object_ord_elements_for_QMS_SQLITE3( SQLdataArray, enabled_fields );
		// Makes update srting for SQL:
		var [SQL_D, SQL_N, SQL_QMS] = common.object_ord_element_VN( SQLdataArray, enabled_fields );			//values & Names
		// Array to string:
		var valuesName = SQL_N.join();
		// Make '?,?,?,..' sequence:
		var valuesQ = '';	for( var i in SQL_N ) valuesQ+='?,';  valuesQ = valuesQ.substring(0, valuesQ.length - 1);
		
		if( isNaN( item_ID) )
				{
					var sql = "INSERT INTO "+tableName+" ("+valuesName+") VALUES ("+valuesQ+")";
					//	SQLdataArray.entered_dt = new Date().toMysqlFormat();
					//	SQLdataArray.entered_by = input.actor;
					var logf = [log_text +" created", input.wsock_new_v.access.HCuser, null, null];
				}
			else 
				{
					var sql = "UPDATE "+tableName+" SET "+SQL_QMS+" WHERE "+tablePKey+" = "+item_ID+";";
					var logf = [log_text +" updated", input.wsock_new_v.access.HCuser, item_ID, null];
					//	SQLdataArray.updated_dt = new Date().toMysqlFormat();
					//	SQLdataArray.updated_by = input.actor;				
				}

		// Log with sqlite::
		var logged_cb = function(err,mess,c,d)
			{
				if( err && err.code ) { console.log( 'Table access error, ', err.message );  return input.MOSI_ACK( false, err.message );	}							// if error			
				var a = {}
				a[tablePKey]  =		this.lastID;
				input.MOSI_ACK( true,null, a);	
				common.log(logf);    
			} 

		db.run(sql, SQL_D, logged_cb );

	//	}catch(e){		onGet_mosi_reply.bind(  {error_msg:"ir806", input: input} )(false, e);		}
	}


	common.baseTableMethods_DeleteOne = function( input, db, sql, log_text )
	{
	//	try{
			//if( ! input.data.id)return input.MOSI_ACK(false, 'missing id');			
			//var item_ID = input.data.id;//	var item_ID = Number( input.data.id );		//if(isNaN( item_ID) )return MOSI_ACK(input, false, 'ir807, missing PersonID ('+input.data.id+')');
			//var sql = 'DELETE FROM '+tableName+' WHERE  '+idName+' = \''+ item_ID +'\'';		
			//var sql = 'DELETE FROM IRcommands WHERE IR_instanceID = \''+ item_ID +'\'';	
			db.all(sql, function(er,msg)
				{
					if(er)	return input.MOSI_ACK( false, 'Error ' + msg); 
					common.log(log_text + " deleted", input.wsock_new_v.access.HCuser, input.data.id, null); 
					input.MOSI_ACK( true, null, msg );				
				});	 
	//	}catch(e){		onGet_mosi_reply.bind(  {error_msg:"ir808", input: input} )(false, e);		}
	}
 //--------------------------------- end
		


	
	


















	//================================================================= AMS	 begin
 
	
		common.accessTo = function ( input, access_property, event_name, sendFail = true )
			{
				console.log("checking" + access_property + '=' + (input.wsock_new_v.access[access_property] == true));
				if(typeof access_property === "array"  || typeof access_property === "object")
					{
							for( var i in access_property  )	if( input.wsock_new_v.access[  access_property[i]  ] == true ) return true;
							//contains											
							input.MOSI_ACK( false, 'Access denied, ['+access_property.toString()+'] is required ' );	
							return false;	
		
					}
				if (!sendFail)
					return input.wsock_new_v.access[access_property] == true;
				console.log(access_property + '=' + (input.wsock_new_v.access[access_property] == true));
				if(event_name === undefined)
				if( input.wsock_new_v.access[access_property] != true ){ 	input.MOSI_ACK( false, 'Access denied, ['+access_property+'] is required ' );	return false;	}
				else
				if( input.wsock_new_v.access[access_property] != true ){ 	input.MOSI_ACK( false, 'Access denied, ['+access_property+'] is required for <' +event_name+ '>');	return false;	}
				return true;
		}		
			
		common.sql_inj_val = function(data)
			{  
				return true;// NOT IMPLEMENTED   
		};
		
		common.isValidSQL = function (input)
			{
				return true;// NOT IMPLEMENTED
		}
		
		common.moneyNullable = function( input )
		{
			if(input && input.replace)	input = input.replace("$", "");
			return common.floatNullable(input);
		}

		common.floatNullable = function( input )
		{
			var r = Number.parseFloat( input );
			if(isNaN( r )) return null;
			return r;
		}
		
		common.textNullable = function( input )
		{		
			if(input) return null;
			return input;
		}
		
		common.intNullable = function( input )
		{
			var r = Number.parseInt( input );
			if(isNaN( r )) return null;
			return r;
		}

		common.object_field_filter = function( input, enabled_fields )
		{
			var obj = {};
			for(var i in enabled_fields)
				{
					var  t = enabled_fields[ i ];
					var key = input[ t ];
					if( key !== undefined )
						{
								if( key &&  key.length >0) key = key.trim();
								 obj[ t ] = key;
						}
					// NO!	if(isNaN(key)) obj[ t ] = null;
				}
			return obj;
		}

		common.nullable  = function(input, nullFields)
		{
			for(var i in nullFields)
				{ 
					if(isNaN( input[ nullFields[i] ] )) input[ nullFields[i] ] = null;
				}
			return input;
		}
		
		 
		
		//=================================================================
		common.bulkDelete = function(input, db, prm)
		{
			//if( ! common.accessTo(input, 'ams_warehouse_man') || ! common.isValidSQL(input) )	return MOSI_ACK(input, false, 'Access denied', null);
			input.data.actor =input.wsock_new_v.access.HCuser;
			//var db = common.db;
			var tableData = input.data.tabData;
			for(var n in tableData) tableData[n][1] = 'Deletion pending';
			var i = 0;
			var iMax = tableData.length;
			function progress_h()
			{
				input.MOSI_UCT(  {AMS_opr_progress: true,  index: i, of: iMax}  ); 
			}
			var progressbar_timer = setInterval(progress_h, 500);
			loopCall();
			function loopCall()
					{
							if(i==iMax)
								{	
									common.log(prm.log_text + " deleted via bulk op.", input.wsock_new_v.access.HCuser, input.data.id, null);							
									var table = { tabData: tableData };		 
									input.MOSI_ACK( true, '', table);								
									clearInterval( progressbar_timer );
									return;
								}
		
							if(! tableData[i]) return input.MOSI_ACK( false, 'Protocol error @ item ', tableData[i]);
							var item_ID = Number(  tableData[ i ][2]  );
							if(isNaN( item_ID) ) return input.MOSI_ACK( false, ErrorMsg [prm.error_code] );

							
							var sql = 'DELETE FROM '+prm.table+' WHERE '+prm.key+' = \''+  item_ID +'\'';
							// mysql:
							//db.query(sql, [], function(res,msg)
							//	{
							//		if(!res) {					tableData[i][1] = 'Error, ' + msg;		console.log(msg);				}
							//		else 	tableData[i][1] = 'Ok';
							//		loopCall(++i);							
							//	});

							//sqlite:							
							db.all(sql, function(err,msg)
								{
									if(err) {					tableData[i][1] = 'Error, ' + msg;		console.log(msg);				}
									else 	tableData[i][1] = 'Ok';
									loopCall(++i);							
								});



					}
		}				
		
		//=================================================================
		common.bulkImport = function (input, db, prm) {
		return new Promise(function (resolve, reject) {
			//if( ! common.accessTo(input, 'ams_warehouse_man') || ! common.isValidSQL(input) )	return MOSI_ACK(input, false, 'Access denied', null);
			input.data.actor = input.wsock_new_v.access.HCuser;
		
			var tableData = input.data.tabData;
			for (var n in tableData) tableData[n][1] = 'Import pending';
			var i = 0;
			var iMax = tableData.length;
			function progress_h() {
				input.MOSI_UCT( { AMS_opr_progress: true, index: i, of: iMax });
			}
			var progressbar_timer = setInterval(progress_h, 500);
			loopCall();
			function loopCall() {
				if (i == iMax) {
					common.log(prm.log_text_import, input.wsock_new_v.access.HCuser, input.data.id, null);
					var table = { tabData: tableData };
					input.MOSI_ACK( true, 'ok', table);
					clearInterval(progressbar_timer);
					resolve();
					return;
				}
		
				if (!tableData[i]) return;
				tableData[i][1] = 'Processing...';
				var importData = prm.formatFu(tableData, i);
		
				if (importData.prs_error == true) {
					tableData[i][1] = importData.msg;
					loopCall(++i);
					return;
				}
		
				importData.actor = input.wsock_new_v.access.HCuser;
				prm.updateFu(importData, function (res, msg) {
					var newItemID = msg.insertId;
					var itemID = importData.id;
					if (!res) {
						//if(msg.indexOf("ER_DUP_ENTRY"))  msg= " Duplicate entry ";
						//else if(msg.indexOf("ER_ROW_IS_REFERENCED_1"))  msg= " a foreign key constraint";	
		
						tableData[i][1] = 'Error, ' + msg;
						console.log('ERROR: ' + prm.error_code, msg);
					}
					else {
						tableData[i][1] = 'Ok';
						if (itemID) common.log(prm.log_text_update, input.wsock_new_v.access.HCuser, itemID, null);
						else common.log(prm.log_text_create, input.wsock_new_v.access.HCuser, newItemID, null);
					}
		
					loopCall(++i);
				});
			}
		})
		}				
		
		//=================================================================
		common.bulkExport  = function(input, db, prm)
		{						
			var sql = 'SELECT ' + prm.fields.toString() + ' FROM ' + prm.tableName;
			// mysql:
			//db.query(sql, [], function(res, tabData)
			//	{
			//		if(!res)return input.MOSI_ACK(  false, prm.error_code, tabData );
			//		input.MOSI_ACK(  true, null, {tabData} );
			//	});
			//sqlite:
			db.all(sql, function(err, tabData)
				{
					if(err)return input.MOSI_ACK(  false, prm.error_code, tabData );
					input.MOSI_ACK(  true, null, {tabData} );
				});


		}

		


		common.log = console.log;
		
//////////////////////////////////////// end of AMS


























		
		//------------------- LIST ALL active modules (drop-down select) -----------		
		moduleScope.prototype.sb.on('on_get_list_all_modules', function(input)
			{
				//var bus = GCONF.bus_inc;
				var bus = moduleScope1.GCONF.bus_inc;
				var data = [];
				for(  var n=0;  n<bus.length; n++ )	
						if(bus[n].local_id)
							data.push({ 	modNm:	bus[n].module_name,   modActions:	bus[n].module_actions,   modEvents:	bus[n].module_events,         modID:    	bus[n].local_id    });

				input.MOSI_ACK( true, '', data);	
			});



			//function findModuleByID( id )
			moduleScope.prototype.findModuleByID = function( id )
			{									
					//var bus = GCONF.bus_inc;
					var bus = moduleScope1.GCONF.bus_inc;
					var modNo = undefined;
					for(  var n=0;  n<bus.length; n++ ) if( bus[n].local_id == id ){ if(modNo) console.log("AHTUNG #6909, multiple modules assigned on same chipid"); modNo  = n; }
					if(modNo)return bus[modNo];
					// else, if module not found, return empty object:
					console.log('Warning #8123.1 module not foumd.');
					return {};
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

							
			//------------------- Device reset: -----------
		if(moduleScope.prototype.sb)
			moduleScope.prototype.sb.on('on_reset' + moduleScope.prototype.mod_rnd, function(input)
			{
				if(!moduleScope.dev) return input.ACK_MOSI(  false, 'Device transport error');
				moduleScope.dev.DEVICE_MOSI( 
					{
							dev_cmd: 'reset', 							
					},
							//function(obj){			input.ACK_MOSI(  true, 'Device reset, no feedback');	 moduleScope.prototype.remoteConnected = false;    moduleScope.prototype.gui_rdev_status();	});
							function(obj){			
								input.ACK_MOSI(  true, 'Device reset, no feedback');	 
								moduleScope.prototype.remoteConnected = false;    
								moduleScope.prototype.sb.broadcast(JSON.stringify({Dom_remote_element_upd:  { elmt_ID: 'status_icon' + moduleScope.prototype.mod_rnd, code: 'Rebooted'}	} )); 	
							});
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



			
		/*					
			moduleScope.dev.events.on('device_connected', function(socket)
				{
					console.log('Device connected: ' + socket.remote_id + ' @ '+ socket.remote_ip + ' as ' + exemplar.prototype.module_name );		
				});
		*/


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
			

	



//----------------------------------------------------------------------------------------------------------------
var KalmanFilter = require('kalmanjs');
_moduleScope.derivative = function(array, key, n, window, Q)
{   
	//var filter = new KalmanFilter({R: 0.6, Q: 0.001});
	//var filter = new KalmanFilter({R: 0.5, Q: 0.1});		// precise 
	//var filter = new KalmanFilter({R: 0.5, Q: 200});		// nice looking
	var filter = new KalmanFilter({R: 0.5, Q: Q});		// nice looking

	var wi = 0;
	var derivative = null;
	var previous, current, previousT, currentT;
	// Iterating through the  given interval:
	// Note not every data-point contains KEY value.
	for(var i = array.length - n; i < array.length; i++)
		{
			if(!array[i]) continue;
			current = array[i][key];
			currentT = array[i].time;
			if(current === undefined)continue;
			if(previous === undefined){	previous = current;	previousT = currentT; continue;	}
			if(window>wi++) continue;
			wi = 0;							
			derivative  =  filter.filter(    (current - previous)/((currentT- previousT)/60000)    );
			previous = current;	
			previousT = currentT;
		}
	return derivative;
}


/*

		// Find the peak element in the array
		function findPeak(arr, n)
			{		
				// first or last element is peak element
				if (n == 1) return 0;
				if (arr[0] >= arr[1]) return 0;
				if (arr[n - 1] >= arr[n - 2]) return n - 1;

				// check for every other element
				for (var i = 1; i < n - 1; i++)
				{
				
				// check if the neighbors are smaller
				if (arr[i] >= arr[i - 1] && arr[i] >= arr[i + 1]) return i;
				}
		}

		var arr = [1, 3, 20, 4, 1, 0];
		var n = arr.length;  console.log("1Index of a peak point is " + findPeak(arr, n));
			
		
		// A binary search based function that returns index of a peak element
		function findPeakUtil(arr, low, high, n)
		{
			// Find index of middle element (low + high)/2
			var mid = low + parseInt((high - low) / 2);
		
			// Compare middle element with its neighbours (if neighbours exist)
			if ((mid == 0 || arr[mid - 1] <= arr[mid]) &&   (mid == n - 1 || arr[mid + 1] <= arr[mid]))        return mid;
		
			// If middle element is not peak and its left neighbour is greater than it, then left half must have a peak element
			else if (mid > 0 && arr[mid - 1] > arr[mid])     return findPeakUtil(arr, low, (mid - 1), n);
		
			// If middle element is not peak and its right neighbour is greater than it, then right half must have a peak element
			else      return findPeakUtil( arr, (mid + 1), high, n);
		}
		
		// A wrapper over recursive function findPeakUtil() 
		function findPeak(arr, n)
		{
			return findPeakUtil(arr, 0, n - 1, n);
		}
		
		// Driver Code
		var arr = [ 1, 3, 20, 4, 1, 0 ];
		var n = arr.length;
		console.log("2Index of a peak point is "+ findPeak(arr, n));
		



		var trend = function(arr, options) 
		{
			options = options || {};
			options.lastPoints = options.lastPoints || 1;
			options.avgPoints = options.avgPoints || 10;
		
			if (arr.length < options.lastPoints + options.avgPoints) return null;
		
			var lastArr = options.reversed ? arr.slice(0, options.lastPoints) : arr.slice(arr.length - options.lastPoints, arr.length);
			var chartArr = options.reversed ? arr.slice(options.lastPoints, options.lastPoints+options.avgPoints) : arr.slice(arr.length - options.lastPoints - options.avgPoints, arr.length - options.lastPoints);
		
			var chartAvg = chartArr.reduce(function(res, val) { return res += val }) / chartArr.length;
			var lastAvg = Math.max.apply(null, lastArr);
		
			if (options.avgMinimum !== undefined && chartAvg < options.avgMinimum) return null;
			return lastAvg/chartAvg;
		};



		var chart = [10,10,10,10,10,10,10,10,10,10,7,7,5,1];

		var growth = trend(chart, {
			lastPoints: 3,
			avgPoints: 10,
			avgMinimum: 10,
			reversed: false
		});
		
		 console.log('Growth=', growth );
		if (growth < 0.25) console.log('The chart is going down! Is the server up?');

 */














module.exports = _moduleScope;