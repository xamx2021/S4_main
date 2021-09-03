#!/usr/bin/node
"use strict";
var version = "ESP 4"




// ============== PLUGIN SECTION: ===============================================
var PLUGINS = 	 
	{
		plugins:
			[

	// ALFA	
			{ plugin_file: './S3_core/inc__about.js', name: 'About' },
			//{ plugin_file: './S3_core/sys_Users.js', name: 'Manage users' },
			{ plugin_file: './S3_core/inc_System_setup.js', name: 'System' },
	//		{ plugin_file: './S3_core/inc__script_launcher.js', name: 'Controls' },
			//{ plugin_file: './S3_core/inc_Pinger_new.js', name: 'Pinger'  },
			{ plugin_file: './S3_core/inc__dashboard.js', name: 'Dashboard' },



   // BETA			 
			{ plugin_file: './S3_core/inc__air_humobarothermometer.js', name: 'Indoor air', connected_to: 'c59e99' },	// Prprotype1, New PCB		
			{ plugin_file: './S3_core/inc__air_humobarothermometer.js', name: 'Outdoor air', connected_to: 'dbd3a1' },	// Prprotype0, Old PCB
	//		{ plugin_file: './S3_core/inc__logger.js', name: 'Logger',  connected_to:   '3756b8' },					  // logger
	//		{ plugin_file: './S3_core/inc__loggerDB.js', name: 'DLogger', connected_to: 'no_hardware' },		 	// logger db

			{ plugin_file: './S3_core/inc__OneSwitch.js', name: 'Switch1',  connected_to: 'd2d211' },
			{ plugin_file: './S3_core/inc__OneSwitch.js', name: 'Switch2',  connected_to: 'a55dfb' },
			{ plugin_file: './S3_core/inc__OneSwitch.js', name: 'Switch3',  connected_to: '8e88b2' },
			
		//	{ plugin_file: './S3_core/inc__OneSwitch.js', name: '3-bulb lamp', connected_to: '946403' },
			{ plugin_file: './S3_core/inc__rgb_2812.js', name: 'LED lamp1',  connected_to: '63cb40' },
			{ plugin_file: './S3_core/inc__rgb_2812.js', name: 'LED lamp2',  connected_to: 'a83353', useMQTT:true },	

			{ plugin_file: './S3_core/inc__IRSwitch.js', name: 'IR control',  connected_to: '18a361' },

	// LOGIC
			{ plugin_file: './S3_core/inc__event.js', name: 'EVT' },
			{ plugin_file: './S3_core/inc__timer.js', name: 'TMR'},
	//		{ plugin_file: './S3_core/inc__codes.js', name: 'CDE' , connected_to: 'codeGrp' },


   // GAMMA
 			//{ plugin_file: './S3_core/inc__PWMSwitch.js', name: 'PWM Switch',  connected_to:  '9402dc' },
		//	{ plugin_file: './S3_core/inc__air_device.js', name: 'Humidifier',  connected_to: 'c59abd' },	
			//{ plugin_file: './S3_core/inc__voc_ctrl_new.js', name: 'Voc Controller' },			// debugging unit	
 			//{ plugin_file: './S3_core/inc__rgb_audio.js', name: 'RGB-audio', connected_to: 9341106 },

	
	// DELTA			
		//	{ plugin_file: './S3_core/inc_F-users.js', name: 'User Setup' },
		//	{ plugin_file: './S3_core/inc__relayX4.js', name: 'Four relays', connected_to: 	3626667 },	
		//	{ plugin_file: './S3_core/inc__semaphore.js', name: 'Semaphore', connected_to: 426465 },		
		//	{ plugin_file: './S3_core/inc__FoureSwitch.js', name: 'Cristmass tree', connected_to: 14996420 },
		//	{ plugin_file: './S3_core/inc0_VoCom.js', name: 'Voice command module' },
		//	{ plugin_file: './S3_core/inc_pwm', name: 'PWM', connected_to: 426465 },
		//	{ plugin_file: './S3_core/inc_i2c_tunnel.js', name: 'i2c tunnel', connected_to: 1614689 },
		
			],
	}
	
 



// ============== SERVER SECTION: ===============================================
var SBCONF =
 {
	loaded:	false,
	serverremotedataserverip: '0.0.0.0', 
//	serverWebSockport:7000, 
	maxCUsers: 10,
//	multiple_sns : false,				// One user - one session.
	multiple_sns : true,				// One user - multiple sessions.

	//driverComService_Port: 5000,
	//driverComService_IP: '127.0.0.1',	
	serverremotedataInport:60,
};
  

var WSCONF = 
{	
	//serverip: '127.0.0.1', 
	serverip: '0.0.0.0', 
	//serverip: '10.8.0.10', 
	serverWebSockport:9000, 
	serverHTTPwebport: 80,
	serverHTTPSwebport: 443,
	sslKey: 'ssl/amx.S4.key',
	sslCert: 'ssl/amx.S4.crt',
	sslPassphrase: 'Ajll02lwkkk1l1lllwwefv',	
	client_iv:  'be410fea41df7162a679875ec131cf21',
	server_iv:  'be410fea41df7162a679875ec131cf2c',		
	WebSockType: 'ws',
	//WebSockType: 'wss',	
}

var moduleScope = {};


moduleScope.PLUGINS = PLUGINS;
moduleScope.SBCONF = SBCONF;
moduleScope.WSCONF = WSCONF;

moduleScope.Temp_token_file_PATH = "tmp_token.json";			// windows
moduleScope.Temp_plugin_file_PATH = "tmp_plugin.json";			// windows

moduleScope.db_access = '_access.db';								// windows
moduleScope.db_config = '_config.db';									// windows
moduleScope.db_log = '_config.db';										// windows

//moduleScope.rdHWAddr = 'tmr:///dev/ttyACM0';								// linux

/*
moduleScope.Temp_token_file_PATH = "/tmp/tmp_token.json";			// linux
moduleScope.Temp_plugin_file_PATH = "/tmp/tmp_plugin.json";		// linux

moduleScope.db_access = '/boot/_access.db';						// linux
moduleScope.db_config = '/boot/_config.db';							// linux
moduleScope.db_log = '/boot/_config.db';								// linux
*/

moduleScope.cookieSession_secret  = '1234567890';



moduleScope.MQTT_server = "mqtt://192.168.33.52";
moduleScope.MQTT_login = "user";
moduleScope.MQTT_password = "password";


module.exports = moduleScope;

