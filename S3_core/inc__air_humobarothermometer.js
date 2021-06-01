#!/usr/bin/node
"use strict"; 

var KalmanFilter = require('kalmanjs');
var superConstructor = require('./inc__common.js');

Number.prototype.round = function(places) {			return + (Math.round(this + "e+" + places)  + "e-" + places);		  }
		

//------------------- MODULE CONSTRUCTOR: -----------
var _moduleScope = function ( ) 
	{
		var moduleScope  =	superConstructor.Constructor(_moduleScope, arguments);
		moduleScope.prototype.LCONF = require('../sys_configBox.js')("AirMeter");
		moduleScope.prototype.LCONF.load( function(load)
			{
				if(!load){
								// Creater DB instance with default values:
								moduleScope.prototype.LCONF.data_update_interval  = 5000;
								moduleScope.prototype.LCONF.save();
							}
				 init( moduleScope ); 				 
			}  );
		return moduleScope.prototype;
	};

module.exports = _moduleScope;



//==================================================================================
//==================================================================================
function init(exemplar)
{
		var mod_rnd  = exemplar.prototype.mod_rnd;		
		var LCONF  = exemplar.prototype.LCONF;
		var sb = exemplar.prototype.sb;

		// If using S3/4:
		var dev = exemplar.dev = sb.S4Init(exemplar.prototype.local_id);

		// If using MQTT:	
		//var dev = exemplar.dev = exemplar.dev = sb.MQTTInit( { 	MQTTserver:"mqtt://192.168.33.52",	MQTTlogin:"user", 	MQTTpassword:"password",	DeviceID: exemplar.prototype.local_id} );
		 

//	dev.events.on('device_connected', function(socket)
//	{
//		console.log('Device connected: ' + socket.remote_id + ' @ '+ socket.remote_ip + ' as ' + exemplar.prototype.module_name );		
//	});
	

	dev.events.on('state_change', function(input)
	{
		exemplar.prototype.remoteConnected = input.remoteConnected;
		// Device initialization:
		if(input.remoteConnected)
			dev.DEVICE_MOSI( {
					dev_cmd:'config_device',
					deviceEnabled  : LCONF.deviceEnabled,
					CO2LED_Thold: LCONF.CO2LED_Thold,
					data_update_interval: LCONF.data_update_interval,
					save_config: true,
					rgb_led_r : LCONF.rgb_led_r,
					rgb_led_g : LCONF.rgb_led_g,
					rgb_led_b : LCONF.rgb_led_b
				},  function(res){	if(!res)  console.log( 'config error');	}	);
		exemplar.prototype.gui_rdev_status( );
	});


 //------------------- PIR sensor event andler: -----------			
	dev.events.on('on_device_event', function(obj)
	{
		if(obj.error != true)dataProcessor(obj);
		//   log device event here, e.g. PIR sensor event.				//	var  time = (new Date()).getTime();
	});






		var simpleGetData = function(input, key)
		{
			var  value =  input[ key ];
			if( value === undefined || Number.isNaN( value)  ) return undefined;
			return value;		
		}

		var pDustCalc = function(input, prm)
		{
			if(input.dust_pm_10_std === undefined || input.dust_pm_25_std === undefined || input.dust_pm_100_std === undefined) 	return undefined;
			//if(Number(obj.dust_pm_10_std) > 15000 ||  Number(obj.dust_pm_25_std) >15000 || Number(obj.dust_pm_100_std) > 15000)	return undefined;
			var dust_all_pm = (Number(input.dust_pm_10_std) + Number(input.dust_pm_25_std) + Number(input.dust_pm_100_std))/3;
			input[prm] = dust_all_pm.round(0);
			return input[prm];
		}
						
		var pDewPoint = function(input, prm)
		{				
			if( input.t === undefined ||  input.h === undefined) return undefined;
			var temp = input.t;
			var rh =  input.h;
			var tem = -1.0*temp;
			var es = 6.112*Math.exp(-1.0*17.67*tem/(243.5 - tem));
			var ed = rh/100.0*es;
			var eln = Math.log(ed/6.112);
			input[prm] = -243.5*eln/(eln - 17.67 );			
			return input[prm];
		}
	
		var pRrefilterError = function(input, prm)
		{				
			var  value =  simpleGetData(input, prm);
			var avg = 0;

			if(!hs_filter_array[prm].avgSumArray) hs_filter_array[prm].avgSumArray = [];

			if(hs_filter_array[prm].absoluteMax !== undefined && value >= hs_filter_array[prm].absoluteMax){ console.log( value , ' definitely wrong value dropped [', prm, ']' );		return true;		}
			if(hs_filter_array[prm].absoluteMin !== undefined && value <= hs_filter_array[prm].absoluteMin){ console.log( value , ' definitely wrong value dropped [', prm, ']' );		return true;		}

			if(hs_filter_array[prm].avgSumArray.length >= 5)hs_filter_array[prm].avgSumArray.shift();
			hs_filter_array[prm].avgSumArray.push(value);		 
			
			var sum = 0;
			for( var i in hs_filter_array[prm].avgSumArray)sum += hs_filter_array[prm].avgSumArray[i];
			avg = sum / hs_filter_array[prm].avgSumArray.length;
			if(hs_filter_array[prm].round !== undefined) avg = avg.round(hs_filter_array[prm].round);
			hs_filter_array[prm].avg = avg;

			 var error = hs_filter_array[prm].maxError;	if( !error ) 	return false;			
			if (avg >= (value - error) && avg <= (value + error))		return false;
			console.log( value, avg, '  value dropped [', prm, ']' ); 	 return true;				
		}


	const pMAX = 30000;										// Maximum datapoints
	var all_data_array = [];
	for (var i in all_data_array)all_data_array[i] = [];
	
	var hs_filter_array = 
		{
				"p100":{					     "filter": new KalmanFilter({R: 0.01, Q: 0.1}),				 "processor": simpleGetData,	   "round": 0	  																																							   },
				"p50":{							  "filter":	new KalmanFilter({R: 0.01, Q: 0.1}),			  "processor": simpleGetData,		"round": 0	  																																								},
				"p25":{							  "filter":	new KalmanFilter({R: 0.01, Q: 0.1}),			  "processor": simpleGetData,		"round": 0	  																																								},
				"p10":{							  "filter":	new KalmanFilter({R: 0.01, Q: 0.1}),			  "processor": simpleGetData,		"round": 0	  																																								},
				"p5":{							   "filter": new KalmanFilter({R: 0.01, Q: 0.1}),			   "processor": simpleGetData,		 "round": 0		  																																							},
				"p3":{							   "filter": new KalmanFilter({R: 0.01, Q: 0.1}),	  			"processor": simpleGetData,		  "round": 0	  																																							},
				"dust_pm_100_std":{		"filter": new KalmanFilter({R: 0.01, Q: 0.1}),	  		    "processor": simpleGetData,		  "round": 0		  																																						},
				"dust_pm_25_std":{		 "filter": new KalmanFilter({R: 0.01, Q: 0.1}),				 "processor": simpleGetData,		"round": 0	  																																							},
				"dust_pm_10_std":{		 "filter": new KalmanFilter({R: 0.01, Q: 0.1}),				 "processor": simpleGetData,		"round": 0	  																																							},
				"t":{								  "filter": new KalmanFilter({R: 0.01, Q: 0.1}),			  "processor": simpleGetData,		"round": 3,			preprocessor:pRrefilterError,		 maxError: 10   															 			},		//1:	new KalmanFilter({R: 0.02, Q: 1}),							//1		T
				"h":{								 "filter": new KalmanFilter({R: 0.01, Q: 0.1}),				 "processor": simpleGetData,		"round": 3,  		preprocessor:pRrefilterError, 		maxError: 10, 			absoluteMax: 60000, absoluteMin: 0		},
				"co2":{						  	   "filter": undefined,												 		  "processor": simpleGetData, 		"round": 0,  		preprocessor:pRrefilterError,		absoluteMax: 4999,  absoluteMin: 399  									 },			//pCO2
				"dust_all_pm":{				 "filter": new KalmanFilter({R: 0.01, Q: 0.1}),				  "processor": pDustCalc,				"round": 0	  																																							 },
				"dewp":{						 "filter": new KalmanFilter({R: 0.01, Q: 0.1}),				  "processor": pDewPoint,			   "round": 3		  																																						  },
				"p":	{							"filter": new KalmanFilter({R: 0.01, Q: 0.1}),		  	 	 "processor": simpleGetData	,		"round": 3, 		preprocessor:pRrefilterError, maxError: 10,  absoluteMin: 0 							},
			//	"ppas":	{						 "filter": new KalmanFilter({R: 0.01, Q: 20, B: 2}),		"processor": pPressure		},		
		};



		
		function dataProcessor(obj)
		{		 			
				 
		//var  valuesSimple = [ 'p100', 'p50', 'p25', 'p10', 'p5', 'co2'];

		//		for( var k in hs_filter_array)
		//			{
		//				var px = hs_filter_array[ k ];		if( !px ) continue;						
		//				var value = px.processor(obj, px.key);										// get & check validity of the value.
		//				if(px.filter!==undefined)	value = px.filter.filter(value);														// Filter the value.
		//				if(px.round!==undefined) value = value.round(px.round);							// round the value
		//				obj[ px.key ] = value;																					// Return value to the structure
		//			}

			//	for( var k in obj)
				for( var k in hs_filter_array)
					{
						//if( obj[k] )
							var px = hs_filter_array[ k ];	
							if(px.preprocessor) if(	px.preprocessor(obj, k) ){		obj[k] = undefined;		continue;	}		// skip obvious errors				OPTION 2: replace with average value, OPTION 1: drop value 
							px.processor(obj, k);


							if(px.filter!==undefined)	obj[k]  = px.filter.filter(obj[k]);														// Filter the value.
							if(px.round!==undefined) obj[k] = obj[k].round(px.round);							// round the value
					}


			
					obj.time = (new Date()).getTime();						
					//	if(all_data_array[all_data_array.length-1])console.log(' prv = ', all_data_array[all_data_array.length-1].co2 , '   cur = ',obj.co2 );
					
					if(!obj.time) return;
	
		
					const STATUS_DUST_SENSOR_OK  = (1<<7);
					const STATUS_CO2_SENSOR_OK  = (1<<6);
					const STATUS_RH_SENSOR_OK  = (1<<5);
					const STATUS_PIR_SENSOR_TRIPPED =  (1<<4);
					const STATUS_DEVICE_INITIALIZED = 1
					const STATUS_DEVICE_NOT_INITIALIZED = 0
					const STATUS_AIR_QUALITY_ALARM  = (1<<3);
					const STATUS_ENABLED  = (1<<1);
	 
					

					// This is to be moved to WEB client:
					obj.DeviceStatusText = 'Device OK';	

					if(!(obj.DeviceStatus & STATUS_DEVICE_INITIALIZED))	{		obj.DeviceStatusText = 'Device not initialized';		}
					else if(!(obj.DeviceStatus & STATUS_DUST_SENSOR_OK)){		obj.DeviceStatusText = 'Dust sensor error';		delete obj.dust_all_pm;    delete obj.dust_pm_10_std;  delete obj.dust_pm_25_std; delete obj.dust_pm_100_std;	 }
					else if(!(obj.DeviceStatus & STATUS_CO2_SENSOR_OK)){		obj.DeviceStatusText = 'CO2 sensor error';		delete obj.co2;  	}
					else if(!(obj.DeviceStatus & STATUS_RH_SENSOR_OK)){		obj.DeviceStatusText = 'R/H sensor error';		}
					//else if(obj.DeviceStatus ^ STATUS_PIR_SENSOR_TRIPPED){		obj.DeviceStatusText = 'Doppler sensor has never tripped';	}
					else if(obj.DeviceStatus & STATUS_AIR_QUALITY_ALARM){		obj.DeviceStatusText = 'Bad air quality';	}
					else if(obj.DeviceStatus & STATUS_ENABLED){		obj.DeviceStatusText = 'Device enabled';	}


					if(obj.DeviceStatus & STATUS_PIR_SENSOR_TRIPPED)
					{
													
						obj.PIR = 1;
						dev.DEVICE_MOSI({dev_cmd : 'reset_PIR_trigger'}, function(res)	{		});

					}




					// devel:
					delete obj.eadc0;					delete obj.eadc1;					delete obj.eadc2;					delete obj.eadc3;					delete obj.dust_pm_100_atm;					delete obj.dust_pm_25_atm;
					delete obj.dust_pm_10_atm;					delete obj.tBarometer;								delete obj.cmd;					delete obj.RDeviceEvent;					delete obj.error;					delete obj.cmd_index;
					 
					var keys = [
						'RDeviceEvent', 'cmd_index', 'cmd',   'error', 	'RDeviceEvent', 
						'DeviceStatus', 'DeviceStatusText',
						'tBarometer' ,
					//	'dust_all_pm', 'ppas', 'p100', 'p50', 'p25', 'p10', 'p5', 'h',  't', 'p', 'dust_pm_25_std', 'dust_pm_10_std', 'dust_pm_100_std', 'dust_all_pm', 'dewp'
					];
					//	var keys = ['DeviceStatus','cmd_index', 'cmd',  'DeviceStatusText', 'error',  'dust_all_pm', 'co2', ];
						for( var j  in all_data_array) 
						{
							for( var kk in keys) delete all_data_array[ j ][keys[kk]];	
						}
						
			
			 		// old sb.broadcast(JSON.stringify({Dom_remote_procedure_call: { function_ID: 'append_all_data' + mod_rnd, params: obj}	} ));
					 sb.broadcast(JSON.stringify({Dom_remote_procedure_call: { function_ID: 'append_chart_data' + mod_rnd, params: obj}	} ));


					var l = all_data_array.length;

					// Removing static values:
					//	for( var i in obj)	if( lastValueObj[ i ] === obj[i] )	{		delete obj[i];		} else  lastValueObj[ i ] = obj[i];
					//	var lastValueObj = {};
					
					if(all_data_array.length >= pMAX)all_data_array.shift();				
					all_data_array.push( obj );


				//  Sharing te values with other modules:
				exemplar.prototype.airMeterValues = obj; 							
		};




		var formControlElements = [];

		//------------------- GUI update: (on gui connecter/reloaded) -----------
		sb.on('MISO_getAdminGUIupdate', function(input)
		{
			exemplar.prototype.gui_rdev_status( );
			var temp = [];
			for(var i in formControlElements){		temp[i] = {};	temp[i].elmt_ID = formControlElements[i].elmt_ID;	temp[i].s_param = formControlElements[i].s_param;	temp[i].value = eval( formControlElements[i].value );		}
			input.MOSI_UCT({ Dom_remote_element_bulk_upd: temp } );

			input.MOSI_UCT({Dom_remote_procedure_call: { function_ID: 'ledSetColor' + mod_rnd, params: {r:LCONF.rgb_led_r,   g:LCONF.rgb_led_g,   b:LCONF.rgb_led_b}}});	
		});					
					
		


 
	
			


		//------------------- API Set data update period, server only: -----------
		sb.on('on_device_ctrl' + mod_rnd, function(input)
			{
				var C={};
				if(input.data.deviceEnabled===true || input.data.deviceEnabled===false)			C.deviceEnabled = Number(input.data.deviceEnabled);
				if(input.data.data_update_interval)	 { C.data_update_interval = Number(input.data.data_update_interval);	if(C.data_update_interval>=60000 || C.data_update_interval<=500 && C.data_update_interval !=0)		
						return  input.ACK_MOSI( false, 'Wrong value', LCONF.data_update_interval);		}
				if(input.data.CO2LED_Thold)	  C.CO2LED_Thold = Number(input.data.CO2LED_Thold);

				//	Save values to LCONF:
				for(var i in C) LCONF[i] = C[i];	LCONF.save();
				C.dev_cmd = 'config_device';
				dev.DEVICE_MOSI(C, function(res)
					{						
						if(res.error)
							{ 
								if(res.timeout) return input.ACK_MOSI( false, "Device timeout");
								 input.ACK_MOSI( false, "Device error");
							}
						input.ACK_MOSI( true );
					});
		});
 

		formControlElements.push(	{	elmt_ID: 'text02CO2_Thold' + mod_rnd,							s_param: 'value',			value: 'LCONF.CO2LED_Thold' 	}	);
		formControlElements.push(	{	elmt_ID: 'text01data_update_interval_TB' + mod_rnd,		s_param: 'value',			value: 'LCONF.data_update_interval' 	}	);
		formControlElements.push(	{	elmt_ID: 'ckbox03_device_enabled' + mod_rnd,			  s_param: 'checked',		value: 'LCONF.deviceEnabled'	}	);



		
		//------------------ debug-devel: LED color-----------
		sb.on('on_indicator_led_set_RGB' + mod_rnd, function(input)
		{
			var c = input.data;
			LCONF.rgb_led_b	= c.b;
			LCONF.rgb_led_g = c.g;
			LCONF.rgb_led_r = c.r;
			//LCONF.save();
			if(dev.remoteConnected)
			dev.DEVICE_MOSI( { dev_cmd:'switch_RGB_LED', rgb_led_r: c.r,  rgb_led_g: c.g,  rgb_led_b: c.b },  function(res){	if(res)input.ACK_MOSI( true ); else input.ACK_MOSI( false, "Device error");	});
			else input.ACK_MOSI( false, "Device offline" );
		});
		


		//------------------- button, Data reset: -----------
		sb.on('on_data_reset' + mod_rnd, function(input)
		{
				for (var i in all_data_array)all_data_array[i] = [];
				all_data_array = [];
				input.MOSI_UCT({Dom_remote_procedure_call: { function_ID: 'draw_all_chart_data' + mod_rnd, params: all_data_array}	} );
				input.ACK_MOSI( true );				
		});
		
			

		//------------------- button, get new data from device : -----------			
		sb.on('get_data' + mod_rnd, function(input)
		{
				input.ACK_MOSI( true );		// before the UCT which is long.
				input.MOSI_UCT({Dom_remote_procedure_call: { function_ID: 'draw_all_chart_data' + mod_rnd, params: all_data_array}	} );
		});			
			

 
		//------------------- button, debug save : -----------			
		sb.on('on_save_data' + mod_rnd, function(input)
		{
			var d = JSON.stringify( all_data_array );
			require('fs').writeFile("/tmp/ESP_data.json", d, function(err) {
				if(err)  input.ACK_MOSI( false, err);
				else input.ACK_MOSI( true );
			}); 
		});		



		//------------------- debug load : -----------			
		sb.on('on_load_data' + mod_rnd, function(input)
		{
			require('fs').readFile("/tmp/ESP_data.json", (err, data) => {
				if (err)  input.ACK_MOSI( false, err);
				else {	 all_data_array =  JSON.parse(data);  input.ACK_MOSI( true );	}
				input.MOSI_UCT({Dom_remote_procedure_call: { function_ID: 'draw_all_chart_data' + mod_rnd, params: all_data_array}	} );
			});
		});			


 
		//------------------- debug  progressive datra 'decimation' : -----------			
		sb.on('on_on_refilter_all_data' + mod_rnd, function(input)
		{
			LCONF.postfilter_p_R = Number(input.data.R);
			LCONF.postfilter_p_Q = Number(input.data.Q);
			LCONF.save();

			////// var lcube = 100/(all_data_array.length*all_data_array.length*all_data_array.length);			

					for( var i in hs_filter_array )
					{
							var key = i;
							var filter = new KalmanFilter({R: LCONF.postfilter_p_R, Q: LCONF.postfilter_p_Q, B: 0});			//	var filter = new KalmanFilter({R: 0.01, Q: 0.1, B: 0});
				//////			var qf = filter.Q;
							
								for(var i in all_data_array)
									{
				///////						var ri = all_data_array.length - i;
				///////						var pcn = (lcube * ri* ri * ri)/100;
				//////						filter.Q = qf*pcn;

						//				if(all_data_array[i].filtered2) continue;



									//	if( Object.keys ( all_data_array[ i ] ).length == 1) 	{  delete all_data_array[ i ];	continue; }




										var value =  	all_data_array[i][key];
										if(value === undefined || Number.isNaN(value)				) continue;	//			|| 	pcn< 0.001	
										value= filter.filter (value);
										if(value % 1) value = value.round(3);				// Round if sum has fractions.
										all_data_array[i][ key ] = value;
										all_data_array[i].filtered2 = true;



									}
						}						
			input.MOSI_UCT({Dom_remote_procedure_call: { function_ID: 'draw_all_chart_data' + mod_rnd, params: all_data_array}	} );
			input.ACK_MOSI( true );
		});			


 
		//------------------- Static minimal filtration + progressive decimation : -----------			
		sb.on('on_apx_data' + mod_rnd, function(input)
		{
			LCONF.postfilter_p_R = Number(input.data.R);
			LCONF.postfilter_p_Q = Number(input.data.Q);
			LCONF.postfilter_p_Wmax	= Number(input.data.Wmax);
			LCONF.postfilter_p_Wmin = Number(input.data.Wmin);
			LCONF.postfilter_p_Wconst = Number(input.data.Wconst);
			LCONF.postfilter_p_Ftype = Number(input.data.Ftype);
			LCONF.save();

			var lcube = 100/(all_data_array.length*all_data_array.length*all_data_array.length);
			var lsqur = 100/(all_data_array.length*all_data_array.length);
			var llin = 100/(all_data_array.length);			


			var progressionMode = 
				[
					function (j){				wind =	swind =	LCONF.postfilter_p_Wconst;				     return 1;		},
					function (j){	var riw = all_data_array.length - j;	return  (llin * riw)/100;		},
					function (j){	var riw = all_data_array.length - j;	return  (lsqur * riw * riw )/100;		},
					function (j){	var riw = all_data_array.length - j;	return  (lcube * riw * riw * riw)/100;		},
				]
			var windProgressionCalculator = progressionMode[ LCONF.postfilter_p_Ftype ];
 

			var wind = 		LCONF.postfilter_p_Wmax;		//	Number(input.data.Wmax);
			var windMin = LCONF.postfilter_p_Wmin;			//Number(input.data.Wmin);
			var halfWind = wind/2;
			halfWind = halfWind.round(0);
			var swind = wind;			

			if(all_data_array.length<wind) return 	input.ACK_MOSI( false, 'Dataset is too short' );


			for( var i in hs_filter_array )
				{
					var key = i;
					var filter = new KalmanFilter({R: 0.01, Q: 5});
					//var filter = new KalmanFilter({R: Number(input.data.R), Q: Number(input.data.Q), B: 0});						
					//var qf = filter.Q;

					wind = swind;

					for( var j=0; j<all_data_array.length; j+=wind)
						{
							var sum  = 0;
							var windI = 0;
							var pcw = windProgressionCalculator( j );
							wind = swind * pcw;
							wind = wind.round(0);
							if(wind < windMin)wind = windMin;
							halfWind = wind/2;
							halfWind = halfWind.round(0);
						
							all_data_array[ j ]['FProg'] = wind;

							var bpSw = false;

							for(var k=0; k<=wind; k++)
								 {
										var itr = j+k;
										// for progressive filtration:
									//	var ri = all_data_array.length - itr;
									//	var pcn = (lcube * ri* ri * ri)/100;
									//	filter.Q = qf*pcn;

										if(itr > all_data_array.length) break;
									 	if(!all_data_array[ itr ]) continue;							// If broken
										if(all_data_array[ itr ].filtered1) { bpSw = true; continue;	}			  // It has already been processed, bypassing.
										
										var value =  all_data_array[itr ][key];										
										if(value === undefined || Number.isNaN(value)) continue;		//	if(value === undefined || Number.isNaN(value)		|| 	pcn < 0.0005				) continue;
									
										//	all_data_array[ itr ][ key ] = filter.filter (value);										
																				
										sum += filter.filter(value);

										windI++;
										delete all_data_array[ itr ][key];										
								 }
	 
								 if(all_data_array[ j+halfWind ] !== undefined	&& bpSw == false)	
								 	{
										sum /= windI;
										if(sum % 1) sum = sum.round(3);				// Round if sum has fractions.
										all_data_array[ j+halfWind ][ key ] = sum;
										all_data_array[ j+halfWind ].filtered1 = true;
									}
										
						}
					}
						
			input.MOSI_UCT({Dom_remote_procedure_call: { function_ID: 'draw_all_chart_data' + mod_rnd, params: all_data_array}	} );
			input.ACK_MOSI( true );
		});			
			
		
		formControlElements.push(	{	elmt_ID: 'p_R' + mod_rnd,			  s_param: 'value',		value: 'LCONF.postfilter_p_R'			}	);
		formControlElements.push(	{	elmt_ID: 'p_Q' + mod_rnd,			  s_param: 'value',		value: 'LCONF.postfilter_p_Q'			}	);
		formControlElements.push(	{	elmt_ID: 'p_Wmax' + mod_rnd,	 s_param: 'value',		value: 'LCONF.postfilter_p_Wmax'	}	);
		formControlElements.push(	{	elmt_ID: 'p_Wmin' + mod_rnd,	  s_param: 'value',		value: 'LCONF.postfilter_p_Wmin'	  }	  );
		formControlElements.push(	{	elmt_ID: 'p_Wconst' + mod_rnd,	  s_param: 'value',		value: 'LCONF.postfilter_p_Wconst'	  }	  );
		formControlElements.push(	{	elmt_ID: 'p_Ftype' + mod_rnd,	   s_param: 'value',	value: 'LCONF.postfilter_p_Ftype'		}	);

		


	//------------------- Static minimal filtration + progressive decimation : -----------			
	sb.on('on_event_add' + mod_rnd, function(input)
	{
		var text = input.data.text;
		var time = (new Date()).getTime();		
	 	var event = { time:time,  PIR:2, text : text};
		all_data_array.push(event);
		input.MOSI_UCT({Dom_remote_procedure_call: { function_ID: 'draw_all_chart_data' + mod_rnd, params: all_data_array}	} );
		input.ACK_MOSI( true );
	});			
			
 




		// device command  -> UI feedback:												
		function sdev_fb(input, obj)
				{							
					var msg = 'Device error';
					if(obj.det) msg = obj.det;
					if(obj.error == true) {	exemplar.prototype.remoteDeviceStatus = 1;		exemplar.prototype.gui_rdev_status( );	return input.ACK_MOSI( false, msg);	}	
					else input.ACK_MOSI( true );
				}

}	




//modal_prompt(_qty, "New value:", form_itemlist[ index ]);



//==================================================================================
//==================================================================================
var html = (function () {/*
<script src='/lib/spectrum.js'></script>
<link rel='stylesheet' href='/lib/spectrum.css' />

				<script src="/lib/chartjs/moment.min.js"></script>  
				<script src="/lib/chartjs/chart.js@2.9.1"></script>
				<script src="/lib/chartjs/hammerjs@2.0.8"></script>
				<script src="/lib/chartjs/chartjs-plugin-zoom.min.js"></script>


	<table cellspacing="1"   width="100%"> 															
			<tr  width="60%">
				<td >
						<canvas id="chartContainer2___UnId___"  style="  margin-top: 0px; "   ></canvas>
				</td>				
				<td width="30%">
					<fieldset><legend>[ Legend ]</legend>
						<br>
						<div id = "activeLegendCJSPLOTdata2____UnId___"> </div>
						<br>
						<button onclick="       chart_2___UnId___.resetZoom();		">Reset Zoom</button>						 
						<br>						
					</fieldset>
					<br>
					<fieldset><legend>[ Data processing ]</legend>
						<br>
							<!--<button class="s_ctrl_btn_c"  id="btn_0004p___UnId___" onclick= "MISO_cmd3('on_data_reset___UnId___', {}, ui_button(id)); ">Reset</button>	-->
							<button 
								class="s_ctrl_btn_c"  
								id = "btn_0004p___UnId___" 
								onclick="modal_confirm('Drop dataset?', function(r)
								{
									if(r) MISO_cmd3('on_data_reset___UnId___', {}, ui_button(id));  
								});"> Erase </button>


						<button class="s_ctrl_btn_c"  id="btn_00ir7p___UnId___" onclick= "MISO_cmd3('get_data___UnId___', {}, ui_button(id));    ">Request</button>
						<button class="s_ctrl_btn_c"  id="btn_dataExport___UnId___" onclick= "BtnDataExport___UnId___()  ">Export</button>
											
						<button class="s_ctrl_btn_c"  id="btn_dataSave___UnId___" onclick= "MISO_cmd3('on_save_data___UnId___', {}, ui_button(id));  ">Save</button>
						<button class="s_ctrl_btn_c"  id="btn_dataLoad___UnId___" onclick= "MISO_cmd3('on_load_data___UnId___', {}, ui_button(id));   ">Load</button>		
						<button class="s_ctrl_btn_c"  id="btn_00ir74p___UnId___" onclick= "

								var text = 'AAA bbb  Ccc';
								MISO_cmd3('on_event_add___UnId___', {text:text}, ui_button(id));    
								
								">Add event</button>	 

						<br>
							<button class="s_ctrl_btn_c"  id="btn_refiter___UnId___" onclick= "MISO_cmd3('on_on_refilter_all_data___UnId___', {'R':p_R___UnId___.value ,  'Q':  p_Q___UnId___.value }, ui_button(id));   ">Re-filter</button>
							<label>R:</label>		<input 	type="number" id="p_R___UnId___" min="0.001" step="0.001" max="1" value="0.01">
							<label>Q:</label>		<input 	type="number" id="p_Q___UnId___" min="0.001" step="0.001" max="1" value="0.3">						
						<br>

							<button class="s_ctrl_btn_c"  id="btn_dataAppx___UnId___" onclick= "MISO_cmd3('on_apx_data___UnId___', {'R':p_R___UnId___.value ,  'Q':  p_Q___UnId___.value,  'Wmax': 	p_Wmax___UnId___.value, 'Wmin':  p_Wmin___UnId___.value, 'Wconst':  p_Wconst___UnId___.value,  'Ftype':    p_Ftype___UnId___.value	}, ui_button(id));   ">Approximate</button>
							<label>Progression:</label>		<select id="p_Ftype___UnId___">	 	<option value="0">Constant</option> 		<option value="1">Linear</option> 	 		<option value="2">Quadratic</option> 		<option value="3">Cubic</option>				</select>
							<br>
							<label>Wmax:</label>		<input 	type="number" id="p_Wmax___UnId___" min="5" step="1" max="500" value="80">
							<label>Wmin:</label>		<input 	type="number" id="p_Wmin___UnId___" min="5" step="1" max="500" value="5">
							<label>Wconst:</label>		<input 	type="number" id="p_Wconst___UnId___" min="5" step="1" max="100" value="10">
						<br>
					</fieldset>		
						
					
					
				<!--
					<br><label data-hint="">server poll Update rate, ms: </label>				
						<input 
							type="range" id="update_rate_val___UnId___" min="500" max="5000"
							onchange="compUdp_onchange(id, { cb_value: document.getElementById( 'update_methodswitch___dx007___' ).checked });"
							parameter="rangeValue"
							oninput="compUdp_oninput(id);"
							indicator="update_rate_indicator_val___UnId___" 
							title="Controls data auto-refresh interval"
							command="update_rate_val___UnId___"
						><label id="update_rate_indicator_val___UnId___">   </label> 
					<br>
					<label style="color:#000000">use server-pol:</label>
					 <input type="checkbox"  id="update_methodswitch___dx007___"
						onchange=" 
							cb_save('update_methodswitch___dx007___'); 
							MISO_cmd3('on_update_pol_met___UnId___', 
								{
									cb_value: document.getElementById( 'update_methodswitch___dx007___' ).checked
								}, ui_button(id));
							"> device  (checked) / server (unchecked)
				-->	
				
				
					<br>
					<fieldset><legend>[ Device control ]</legend>
							<br>
							<label id="DeviceStatus_val___UnId___"></label>
							<br>							
							<label style="color:#000000">Enable/disable device:</label>
							<input type="checkbox"  id="ckbox03_device_enabled___UnId___"
								onchange=" 							
									MISO_cmd3('on_device_ctrl___UnId___', 	{	deviceEnabled: document.getElementById(id).checked	}, ui_button(id));
									">									
							<br>

							<label style="color:#000000">Data update interval, ms:</label>
							<input 
								type="number"  min="500" max="60000"     id="text01data_update_interval_TB___UnId___" 
								onchange=" 							
									MISO_cmd3('on_device_ctrl___UnId___', 	{	data_update_interval: value	}, ui_button(id));
									">
							<br>	

							<label style="color:#000000">High CO2 alarm threshold, ppm:</label>
							<input type="number"  min="400" max="2000"      id="text02CO2_Thold___UnId___" 
								onchange=" 							
									MISO_cmd3('on_device_ctrl___UnId___', 	{			CO2LED_Thold: value					}, ui_button(id));
									"> 	

					<!--  <br>
							<label style="color:#000000">CO2 Thold:</label>
							<input type="text"  id="text0002CO2_Thold___UnId___" 
								onchange=" 							
									MISO_cmd3('on_device_ctrl___UnId___', 
										{
											CO2LED_Thold: value
										}, ui_button(id));
									">
					-->
							<br>
								<label style="color:#000000">High CO2 alarm, LED color</label>:		
								<input type='text' id="flat___UnId___" />
								<script>
										function ledSetColor___UnId___( color )
										{
											var lastTime_colorChanged = 0;
											$("#flat___UnId___").spectrum({color: color, clickoutFiresChange: true});
											$("#flat___UnId___").on('move.spectrum', function(e, tinycolor)
															{
																var nowTime = performance.now();
																var timeDiff = nowTime - lastTime_colorChanged;
																if(timeDiff< 40) return;
																lastTime_colorChanged = nowTime;
																var color = {	r: tinycolor.toRgb().r,  g:tinycolor.toRgb().g,  b:tinycolor.toRgb().b		};
																MISO_cmd3('on_indicator_led_set_RGB___UnId___', color, 	 function(){});
															});

											// Set color on page reload.
											document.addEventListener("RGB_Set_color_select_box___UnId___", function(o) 
											{
												//var obj = o.detail.RGB_Set_color_select_box___UnId___;
												var hexColor = "#" + Xdec2hex(o.detail.R) + Xdec2hex(o.detail.G) + Xdec2hex(o.detail.B);
												$("#flat___UnId___").spectrum({		color: hexColor,	showInput: true 	});
											});
										}
										function Xdec2hex(decimal) { var chars = 2;   return (decimal + Math.pow(16, chars)).toString(16).slice(-chars).toUpperCase();	}	
								</script>
								<br>								
					</fieldset>	



				</td></tr>



</table>
<br>





<script>
{

				var bar_ctx = document.getElementById('chartContainer2___UnId___').getContext('2d');
				var purple_orange_gradient = bar_ctx.createLinearGradient(0, 0, 0, 600);
				purple_orange_gradient.addColorStop(0, 'orange');
				purple_orange_gradient.addColorStop(1, 'purple');


				// ONE: Init	
				// Active legend configuration:
				CJSPLOTdata2____UnId___ = [];
				CJSPLOTdata2____UnId___.push( {  type: "scatter", data:[],	  label: 'Motion event', 				 vunit: '', 								borderColor:'#ff0000',   	   		 inpDataKey: 'PIR', 		pointRadius :5,																						});
				CJSPLOTdata2____UnId___.push( {  type: "line", 		data:[],	label: 'Temperature', 			 	   vunit: '°C', 	toFixed:2,			borderColor:'#ce0d0d',  	  		 inpDataKey: 't', 					backgroundColor: "rgba(255,153,0,0.6)",	 fill: true, 		yAxisID : "y-axis-2",													});
				CJSPLOTdata2____UnId___.push( {  type: "line", 		data:[],	label: 'Humidity', 			 			  vunit: '%RH', toFixed:2,			borderColor:'#3225de',       		  inpDataKey: 'h', 					backgroundColor: "rgba(153,100,255,0.6)", fill: true, 	 yAxisID : "y-axis-2",													});
				CJSPLOTdata2____UnId___.push( {  type: "line", 		data:[], 	label: 'Dew point',				   		 vunit: '°C', 		toFixed:2,			borderColor:'#8314b9',  			 inpDataKey: 'dewp', 																								 yAxisID : "y-axis-2",		 											});
				CJSPLOTdata2____UnId___.push( {  type: "line", 		data:[],	label: 'Pressure',   					  vunit: 'kPa', 	toFixed:2,	  			borderColor:'#466b53',  	  		 inpDataKey: 'p', 				yAxisID : "y-axis-3",																								 											});
				CJSPLOTdata2____UnId___.push( {  type: "line", 		data:[], 	label: 'CO2, ppm', 					    vunit: 'ppm', 					 			borderColor:'#446b3a',  			 inpDataKey: 'co2', 				 	tension: 0.1,	backgroundColor: purple_orange_gradient,	 fill: false, 	yAxisID : "y-axis-3",				});
				//CJSPLOTdata____UnId___.push( {  type: "line", 	 data:[], 	 label: 'CO', 								  vunit: 'ppm', 								borderColor:'#ea4630',  	 		 inpDataKey: 'gas_1', 				 																																								});
				//CJSPLOTdata____UnId___.push( {  type: "line", 	 data:[], 	 label: 'Geiger counter, Ppm', 		vunit: 'PPM', 								borderColor:'#bb2528',  			 inpDataKey: 'geigerCount', 		tension: 0.1,																																			 });
				CJSPLOTdata2____UnId___.push( {  type: "line", 		data:[], 	label: 'Dust particles', 				 vunit: 'μg/m³', toFixed:1,				borderColor:'#405050',  	 		 inpDataKey: 'dust_all_pm', 		tension: 0.1,																																			});
				CJSPLOTdata2____UnId___.push( {  type: "line", 		data:[], 	label: 'Dust particles PM1', 		 vunit: 'μg/m³',  							borderColor:'#a0a00a',  	 		 inpDataKey: 'dust_pm_10_std', 	 	tension: 0.1,																																		});
				CJSPLOTdata2____UnId___.push( {  type: "line", 		data:[], 	label: 'Dust particles PM2.5', 		vunit: 'μg/m³', 							borderColor:'#00c009',  			 inpDataKey: 'dust_pm_25_std', 		tension: 0.1,																							 											});
				CJSPLOTdata2____UnId___.push( {  type: "line", 		data:[], 	label: 'Dust particles PM10', 		vunit: 'μg/m³', 							borderColor:'#00a0aa', 			 		inpDataKey: 'dust_pm_100_std', 	 tension: 0.1,																																		});
				CJSPLOTdata2____UnId___.push( {  type: "line", 		data:[], 	label: 'Dust particles P3', 			vunit: 'particles/100ml', 				borderColor:'#5812aa',  			 inpDataKey: 'p3', 						 		tension: 0.1,																																		});

				//CJSPLOTdata2____UnId___.push( {  type: "line", 		data:[], 	label: 'Dust particles P3a', 		  vunit: 'particles/100ml', 				borderColor:'#F812Fa',  		 	inpDataKey: 'u3', 																																														 });


				CJSPLOTdata2____UnId___.push( {  type: "line", 		data:[], 	label: 'Data approximating progression', 								vunit: '', 	borderColor:'#F812Fa',  	 inpDataKey: 'FProg', 																																																		 });
 
		

				for(var i in CJSPLOTdata2____UnId___) 
					{
						if(!CJSPLOTdata2____UnId___[i].pointRadius)CJSPLOTdata2____UnId___[i].pointRadius = 0;
					}



				// Active legend generator:
				var activeLegend = activeLegendCJSPLOTdata2____UnId___;
				for( var i in CJSPLOTdata2____UnId___)
					{
							CJSPLOTdata2____UnId___[ i ].hidden = true;										// The default state 
							var checkbox = document.createElement("input");
									checkbox.type = 'checkbox';	 
									checkbox.id = 'cbxAAAAA'+i;															//checkbox.id = 'cbx____UnId___'+i;				// Better module-dependent ID
									//Load cb state from local storage:
									checkbox.checked = (localStorage.getItem(checkbox.id) === 'true');
									CJSPLOTdata2____UnId___[ i ].hidden = !checkbox.checked;
									checkbox.onchange = function( i,c,cid )
										{
											// Save state:
											localStorage.setItem(cid, c.checked);
											CJSPLOTdata2____UnId___[ i ].hidden =  !c.checked;
											chart_2___UnId___.update();
										}.bind( 0, i, checkbox, checkbox.id );
									activeLegend.appendChild(checkbox);               								// Append <button> to <body> 			
							
							var label1 = document.createElement('label');
									label1.textContent =  CJSPLOTdata2____UnId___[i].label ;
									label1.style.color =  CJSPLOTdata2____UnId___[i].borderColor;					
									activeLegend.appendChild(label1);

							// Add the value indicator only if 'unit' is set:
							if( CJSPLOTdata2____UnId___[i].vunit )
								{
									var label2 = document.createElement('label');
											//label2.id = CJSPLOTdata2____UnId___[i].currentValueIndicatorElement	 = 'cvl____UnId___'+i;
											CJSPLOTdata2____UnId___[i].currentValueIndicatorElement = label2;
											label2.id = 'cvl____UnId___'+i;
											label2.style["margin-left"] =  '1.5em'
											label2.style["margin-right"] =  '0.5em'
											label2.textContent = '  ';	
											activeLegend.appendChild(label2);															
											activeLegend.appendChild(  document.createTextNode(	 CJSPLOTdata2____UnId___[i].vunit ) );
								}
							activeLegend.appendChild( document.createElement('br') );				// End of line
					}







					// Chart.js initialization:
					var chart_2___UnId___ = new window.Chart(document.getElementById('chartContainer2___UnId___').getContext('2d'),
						{							 
							data: 	{					  datasets: CJSPLOTdata2____UnId___		},
							options: 
								{
									elements: {        line: {     fill: false,     tension: 0 ,    }    		},									
									animation: {       duration: 0    												},									 
									tooltips: {			 mode: 'index',				intersect: false,		  },
									hover: {			 mode: 'nearest',		intersect: true				},
									legend: {			display: false, 		position: "right"		 	  },																			
									title: 	 {				display: false,		text: 'Air parameters'		  },									
									responsive: true,
									//maintainAspectRatio: false,
									scales: {
														xAxes: [{
															type: 'time',
															//time: {						parser:  'MM/DD/YYYY HH:mm',			tooltipFormat: 'll HH:mm'										},	// round: 'day'
															time: {						parser: 'MM/DD/YYYY HH:mm',		tooltipFormat: 'DD/H:m',		stepSize: 2, 	minUnit:'minute'   },	// round: 'day'
															position: 'bottom',
															gridLines: 	 {			zeroLineColor: 'rgba(10,55,0,1)'			},
															scaleLabel: {		 	display: false,					labelString: 'Time'	 },
															ticks: {			 reverse: false, 		   	maxRotation: 40,				autoSkipPadding:6, padding:12		}
														}],
														
														yAxes: [
														//	{
														//		id:"y-axis-1",
														//		position: 'right',
														//		gridLines: {			zeroLineColor: 'rgba(10,55,0,1)'			},
														//		type: 'linear',	
														//		scaleLabel: {			display: false,	labelString: 'y axis 1'	},
														//		ticks: {	  reverse: false,	beginAtZero:false		}
														//	},
															{
																id:"y-axis-2",
																position:'left',
																gridLines: {			zeroLineColor: 'rgba(200,55,0,1)'			},
																type: 'linear',																
																scaleLabel: {			display: false,				labelString: 'y axis 2'	},
																ticks: {	reverse: false,		beginAtZero:false	},
															},
															{
																id:"y-axis-3",
																position:'left',
																gridLines: {			zeroLineColor: 'rgba(0,0,0,1)'			},
																type: 'linear',																
																scaleLabel: {			display: false,				labelString: 'y axis 2'	},
																ticks: {	reverse: false,		beginAtZero:false	},
															}
																
																					
													
													
													]
												},
									//plugins: {				zoom: {	pan: {			  enabled: true,	 mode: 'xy'			},		zoom: {			enabled: true,		mode: 'xy'		}	}					},
									plugins: {				zoom: {	pan: {			  enabled: true,	 mode: 'xy'			},		zoom: {			enabled: true,		mode: 'x'		}	}					},
								}
						});		
			


				// TWO:  Load
							//  RPC  Gets all chart_data:
							function draw_all_chart_data___UnId___(obj)
									{
										// reset datapoints:
										for(var i in CJSPLOTdata2____UnId___) CJSPLOTdata2____UnId___[i].data = [];
										// load new:
										for(var i in obj)
											//if(obj[i].time)
												for(var j in CJSPLOTdata2____UnId___)
													if(  obj[i][CJSPLOTdata2____UnId___[j].inpDataKey] )
													//	CJSPLOTdata2____UnId___[j].data[i] = {x: obj[i].time, y: obj[i][CJSPLOTdata2____UnId___[j].inpDataKey]};
														{
															if(obj[i].time) 
															{
																if(i == 0)CJSPLOTdata2____UnId___[j].data[i] = {x:obj[i].time, y: obj[i][CJSPLOTdata2____UnId___[j].inpDataKey]};
																CJSPLOTdata2____UnId___[j].data.push(  {x: obj[i].time, y: obj[i][CJSPLOTdata2____UnId___[j].inpDataKey]}  );
															}
														}
										chart_2___UnId___.update();
									}


				//  THREE: Update
							//  RPC  Gets the newest point in chart_data: This function may be combined with the UI updater (uiElementBulkUpdate)
							function append_chart_data___UnId___(obj)
									{		
										for(var j in CJSPLOTdata2____UnId___)
													if(obj[CJSPLOTdata2____UnId___[j].inpDataKey])
														{
															// Update charts which are enabled in the legend:
															CJSPLOTdata2____UnId___[j].data.push( {x: obj.time, y: obj[CJSPLOTdata2____UnId___[j].inpDataKey]} );

															// Show current values in the legend:
															var val = obj[ CJSPLOTdata2____UnId___[ j ].inpDataKey ];
															var e = CJSPLOTdata2____UnId___[ j ].currentValueIndicatorElement;
															var tf = CJSPLOTdata2____UnId___[ j ].toFixed;
															if(val === undefined) {e.textContent =  val; continue;}
															if(tf && val)	val = val.toFixed(tf);
															if(e && val)  e.textContent =  val;

															// if(deriv > 0) return '▲';		//		if(deriv < 0) return '▼';	

														}
										chart_2___UnId___.update();


										// Dashboard:
										DeviceStatus_val___UnId___.innerText  = obj.DeviceStatusText;
										if(typeof updateGauge___UnId___ === "function") updateGauge___UnId___( obj );

									}

				// FOUR: Export,  not working
							// Exports data as csv or png file
							function BtnDataExport___UnId___(dataset)
								{
									console.log( 'not implemented')


									function downloadFile(data, fileName) 
										{
											var csvData = data;
											var blob = new Blob([ csvData ], {		type : "application/csv;charset=utf-8;"		});
											if (window.navigator.msSaveBlob) navigator.msSaveBlob(blob, fileName);			//ie
											else {
												var link = document.createElement("a");
												var csvUrl = URL.createObjectURL(blob);
												link.href = csvUrl;
												link.style = "visibility:hidden";
												link.download = fileName;
												document.body.appendChild(link);
												link.click();
												document.body.removeChild(link);
											}
										}

										for( var i in dataset) downloadFile(dataset[i], 'file_'+i+'.csv')

								}	







	
}
</script> 

*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1] + superConstructor.deviceResetUpdateHTML;
 

//==================================================================================
//==================================================================================

var htmlShort = (function () {/*
	<script src="/lib/justgage/justgage.js"></script>
	<script src="/lib/justgage/raphael-2.1.4.min.js"></script>
    <style>
    	.gauge {      width: 130px;      height: 100px;    } 
	</style>
	
	
	<table>	
	 	<tr align="center">			<td> <div id="g1" class="gauge"></div> </td>		<td> <div id="g2" class="gauge"></div> </td>				<td> <div id="g3" class="gauge"></div> </td>				<td> <div id="g4" class="gauge"></div> </td>				</tr>
		<!--	<tr align="center">			<td> Temperature </td>		<td> Relative humidity </td>				<td> CO2 concentration </td>				<td> Dust pollution </td>				</tr>	-->
	</table>
		
    <script>       
			var g1 = new JustGage({
				id: 'g1',
				value: 50,        min: -10,     max: 50,        symbol: 'C',
				pointer: true,
				gaugeWidthScale: 0.6,
				//customSectors: [{ color: '#ff0000',          lo: 50,          hi: 100    }, {          color: '#00ff00',          lo: 0,          hi: 50        }],
				counter: true,
				title: "Temperature",
         		//label: "C"
			});

			var g2 = new JustGage({
				id: 'g2',
				value: 100,        min: 0,        max: 100,        symbol: '%',
				pointer: true,
			//	pointerOptions: {          toplength: -15,          bottomlength: 10,          bottomwidth: 12,          color: '#1e8e93',          stroke: '#ffffff',          stroke_width: 3,          stroke_linecap: 'round'        },
			//	customSectors: [{ color: '#ff0000',          lo: 50,          hi: 100    }, {          color: '#00ff00',          lo: 0,          hi: 50        }],
				gaugeWidthScale: 0.6,
				counter: true,
				title: "Relative humidity",
         		//label: "%"
			});

			var g3 = new JustGage({
				id: 'g3',
				value: 5000,        min: 400,        max: 5000,        symbol: '',
				//donut: true,
				pointer: true,
				gaugeWidthScale: 0.4,
				//pointerOptions: {          toplength: 10,          bottomlength: 10,          bottomwidth: 8,          color: '#000'        },
				//customSectors: [{          color: "#ff0000",          lo: 50,          hi: 100        }, {          color: "#00ff00",          lo: 0,          hi: 50        }],
				//pointerOptions: {          toplength: 8,          bottomlength: -20,          bottomwidth: 6,          color: '#aae53'        }, 
				counter: true,
				title: "CO2 concentration ",
         		label: "PPM"
			});

			var g4 = new JustGage({
				id: 'g4',
				value: 1000,        min: 0,        max: 1000,        symbol: '',
				pointer: true,
				//pointerOptions: {          toplength: 8,          bottomlength: -20,          bottomwidth: 6,          color: '#8e8e93'        },      
				gaugeWidthScale: 0.3,
				counter: true,
				title: "Dust pollution ",
         		label: "um/m3"
			});

		
			function updateGauge___UnId___( obj )
					{
 					      if( !isNaN( obj.h ))						g1.refresh( obj.t );
 					      if( !isNaN( obj.h ))					 	g2.refresh( obj.h );
 					      if( !isNaN( obj.co2 ))				  g3.refresh( obj.co2 );
 					      if( !isNaN( obj.dust_all_pm ))	g4.refresh( obj.dust_all_pm );
					}
	
	</script>
*/}).toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];


_moduleScope.html_n = html;
_moduleScope.htmlShort_n = htmlShort;
