#!/usr/bin/node
"use strict"; 

var sqlite3 = require('sqlite3').verbose();
var ldb_file = require("./_config.js").db_log;
var log_db = new sqlite3.Database(ldb_file);

var sb = {};
var CONF = {};
var PCONF = {};
var mod_rnd = '';
var EventEmitter = require('events').EventEmitter;

//------------------- MODULE CONSTRUCTOR: -----------
var moduleScope = function (init_val, id, _sb,  _CONF, _cindex)
	{
		var LOG = moduleScope.prototype;

		//=========================================	
		LOG.create = function(cb)
			{ 
				log_db.all(" SELECT * FROM log LIMIT 1",	function(err, row)
					{
						if(err && err.errno == 1)	//'SQLITE_ERROR'
						{
								var sqlCreateTable  = 'CREATE TABLE log (id INTEGER PRIMARY KEY AUTOINCREMENT DEFAULT (1), dtime DATETIME DEFAULT (datetime()), "action" TEXT, epc TEXTY, ch INTEGER, data TEXT);';
								log_db.all(sqlCreateTable,
									function(err, row)
										{
											if(cb)cb(err);
											if(err) console.log ('Lod table creation error =' + err);
											else console.log ('Log table created');
										});
						}
						else {		if(cb)cb(null);			}
					});		
			};
			
		LOG.create();


		//=========================================
		LOG.delete = function(cb)
			{
				var hist_get = " DELETE FROM log; INSERT INTO log (epc, ch, action, data) VALUES ( ' ', ' ','log deleted', ' '); " ;
				log_db.all(hist_get,	function(err, row)
					{
						if(!err)console.log('History deleted.');
						if(cb)cb(err);	
					});
			};


		//=========================================
		LOG.write = LOG.writeHistory = function(epc, ch, action, datatext, cb)
			{			
					var hist_q = " INSERT INTO log (epc, ch, action, data) VALUES (?,?,?,?)" ;
					log_db.all(hist_q, [epc, ch, action, datatext],	function(err)
						{
							if(!err)console.log('History updated.');
							else console.log ('History updating error= ' + err);
							if(cb)cb(err);
						});
			};
			
			
		//=========================================
		LOG.load = function(cb, that)
			{
				if( that === undefined ) that = this;
				var hist_get = " SELECT * FROM log " ;
				log_db.all(hist_get,	function(err, row)
					{
						if(err) return console.log('History error.');
						if(cb) cb(row);
					});
				return that;
			};
			
			
			
			
			
	return moduleScope.prototype;
	};



module.exports = moduleScope; 

//==================================================================================
//==================================================================================
function init( configName )
{
		

}





