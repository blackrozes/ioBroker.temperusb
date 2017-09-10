"use strict";

var utils =    require(__dirname + '/lib/utils'); // Get common adapter utils
var adapter = utils.adapter('temperusb');
var HID = require('node-hid');

var readCommand=[0x01, 0x80, 0x33, 0x01, 0x00, 0x00, 0x00, 0x00];
var updateIntervall = 300;
var offset = 0;
var scale = 1;
var degree = "°C";

adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

var temper = function() {};

adapter.on('ready', function () {

    //adapter.subscribeStates('*');	
	var devices=temper.getDevices();
	
	if(devices.length == 0) { 
		adapter.log.error("Error: No TEMPer Devices found.");
		return false; 
	} 	
	
	if(typeof adapter.config.offset !== "undefined" && adapter.config.offset != offset) {
		offset = adapter.config.offset;
	}
	if(typeof adapter.config.scale !== "undefined" && adapter.config.scale != scale ) {
		scale = adapter.config.scale;
	}	
	if(typeof adapter.config.updateIntervall !== "undefined" && adapter.config.updateIntervall != updateIntervall) {
		updateIntervall = adapter.config.updateIntervall;
	}		
	if(typeof adapter.config.degreef !== "undefined" && adapter.config.degreef == 1 ) {
		degree = '°F';
	}	
	
	for(var i=0;i<devices.length;i++) {
		adapter.setObject("temper"+i, {
			type: 'state',
			common: {
				name: 'Temper USB #'+i,
				type: 'state', 
				role: 'value.temperature',
				unit: degree
			},
			native: {}
		});
		temper.updateDevice(devices[i],i);
	}

	setInterval(temper.updateAll, updateIntervall * 1000);	
});

temper.updateAll = function() {
	
	var devices=temper.getDevices();
	
	if(devices.length == 0) {
		adapter.log.error("Error: No TEMPer devices found.");
		return false;
	} 
	
	for(var i=0;i<devices.length;i++) {
		temper.updateDevice(devices[i],i);
	}	
}

temper.updateDevice = function(dev,i) {
	
	temper.readTemperature(dev, function(err, value) {		
		
		if(degree=='°F') {
			value = temper.celsiusToFahrenheit(value);
		}
		
		value = (value*scale)+parseFloat(offset);
		
		if(err === null) {
			adapter.setState("temper"+i, parseFloat(value).toFixed(1));
		} else {
			adapter.log.error("Error: "+value);
		}
	});			
}

temper.getDevices=function() {
	
	var devices=HID.devices();
	var expectedInterface = process.platform === 'darwin' ? -1 : 1;
	var seen={};
	var list=[];
	devices.forEach(function(item) {
	if( 
		item.vendorId===3141 
		&&item.interface===expectedInterface 
		&&!seen[item.path]
	 ) {
		list.push(item.path);
		seen[item.path] = true;
	}
	});
	return list;
}

temper.readTemperature=function(path, callback, converter){
	if(!converter) {
		converter=temper.toDegreeCelsius;
	}
	try {
		var device = new HID.HID(path);;
		device.write(readCommand);
		device.read(function(err,response){
			device.close();
			if(err) {
				callback.call(this,err,null); 
			} else {
				callback.call(this,null, converter(response[2],response[3]), converter(response[4], response[5]));
			}
		});
	} catch (e) {
		
	}

}

temper.toDegreeCelsius = function(hiByte, loByte) {
	if (hiByte == 255 && loByte == 255) {
		return NaN;
	}
	if ((hiByte & 128) == 128) {
		return -((256-hiByte) + (1 + ~(loByte >> 4)) / 16.0);
	}
	return hiByte + ((loByte >> 4) / 16.0);
}

temper.toDegreeCelcius = function(hibyte, lobyte) {
	return temper.toDegreeCelsius(hibyte, lobyte);
}

temper.toDegreeFahrenheit = function(hiByte, loByte) {
	return temper.celsiusToFahrenheit(temper.toDegreeCelsius(hiByte, loByte));
}

temper.celsiusToFahrenheit = function(c) {
	return (c * 1.8) + 32.0;
}
