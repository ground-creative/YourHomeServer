# YourHomeServer

nodejs server based on express module to control tuya and miio devices locally or over the cloud (tuya cloud support only for now)

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

```
npm install codetheweb/tuyapi
```

## Miio local module

```
npm install miio-api
```

## Tuya cloud module

```
npm install tuyacloudnodejs
```

## Main endpoints

Actions are found in the schema file.\
Cloud types are "scenes|devices|home|token"\
Use get-methods as a method to see all the cloud types methods available

Run an action on a device\
http:serveraddress:port/local/device/{label}/?actions={actions}&values={values}

Run a scene\
http:serveraddress:port/local/scene/{name}/

Query a scene\
http:serveraddress:port/local/query/{name}/

Evaluate a condition\
http:serveraddress:port/local/eval/{name}/

Direct cloud requests\
http:serveraddress:port/cloud/tuya/{type}/{configLabel}/{deviceID|label}/{method}/



*** Cloud support is only for tuya devices at the moment.
