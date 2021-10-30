# YourHomeServer

A powerfull nodejs server based on express module to control different smart home device brands locally or over the cloud.

## Installation and start server

```
git clone https://github.com/ifsale/YourHomeServer.git

cd YourHomeServer

git rm --cached config/cloud.json &&
git rm --cached config/conditions.json &&
git rm --cached config/config.json &&
git rm --cached config/scenes.json &&
git rm --cached config/local/devices.json &&
git rm --cached package.json

git reset

git update-index --assume-unchanged config/local/devices.json &&
git update-index --assume-unchanged config/cloud.json &&
git update-index --assume-unchanged config/scenes.json &&
git update-index --assume-unchanged config/conditions.json &&
git update-index --assume-unchanged config/config.json &&
git update-index --assume-unchanged package.json

npm install

node app.js

```

## Tuya local module
Use this module to control  control Tuya/Smart Life devices locally

```
npm install codetheweb/tuyapi
```

## Miio local module
Use this module to control Mi Home devices locally
```
npm install miio-api
```

## Tuya cloud module
Use this module to control  control Tuya/Smart Life devices over the cloud

```
npm install tuyacloudnodejs
```

## SmartThings cloud module
Use this module to control  control SmartThings devices over the cloud

```
npm install smartthingsnodejs
```

## Basic usage

Start by configuring a devices in the file ./config/local/devices.json (example with tuya device):
```
"lr-light1":
{	
	"id": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" ,
	"key": "XXXXXXXXXXXXXXX" ,												
	"type": "tuya" ,								
	"category":"dj" 								
}
```
Make a request to one of these endpoint to control your device, like the examples shown below:

Get the device data\
http://address:port/local/device/lr-light1/?action=info

Trigger an action on the device (turn off light)\
http://address:port/local/device/lr-light1/?action=off

Another way to turn off the device\
http://address:port/local/device/lr-light1/?action=switch&value=off

Send multiple actions to perform on device\
http://address:port/local/device/lr-light1/?actions=brightness^temperature^on&values=10^10


## Advanced usage

### Server configuration
Configure custom server parameters in the file ./config/config.json
```
{
	"address":"0.0.0.0" ,
	"port": 3000 ,
	"timeout": 60000
}
```

### Device configuration
Configure your devices and cloud scenes in the file ./config/local/devices.json, categories are found in ./config/local/schemas.json

Configure tuya device example (ip is optional)
```
"lr-light1":
{
	"id": "XXXXXXXXXXXXXXXXXXX",
	"key": "XXXXXXXXXXXXXXX" ,
	"ip": "192.168.2.8" ,
	"type": "tuya" ,				
	"category":"dj"
}
```
Configure miio device example
```
"lr-light1":
{
	"token": "XXXXXXXXXXXXXXXXXXXXXXXXXXXX" ,
	"ip": "192.168.2.8" ,
	"type": "miio" ,	
	"category":"dj" 
}
```
Configure smartthings device example
```
"lr-light1":
{
	"id": "XXXXXXXXXXXXXXXXXXXXXXXXXXXX" ,
	"type": "smartthings" ,	
	"category":"dj" 
}
```
Use this endpoint to trigger device actions
http://address:port/local/device/lr-light1/?actions={action}&values=&{values}
All possible actions are found in the schema file dependiong on the device category

Configure scene to be triggered example (acts as a device)
```
"sc-tv-mute-toggle":
{
	"id": "XXXXXXXXXXXXXXXXXXX" ,
	"type": "tuya" ,					// tuya|smartthings
	"category":"scene"					// special category
}
```
### Scenes configuration

scenes can trigger actions on multiple devices at once, this is a very powerful feature.\
Configure your scenes in the ./config/scenes.json

Configure scene example (turn on living room lights):

Scenes can trigger actions on multiple devices at once, this is a ver powerful feature.\
Configure your scenes in the ./config/scenes.json.

Scene configuration example (turn on living room lights):
```
"lr-lights-on":
{
	"lr-light1": { "actions": "brightness^temperature^on" , "values": "10^10" } , // use the device label
	"lr-light2": { "actions": "brightness^temperature^on" , "values": "10^10" } ,
	"lr-light3": { "actions": "brightness^temperature^on" , "values": "10^10" }
}
```
Run your scene\
http://address:port/local/scene/lr-lights-on/

### Query scene configuration

This feauture allows you to make a request to retrieve values from multiple devices at once.\
Create a scene just like the previous example and use either info as action or specify device fields found in the schema file:
```
"air-values":
{
	"lr-ir": { "actions": "info" } ,
	"mb-ir": { "actions": "info" } , 
	"mb-humidifier": { "actions": "info" }
}
```
Query your scene and get devices data with this ednpoint\
http://address:port/local/query/air-values/

### Conditions configuration

Configure your conditions to be evaluated in the ./config/conditions.json
```
To do
```

### Cloud examples
```
To do
```

## Main endpoints

Actions are found in the schema file.\
Cloud types are "scenes|devices|home|token" for tuya and "devices|apps|subscriptions" for SmartThings\
Use get-methods for each type as a method to see all the cloud methods available

Run actions on a device\
http://address:port/local/device/{label}/?actions={actions}&values={values}

Run a scene\
http://address:port/local/scene/{name}/

Query a scene\
http://address:port/local/query/{name}/

Evaluate a condition\
http://address:port/local/eval/{name}/

Direct tuya cloud requests\
http://address:port/cloud/tuya/{type}/{configLabel}/{deviceID|label}/{method}/

Direct SmartThings cloud requests\
http://address:port/cloud/smartthings/{type}/{configLabel}/{deviceID|label}/{method}/{component?}/{capability?}/



*** Cloud support is available for tuya and SmartThings devices at the moment (no cloud Xiaomi support).
