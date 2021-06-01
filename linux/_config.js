#!/usr/bin/node
"use strict";
var version = "ESP 4"

    
// ============== PLUGIN SECTION: ===============================================
var PLUGINS = 	 
	{
		plugins:
			[
	// ALFA			
		/*
			{ plugin_file: './S3_core/inc_RFID_new.js', name: 'RFID' },
			{ plugin_file: './S3_core/inc_RFID_Tags.js', name: 'RFID Tags'},			
			{ plugin_file: './S3_core/sys_Users.js', name: 'Manage users' },
			{ plugin_file: './S3_core/inc_AMS_client.js', name: 'AMS Client' },
			{ plugin_file: './S3_core/inc_API_devel.js', name: 'API development' },	
			{ plugin_file: './S3_core/inc_RFID_map.js', name: 'RFID_map' },			
			{ plugin_file: './S3_core/inc_Demo_devel.js', name: 'Demo' },				
		*/
			{ plugin_file: './S3_core/inc__about.js', name: 'About' },
			{ plugin_file: './S3_core/inc__dashboard.js', name: 'Dashboard' },
			{ plugin_file: './S3_core/inc_System_setup.js', name: 'System Setup' },
			{ plugin_file: './S3_core/inc__script_launcher.js', name: 'Controls' },
			
   // BETA	
			{ plugin_file: './S3_core/inc__OneSwitch.js', name: 'Humidif. SW',  connected_to: 'a55dfb' },
		//	{ plugin_file: './S3_core/inc__automation.js', name: 'Automation' },															// debugging unit 
			//{ plugin_file: './S3_core/inc__air_device.js', name: 'Air device',  connected_to: 11298564 },					// debugging unit 
			//{ plugin_file: './S3_core/inc__air_device.js', name: 'Air device',  connected_to: 3626680 },					// real device	
			//{ plugin_file: './S3_core/inc__voc_ctrl_new.js', name: 'Voc Controller',  connected_to: 1397603 },			// debugging unit
	//		{ plugin_file: './S3_core/inc__remote_ctrl.js', name: 'Remote controller',  connected_to: 1397603 },			// debugging unit				 
	//old devboard		{ plugin_file: './S3_core/inc__air_humobarothermometer.js', name: 'Air multimeter', connected_to: 1614689 },
			{ plugin_file: './S3_core/inc__air_humobarothermometer.js', name: 'Air multimeter', connected_to: 'c59e99' },	// Prprotype1, New PCB	
	//		{ plugin_file: './S3_core/inc__air_device.js', name: 'Air humidifier',  connected_to: 12950205 },			// new air device			
	 		{ plugin_file: './S3_core/inc__OneSwitch.js', name: 'Chinese lantern', connected_to:       9724931 },
			{ plugin_file: './S3_core/inc__OneSwitch.js', name: 'UV Lamp ', connected_to:        10837499 },
			//{ plugin_file: './S3_core/inc__OneSwitch.js', name: 'Ventilation Fan', connected_to:      13816337 },
			//{ plugin_file: './S3_core/inc__OneSwitch.js', name: 'Ventilation Fan2', connected_to:      9341106 },
		
						
			{ plugin_file: './S3_core/inc__rgb_2812.js', name: 'RGB',  connected_to: 9383376 },
			{ plugin_file: './S3_core/inc__rgb_2812.js', name: 'RGB Rock',  connected_to: 6687280 },
	//		{ plugin_file: './S3_core/inc__OneSwitch.js', name: 'Desk lamp', connected_to:  9374638 },			
			//{ plugin_file: './S3_core/inc__rgb_audio.js', name: 'RGB-audio', connected_to: 9341106 },
			//{ plugin_file: './S3_core/inc__rgb_audio.js', name: 'RGB-audio', connected_to: 6687280 },
			//{ plugin_file: './S3_core/inc__rgb_audio.js', name: 'RGB-audio-big', connected_to: 9383376 },
			//{ plugin_file: './S3_core/inc_Pinger_new.js', name: 'Pinger' , connected_to:10000000001 },
	//		{ plugin_file: './S3_core/inc__FoureSwitch.js', name: 'Cristmass tree', connected_to: 14996420 },
				
		
	// GAMMA
		//	{ plugin_file: './S3_core/inc_F-meter_stepper.js', name: 'RFID Field measurments' },		
		//	{ plugin_file: './S3_core/inc_N-meter_ГКЧ.js', name: 'HackRF Sweep generator' },
		//	{ plugin_file: './S3_core/inc_RFgenerator.js', name: 'HackRF generator' },			
		//	{ plugin_file: './S3_core/inc_RFID_Setup.js', name: 'RFID Setup' },
		//	{ plugin_file: './S3_core/inc_RFID_Tags.js', name: 'RFID Tags'},				
		//	{ plugin_file: './S3_core/inc_F-users.js', name: 'User Setup' },
		//	{ plugin_file: './S3_core/inc_new_pinger_nhw.js', name: 'Pinger ' },
		//		{ plugin_file: './S3_core/inc__relayX4.js', name: 'Four relays', connected_to: 	3626667 },	
		//	{ plugin_file: './S3_core/inc__semaphore.js', name: 'Semaphore', connected_to: 426465 },		
 
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
	serverip: '192.168.33.52', 
	serverWebSockport:7000, 
	serverHTTPwebport: 80,
	serverHTTPSwebport: 443,
	sslKey: 'ssl/amx.S4.key',
	sslCert: 'ssl/amx.S4.crt',
	sslPassphrase: 'Ajll02lwkkk1l1lllwwefv',
	client_iv:  'be410fea41df7162a679875ec131cf21',
	server_iv:  'be410fea41df7162a679875ec131cf2c',	
WebSockType: 'ws',
	//		WebSockType: 'wss',	
}

var moduleScope = {};


moduleScope.HW_PLATFORM_RPI = true;
moduleScope.PLUGINS = PLUGINS;
moduleScope.SBCONF = SBCONF;
moduleScope.WSCONF = WSCONF;

moduleScope.Temp_token_file_PATH = "tmp_token.json";			// windows
moduleScope.Temp_plugin_file_PATH = "tmp_plugin.json";			// windows

moduleScope.db_access = '_access.db';								// windows
moduleScope.db_config = '_config.db';									// windows
moduleScope.db_log = '_config.db';										// windows

//moduleScope.rdHWAddr = 'tmr:///dev/ttyACM0';								// linux

/**/
moduleScope.Temp_token_file_PATH = "/tmp/tmp_token.json";			// linux
moduleScope.Temp_plugin_file_PATH = "/tmp/tmp_plugin.json";		// linux

moduleScope.db_access = '/boot/_access.db';						// linux
moduleScope.db_config = '/boot/_config.db';							// linux
moduleScope.db_log = '/boot/_config.db';								// linux

moduleScope.cookieSession_secret  = '1234567890';

module.exports = moduleScope;