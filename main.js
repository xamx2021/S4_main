#!/usr/bin/node
//#!/usr/local/bin/node
"use strict";

//var Common2 = require('./S3_core/inc__common.js');
	var sb = require('./sys_serverbox.js'); 
	var common = {};
	require('./sys_auth.js').init(sb, null, common);
	var CONF = require("./_config.js").PLUGINS;
	var fs = require('fs');
	var Temp_plugin_file_PATH = require("./_config.js").Temp_plugin_file_PATH;
	var inc_m = [];

	function plg_load()
	{
		CONF.bus_inc = inc_m;

		for( var i in CONF.plugins )
		{							 
			console.log('Loading plugin: ' + CONF.plugins[i].name);
			//try{		
					var tmp = require( CONF.plugins[i].plugin_file )( CONF.plugins[i].name, CONF.plugins[i].connected_to, sb, CONF, inc_m.length-1, common);	
			//	}
			//catch(c){			console.log('Can not initialize module: "', CONF.plugins[i].plugin_file, '", ', c);		}
			if( tmp ) inc_m.push( tmp );
		}
		
		//try{	
				 fs.writeFileSync(Temp_plugin_file_PATH, JSON.stringify(  inc_m  ) );			
		//	}
		//catch(c){ 			console.log('Can not use module: "', CONF.plugins[i].plugin_file, '", ', c);			}
	};
	
		
	plg_load();
	
	

	// Called each time plugin configuration changes:
	sb.on('PluginReRender', function()
	{
		plg_load();			// Loading the plugins.
	});


				
	
	// Called each time a client reloads the page:
	sb.on('MISO_getAdminGUIupdate', function(input)
	{
	});
	


	// DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL 
	// This has to be here or BROADCAST won't work.
	sb.on('on_login_EVT', function(input, token, cb) 
	{
		return	cb(true);	
	/*	
		Access te HCDB:

		// 2. extend perms with user's role:
		if(input.access.use_role_based_access)
					{
						ready2 = false;
						var  sql = "	SELECT * FROM access_roles WHERE id = '" + input.access.access_role_id +"'";			
						dlb2.all( sql, 	function(err, rows)
								{ 
									if( err !== null ){	console.log('Error #80918: '  + err);   return;				}
									if( !rows[0] ){	console.log('Error #80919: '  + err);   return;				}
									var access = {};
									try{ access = JSON.parse( rows[0].access );	} catch(e){		return console.log(' error #8095: bad JSON=> ', rows[0].access);			}
									for(var key in access ) input.access[key] = access[key];
									ready2 = true;
								});
					}
	*/					
	});
	// DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL DEVEL
	
	