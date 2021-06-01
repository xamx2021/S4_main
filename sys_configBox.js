#!/usr/bin/node
"use strict"; 

var sqlite3 = require('sqlite3').verbose();
var dbFile = require("./_config.js").db_config;
var db = new sqlite3.Database(dbFile);



//------------------- MODULE CONSTRUCTOR: -----------
var moduleScope = function (init_val, id, _sb,  _CONF, _cindex) 
	{ 		
		var CFG ={};		
		CFG.configName = init_val;		
		
		var updated = false;
		
		// DEVEL ONLY
		setInterval(function()
			{
				if(updated){
					console.log('DEVEL: config updated');
					updated = false;
					CFG.save();
					}}
			, 5000);
		
		
		CFG.save_idle = function(){ updated = true;	};			

		

		//=========================================	
		CFG.create = function()
			{
				var sqlCreateTable  = "CREATE TABLE config (id TEXT PRIMARY KEY, data TEXT);";
				db.all(sqlCreateTable,		function(err, row)
					{
						if(err) console.log ('CFG create error =' + err); else console.log ('Config table created, ');
					});
			};
			
			

		//=========================================	
		CFG.save = function()
			{			 		
				var ret = CFG;				
				var data =  "'" + JSON.stringify( ret ) +"'";
				var sqlSave = "INSERT OR REPLACE INTO config VALUES ('"+this.configName+"', "+data+")";
				db.all(sqlSave,		function(err, row)
					{
							 if(err) console.log ('SAVE err=' + err); else console.log ('Config saved, ' + CFG.configName);
					});
			};
			
			
		//=========================================
		CFG.load = function(cb, that)
			{ 	
				if( that === undefined ) that = this;
				var sqlLoad = "SELECT data FROM config WHERE id = '" + this.configName +"'";
				db.all(sqlLoad,
						function(err, row)
						{ 
							if(err){ console.log( 'ERROR while reading configuration from DB!' ); return cb(false);	}
							if(row.length == 0){ console.log( 'Empty configuration data.', that.configName ); return cb(false);	}
							try{  var o = JSON.parse( row[0].data ); } catch(e){ console.log( 'ERROR while parsing configuration data' ); return cb(false); }
							for(var key in o)	if( o.hasOwnProperty(key) ) if(key !== 'sb') that[key] = o[key];
							that.loaded = true;					
							if(cb) cb(that);
						});
				return that;
			};
				
		return CFG;
	};

 


module.exports = moduleScope; 					// Expose the moduleScope / event emitter, entire exports value.
  


//==================================================================================
//==================================================================================
function init( configName )
{
		
}





