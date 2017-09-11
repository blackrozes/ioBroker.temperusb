# iobroker.temperusb

About
---------
ioBroker adapter for [TEMPer USB sensor devices](http://pcsensor.com/). 

This adapter is based on [Temper1](https://github.com/asmuelle/node-temper1)

**Features**

* Multiple thermometers
* °F and °C
* Adjustable output values

Installation
----------------
 iobroker.temperusb Requires [node-hid](https://github.com/node-hid/node-hid).
 
 Installation on Raspberry Pi please see https://github.com/node-hid/node-hid#compiling-from-source
 
To fix the USB permissions on your system create the file /etc/udev/rules.d/99-tempsensor.rules and add the following line to it:

    SUBSYSTEMS=="usb", ACTION=="add", ATTRS{idVendor}=="0c45", ATTRS{idProduct}=="7401", MODE="666"

