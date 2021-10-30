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

Configure tuya device example (ip is optional):
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
Configure miio device example:
```
"lr-light1":
{
	"token": "XXXXXXXXXXXXXXXXXXXXXXXXXXXX" ,
	"ip": "192.168.2.8" ,
	"type": "miio" ,	
	"category":"dj" 
}
```
Configure smartthings device example:
```
"lr-light1":
{
	"id": "XXXXXXXXXXXXXXXXXXXXXXXXXXXX" ,
	"type": "smartthings" ,	
	"category":"dj" 
}
```
Use this endpoint to trigger device actions:\
http://address:port/local/device/lr-light1/?actions={action}&values=&{values} \
All possible actions are found in the schema file depending on the device category.

Configure scene to be triggered example (acts as a device):
```
"sc-tv-mute-toggle":
{
	"id": "XXXXXXXXXXXXXXXXXXX" ,
	"type": "tuya" ,					// tuya|smartthings
	"category":"scene"					// special category
}
```
To trigger scenes, they must be configured as a scene in the file ./config/scenes.json.\
The following url will trigger your scene
http://address:port/local/scene/{sceneName}/

### Scenes configuration

Scenes can trigger actions on multiple devices at once, this is a very powerful feature.\
Configure your scenes in the ./config/scenes.json

Scene configuration example (turn on living room lights):
```
"lr-lights-on":
{
	"lr-light1": { "actions": "brightness^temperature^on" , "values": "10^10" } , // use the device label
	"lr-light2": { "actions": "brightness^temperature^on" , "values": "10^10" } ,
	"lr-light3": { "actions": "brightness^temperature^on" , "values": "10^10" }
}
```
Run your scene by calling this endpoint\
http://address:port/local/scene/lr-lights-on/

### Query scene configuration

This feauture allows you to make a request to retrieve values from multiple devices at once. Create a scene just like the previous example and use either info as action or specify device fields found in the schema file.

Example scene query configuration:
```
"air-values":
{
	"lr-ir": { "actions": "info" } ,
	"mb-ir": { "actions": "info" } , 
	"mb-humidifier": { "actions": "info" }
}
```
Example scene query configuration with specific values (use ^ as separator):
```
"air-values":
{
	"lr-ir": { "actions": "temp^hum" }
}
```
Query your scene and get devices data with this ednpoint\
http://address:port/local/query/air-values/

### Conditions configuration

Condition are another powerful feature that can allow you to evaluate the status of certain devices and use the actions "then" and "else" depending on the condition result. Configure your conditions to be evaluated in the ./config/conditions.json

Example condition simply returing true or false (using "AND"):
```
"lr-check-lights-off":
{
	"conditions":
	[
		{
			"label":"lr-light1" ,
			"eval": "switch=false"
		} ,
		{
			"label":"lr-light2" ,
			"eval": "switch=false"
		} ,
		{
			"label":"lr-light3" ,
			"eval": "switch=false"
		}
	] 
}
```
Example condition using action "then" if condition is true:
```
"br-fan-start-routine":
{
	"conditions":
	[
		{
			"label":"br-fan" ,
			"eval": "switch=false"
		}
	] ,
	"then": 
	{
		"run": "br-fan-routine"
	}
}
```
Example condition using action "then" if condition is true, else if condition is false:
```
"br-fan-start-routine":
{
	"conditions":
	[
		{
			"label":"br-fan" ,
			"eval": "switch=false"
		}
	] ,
	"then": 
	{
		"run": "some-scene-name"
	} ,
	"else":
	{
		"run": "some-other-scene-name"
	}
}
```
Example condition using "OR" (can be mixed with "AND"):
```
"lr-check-lights-on":
{
	"conditions":
	[
		{
			"label":"lr-light1" ,
			"eval": "switch=true" ,
			"or":
			[
				{
					"label":"lr-light2" ,
					"eval": "switch=true"
				} ,
				{
					"label":"lr-light3" ,
					"eval": "switch=true"
				} ,
				{
					"label":"st-lamp" ,
					"eval": "switch=true"
				}
			]
		}
	] 
}
```
### Cloud examples

The cloud credentials need to be configured in the file ./config/cloud.json

Example smartthings cloud configuration:
```
"some-config-label":
{
	"authToken" : "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" ,
	"server": "https://api.smartthings.com/v1/" ,
	"type": "smartthings"
}
```
Example tuya cloud configuration:
```
"some-config-label":
{
	"secretKey" : "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" ,
	"accessKey" : "xxxxxxxxxxxxxxxxx" ,
	"appKey": "xxxxxxxxxxxxxxxx" ,
	"homeID": "xxxxxxxxxxxxxx" ,
	"uid": "xxxxxxxxxxxxxxxxxxxxxx" ,
	"server": "https://openapi.tuyaus.com" ,
	"type": "tuya" ,
	"user_id": "xxxxxxxxxxxxxxxxxxxxx"
}
```
Devices can be used as cloud devices for scenes,queries and conditions, with a few added properties.

- type (cloud)
- config (the config label from the cloud.json file)
- component (the component name, only for smartthings)

Example scene with cloud device:
```
"bhr-fan-start-countdown":
{
	"bhr-fan": { "type":"cloud" , "config": "rawai" , "actions": "countdown_1" , "values": "120" }
}
Example condition with cloud device:
```
"turn-off-tv-if-on":
{
	"conditions":
	[
		{
			"label":"lr-tv" ,
			"type":"cloud" , 
			"component": "main" ,
			"eval": "switch=on" ,
			"config": "some-cloud-config-label"
		}
	] ,
	"then":
	{
		"run": "toggle-tv-power"
	}
}
```

### Direct cloud requests

It's possible to make direct cloud requests to the supported cloud api's if one wishes to. This feauture is useful to retrieve info about the devices, as well as triggering actions that are not supported locally.

Direct tuya cloud requests\
http://address:port/cloud/tuya/{type}/{configLabel}/{deviceID|label}/{method}/

Direct smartthings cloud requests\
http://address:port/cloud/smartthings/{type}/{configLabel}/{deviceID|label}/{method}/{component?}/{capability?}/

** Cloud types are "scenes|devices|home|token" for tuya and "devices|apps|subscriptions" for SmartThings\

## Main endpoints list

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



*** Cloud support is not available for Xiaomi devices at the moment.
