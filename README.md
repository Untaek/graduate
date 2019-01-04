# Petsitter

Feeding pets automating system. Gather sensor data from embedded device (Arduino) using MQTT protocol periodically. And then, feed optimal amount from the calculated sensor values. Pet owner can see pet’s current status in web site.

## Requirement
* Mysql
* Redis
* Couchbase
* Nodejs, Npm
* Arduino ESP8266 board, Arduino Mega, and Components that make up a Feeding machine like a sensor, servo motor, water pump etc.

## Details
- [Detailed report link](https://github.com/Untaek/graduate/blob/master/senior%20project%20report1.pdf)
- [Simple report link](https://github.com/Untaek/graduate/blob/master/senior%20project%20presentation.pdf)


## How to start
1. npm run broker
2. npm run server
3. power on the Arduino.
4. connect http://localhost:3001/

## Who made this game?
Untaek, Sejun, Heeyeon

This reposiratory is made for senier project.