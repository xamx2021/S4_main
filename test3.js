#!/usr/bin/node
//#!/usr/local/bin/node




var emulated =
{
channel:1,
EPC:"000000000329",
event_name:"on_ss_EPC_raw",
module_id:3,
mux:10,
muxEnabled:false,
muxModeMap: [32, 0, 0, 0],
phase:56,
readCounter:9,
reader_id:"0",
RSSI:-53,
tagCounter:"1",
TTL:4
}

const amsServer = "18.222.177.131";
const amsPort = 2456;

var client =  require('dgram').createSocket('udp4');


			setInterval(function () 
			{	
				try{	
						var message = new Buffer( JSON.stringify(emulated) );
						client.send(message, 0, message.length, amsPort, amsServer, function(err, bytes)
							{
								  if (err) throw err;		console.log('sent');		  client.close();					
							});
					} catch(e){ console.log('#Error #5020: '+e); }				

			}, 1000); 





