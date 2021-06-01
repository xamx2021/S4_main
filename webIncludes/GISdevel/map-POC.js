


var map = L.map( 'map', {  center: [43.66,-79.38],  minZoom: 2,  zoom: 12	})
 

L.tileLayer( 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: ['a', 'b', 'c']
}).addTo( map )


var truckIcon = L.icon({
  iconUrl: 'images/196770truck.png',
  iconRetinaUrl: 'images/196770truck.png',
  iconSize: [29, 24],
  iconAnchor: [9, 21],
  popupAnchor: [0, -14]
});

var eventIcon = L.icon({
  iconUrl: 'images/196770fire.png',
  iconRetinaUrl: 'images/196770fire.png',
  iconSize: [29, 24],
  iconAnchor: [9, 21],
  popupAnchor: [0, -14]
});

var warehouseIcon = L.icon({
  iconUrl: 'images/603298-wareh.png',
  iconRetinaUrl: 'images/603298-wareh.png',
  iconSize: [29, 24],
  iconAnchor: [9, 21],
  popupAnchor: [0, -14]
});


var generaLIcon = L.icon({
  iconUrl: 'images/pin24.png',
  iconRetinaUrl: 'images/pin48.png',
  iconSize: [29, 24],
  iconAnchor: [9, 21],
  popupAnchor: [0, -14]
});




var markers = [
   {
     "name": "Test unit",
     "lat": 43.6684674,
     "lng": -79.385981,
	 "icon": truckIcon
   },
   {
     "name": "Toronto test warehouse",
     "lat": 43.6684674,
     "lng": -79.385981,
	 "icon": warehouseIcon
   },   
];


var marker_array = [];
for ( var i=0; i < markers.length; ++i )
{
	var tmp = L.marker( [markers[i].lat, markers[i].lng], {icon: markers[i].icon} ).bindPopup( ' ' + markers[i].name + '  ' )  .addTo( map );
	tmp.name = markers[i].name;
	marker_array.push( tmp );
}
	
	
var markerUpdate1 = function ( c )
	{
		var inventory = '<ul>';		
		for( var i in c[2]) inventory += '<li>' + i + '</li>';		
		inventory += '</ul>';
					
		marker_array[0].setLatLng(   new L.LatLng(c[1], c[0])   ); 
		//marker_array[0]._popup._content = 'Updated data: ' + c;
		marker_array[0]._popup._content = marker_array[0].name + ' inventory tags: <br>' + inventory;
		marker_array[0].update( );
	}
  
var markerUpdate2= function ( c )
	{
		marker_array[1].setLatLng(   new L.LatLng(c[1], c[0])   ); 
		//marker_array[1]._popup._content = 'Updated data: ' + c;
		marker_array[1].update( );
	}

		 
	
var makeDurationAndDrawTrack = function( ret )
	{	
		var d = ret.routes[0];					// Select route
 
		var pointList = d.geometry.coordinates;			
		for(var i in pointList ) {		 	var b = pointList[i][0];		pointList[i][0] = pointList[i][1];		pointList[i][1] = b;			}						//Swap coordinates
		var firstpolyline = new L.Polyline(pointList, {			color: 'red',			weight: 5,			opacity: 0.8,			smoothFactor: 1		});
		firstpolyline.addTo(map);
		
		
		
		
		function secondsToTime(seconds) {  const arr = new Date(seconds * 1000).toISOString().substr(11, 8).split(':');  const days = Math.floor(seconds / 86400); arr[0] = parseInt(arr[0], 10) + days * 24;  return arr.join(':');}
				
				
		var TT = secondsToTime( d.duration );
		
 
		var et = new Date();
		et.setSeconds( et.getSeconds() + d.duration );		
		var ET = et.getHours() + ":" + et.getMinutes();//	 + ":" + et.getSeconds();
		
		 
		 
	
		
		return '  ' + (d.distance/1000).toFixed(1)  + 'km,  Arrive by: ' + ET  + ' (' + TT + ')';
		return '    Distance: ' + (d.distance/1000).toFixed(1) + ' km;    Estimated travel time: ' + TT + ';    Arrive by: ' + ET ;
	}
	
	
	
	
	

//-----[ WEB browser location ]-----------------------------------
if( 0 )	setInterval(function()
		{
			if (navigator.geolocation)     navigator.geolocation.getCurrentPosition(function(position)
				{							
							MISO_cmd3('on_send_web_location', {driver_id:5,  latitude :position.coords.latitude,   longitude:position.coords.longitude} , function(ret){ });
				});   
		}, 6000);
	
	
	
	
  