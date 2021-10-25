const express = require( 'express' );
const app = express( );
const bodyParser = require('body-parser');
const fs = require( 'fs' );
const config = JSON.parse( fs.readFileSync( './config/config.json' ) );

// parse application/x-www-form-urlencoded
app.use( bodyParser.urlencoded( { extended: false } ) )

// parse application/json
app.use( bodyParser.json( ) );

// Redirect if no trailing slash
app.use( ( req, res, next ) => 
{
	if ( req.path.substr( -1 ) != '/' && req.path.length > 1 ) 
	{
		const query = req.url.slice( req.path.length );
		res.redirect( 307 , req.path + '/' + query );
	} 
	else 
	{
		next( );
	}
} );

// various listeners
app.use( ( req , res , next ) => 
{
	res.header( "Access-Control-Allow-Origin" , "*" );
	res.header( "Access-Control-Allow-Headers" , "Origin, X-Requested-With,Content-Type, Accept" );
	res.header( 'Access-Control-Allow-Methods' , 'GET,PUT,POST,DELETE' );
	req.session = Math.random( ).toString( 36 ).substring( 2 , 12 );
	req.logger = require( './helpers/logger' )( req.session );
	req.resHandler = require( './helpers/response' )( res );
	req.reqHandler = require( 'request' );
	req.paramsHandler = require( './helpers/params-handler' )( req , res );
	req.logger.request( 'Started processing request from ' + 
				req.socket.remoteAddress + ' => ' + req.url );
	res.on( 'finish' , function( ) 
	{
		req.logger.request( 'Finished processing request from ' + 
					req.socket.remoteAddress + ' => ' + req.url );
	} );
	res.on( 'timeout' , function( ) 
	{
		req.logger.error( 'Request timeout ' + 
			req.socket.remoteAddress + ' => ' + req.url );
		let result = req.resHandler.timeout( -6 , 'Request timeout!' , { } );
		res.header( 'Content-Type' , 'application/json' );
		res.status( 408 ).send( result );
	} );
	res.on( 'close' , function( ) 
	{
		req.logger.simple( 'Closed connection' );
	} );
	next( );
} );

app.get( '/local' , ( req , res ) => 
{
	req.logger.error( 'Error: No scene name or device label specified ' + 
							req.socket.remoteAddress + ' => ' + req.url );
	result = req.resHandler.payload( false , -9 , 'No scene or device specified' , { } );
	res.header( 'Content-Type' , 'application/json' );
	res.status( 500 ).send( result );
	return false;
} );

app.get( '/local/device' , ( req , res ) => 
{
	req.logger.error( 'Error: No device label specified ' + 
				req.socket.remoteAddress + ' => ' + req.url );
	result = req.resHandler.payload( false , -9 , 'No device label specified' , { } );
	res.header( 'Content-Type' , 'application/json' );
	res.status( 500 ).send( result );
	return false;
} );

app.get( '/local/scene' , ( req , res ) => 
{
	req.logger.error( 'Error: No scene specified ' + 
				req.socket.remoteAddress + ' => ' + req.url );
	result = req.resHandler.payload( false , -9 , 'No scene specified' , { } );
	res.header( 'Content-Type' , 'application/json' );
	res.status( 500 ).send( result );
	return false;
} );


app.get( '/local/query' , ( req , res ) => 
{
	req.logger.error( 'Error: No scene specified ' + 
				req.socket.remoteAddress + ' => ' + req.url );
	result = req.resHandler.payload( false , -13 , 'No scene specified' , { } );
	res.header( 'Content-Type' , 'application/json' );
	res.status( 500 ).send( result );
	return false;
} );

app.get( '/local/scene/:name' , ( req , res ) => 
{
	let result = '';
	let name = req.params.name;
	let rt = fs.readFileSync( './config/scenes.json' );
	let scenes = JSON.parse( rt );
	let params = require( './helpers/params-handler' )( req , res );
	if ( !req.paramsHandler.checkSceneName( name , scenes ) )
	{
		return false;
	}
	let devs = fs.readFileSync( './config/local/devices.json' );
	let devices = JSON.parse( devs );
	let raw = fs.readFileSync( './config/local/schemas.json' );
	let schemas = JSON.parse( raw );
	let localController = require( './controllers/local' )( req , res , devices );
	let cloudController = require( './controllers/cloud' )( req , res , devices );
	let cloudConfig = JSON.parse( fs.readFileSync( './config/cloud.json' ) );
	req.resHandler.type = 'scene';
	( async function( )
	{
		let token = '';
		try
		{
			for ( const key in scenes[ name ] )
			{
				if ( key == 'wait' )
				{
					req.logger.simple( 'Waiting ' + scenes[ name ][ key ] + ' milliseconds' );
					await new Promise( resolve => setTimeout ( resolve , scenes[ name ][ key ] ) );
					req.logger.simple( 'Finished waiting ' + scenes[ name ][ key ] + ' milliseconds' );
					continue;
				}
				let label = key;
				let schema = req.paramsHandler.schema( label , schemas , devices );
				if ( !schema )
				{
					return false;
				}
				let actions = scenes[ name ][ key ].actions.split( '^' );
				let vals = scenes[ name ][ key ].values;
				vals = req.paramsHandler.dynamicSceneValues( vals );
				let values = ( vals ) ? vals.split( '^' ) : '';
				if ( scenes[ name ][ key ].hasOwnProperty( 'type' ) && scenes[ name ][ key ].type == 'cloud' )
				{
					if ( devices[ label ].type == 'tuya' )
					{
						if ( !token )
						{
							token = await cloudController.getTuyaCloudToken( devices[ label ].type , cloudConfig[ scenes[ name ][ key ].config ] );
						}
						cloudController.executeTuyaCloudScene( token , label , actions , values , cloudConfig[ scenes[ name ][ key ].config ] );
					}
					else if ( devices[ label ].type == 'smartthings' )
					{
						cloudController.executeSmartThingsScene( label , actions , values , 
							cloudConfig[ scenes[ name ][ key ].config ] , schema , scenes[ name ][ key ].component );
					}
				}
				else
				{
					localController.run( label , schema , actions , values );
				}
			}
		}
		catch( error )
		{
			let msg = "Scene " + name + " " + error;
			req.logger.error( msg );
			result = req.resHandler.payload( true , -14 , msg , {} );
			return res.status( 500 ).end( result );
		}
	} )( );
	let msg = "Executing scene '" + name + "'";
	req.logger.scene( msg );
	result = req.resHandler.payload( true , 200 , msg , { } );
	res.header( 'Content-Type' , 'application/json' );
	res.status( 200 ).end( result );	
} );

app.get( '/local/query/:name' , ( req , res ) => 
{
	let name = req.params.name;
	let rt = fs.readFileSync( './config/scenes.json' );
	let scenes = JSON.parse( rt );
	if ( !req.paramsHandler.checkSceneName( name , scenes ) )
	{
		return false;
	}
	let raw = fs.readFileSync( './config/local/schemas.json' );
	let schemas = JSON.parse( raw );
	let devs = fs.readFileSync( './config/local/devices.json' );
	let devices = JSON.parse( devs );
	let localController = require( './controllers/local' )( req , res , devices );
	let cloudConfig = JSON.parse( fs.readFileSync( './config/cloud.json' ) );
	let cloudController = require( './controllers/cloud' )( req , res , devices );
	( async function( )
	{
		let token = '';
		let body = { };
		try
		{
			for ( const key in scenes[ name ] )
			{
				let actions = scenes[ name ][ key ].actions;	
				let data = '';
				if ( scenes[ name ][ key ].type == 'cloud' )
				{
					actions = actions.split( '^' );
					let config = cloudConfig[ scenes[ name ][ key ].config ];
					if ( devices[ key ].type == 'tuya' )
					{
						if ( !token )
						{
							token = await cloudController.getTuyaCloudToken( config );
						}
						let query = await cloudController.getTuyaCloudDeviceData( token , key , config );
						data = req.paramsHandler.parseTuyaCloudQueryData( actions , query.result );
					}
					else if ( devices[ key ].type == 'smartthings' )
					{
						let query = await cloudController.getSmartThingsDeviceData( key , scenes[ name ][ key ].component , config );
						let schema = schemas[ devices[ key ].type ][ devices[ key ].category ];
						data = req.paramsHandler.parseSmartThingsCloudQueryData( actions , query.data , schema );
					}
					else
					{
						let msg = "Device cloud type " + name + ":" + devices[ key ].type + ' not supported';
						req.logger.error( msg );
						result = req.resHandler.payload( true , -15 , msg , {} );
						return res.status( 500 ).end( result );
					}
				}
				else
				{
					let url = 'http://127.0.0.1:' + config.port + '/local/device/' + key + '/?action=info';
					let query = await localController.request( url );
					data = req.paramsHandler.parseLocalQueryData( actions , query );
				}
				body[ key ]= data;		
			}
		}
		catch( error )
		{
			let msg = "Query scene " + name + " " + error;
			req.logger.error( msg );
			result = req.resHandler.payload( true , -14 , msg , {} );
			return res.status( 500 ).end( result );
		}
		req.logger.msg( "Scene '" + name + "' query result" , body );
		result = req.resHandler.payload( true , 200 , "Scene '" + name + "' query result" , body );
		res.end( result );
	} )( );
} );

app.get( '/local/device/:label' , ( req , res ) => 
{
	let label = req.params.label;
	let actions = req.paramsHandler.actions( );
	if ( !actions )
	{
		return false;
	}
	let devs = fs.readFileSync( './config/local/devices.json' );
	let devices = JSON.parse( devs );
	let raw = fs.readFileSync( './config/local/schemas.json' );
	let schemas = JSON.parse( raw );
	let schema = req.paramsHandler.schema( label , schemas , devices );
	if ( !schema )
	{
		return false;
	}
	let values = req.paramsHandler.values( );
	let localController = require( './controllers/local' )( req , res , devices );
	localController.run( label , schema , actions , values );
} );

app.get( '/local/eval/:name' , ( req , res ) => 
{
	let name = req.params.name;
	let conds = fs.readFileSync( './config/conditions.json' );
	let conditions = JSON.parse( conds );
	if ( !req.paramsHandler.checkConditionName( name, conditions ) )
	{
		return false;
	}
	let request = require( 'request' );
	let localController = require( './controllers/local' )( req , res , null );
	let conditionsModel = require( './models/conditions' )( req , res , localController , req.paramsHandler );
	( async function( )
	{
		let condStatus = await conditionsModel.eval( name , conditions , config );
		if ( condStatus === true && conditions[ name ].hasOwnProperty( 'then' ) )
		{
			req.logger.msg( 'The conditions result is true, running then opertator' , conditions[ name ].then );
			let url = 'http://127.0.0.1:' + config.port + '/local/scene/' + conditions[ name ].then.run + '/'
			localController.request( url );
		}
		else if ( conditions[ name ].hasOwnProperty( 'else' ) )
		{
			req.logger.msg( 'The condition result is false, running else operator' , conditions[ name ][ 'else' ] );
			let url = 'http://127.0.0.1:' + config.port + '/local/scene/' + conditions[ name ][ 'else' ].run + '/'
			localController.request( url );
		}
		else
		{
			req.logger.msg( 'The condition result is ' + condStatus + ', nothing to run has been defined' );
		}
		result = req.resHandler.payload( true , 200 , 'Conditions result' , { "result": condStatus } );
		res.header( 'Content-Type' , 'application/json' );
		res.status( 200 ).send( result );
		return false;
	} )( );
} );

app.get( '/cloud/' , ( req , res ) => 
{
	req.logger.error( 'Error: No api engine specified ' + 
				req.socket.remoteAddress + ' => ' + req.url );
	result = req.resHandler.payload( false , -11 , 'No api engine specified.' , { } );
	res.header( 'Content-Type' , 'application/json' );
	res.status( 500 ).send( result );
	return false;
} );

app.get( '/cloud/:engine' , ( req , res ) => 
{
	req.logger.error( 'Error: No engine type specified ' + 
				req.socket.remoteAddress + ' => ' + req.url );
	result = req.resHandler.payload( false , -12 , 'No engine type specified' , { } );
	res.header( 'Content-Type' , 'application/json' );
	res.status( 500 ).send( result );
	return false;
} );

app.get( '/cloud/:engine/:type' , ( req , res ) => 
{
	req.logger.error( 'Error: No label specified ' + 
				req.socket.remoteAddress + ' => ' + req.url );
	result = req.resHandler.payload( false , -12 , 'No label specified' , { } );
	res.header( 'Content-Type' , 'application/json' );
	res.status( 500 ).send( result );
	return false;
} );

app.get( '/cloud/:engine/:type/:label' , ( req , res ) => 
{
	req.logger.error( 'Error: No request method specified ' + 
				req.socket.remoteAddress + ' => ' + req.url );
	result = req.resHandler.payload( false , -12 , 'No request method specified' , { } );
	res.header( 'Content-Type' , 'application/json' );
	res.status( 500 ).send( result );
	return false;
} );

app.all( [ '/cloud/:engine/:type/:label/:request/:param1?' ,  
		'/cloud/:engine/:type/:label/:request/:param1/:param2?' , 
		'/cloud/:engine/:type/:label/:request/:param1/:param2/:param3?' ] , ( req , res ) => 
{
	let request = req.params.request;
	let type = req.params.type;
	let label = req.params.label;
	let engine = req.params.engine;
	let params = [ req.params.param1 , req.params.param2 , req.params.param3 ];
	let config = JSON.parse( fs.readFileSync( './config/cloud.json' ) );
	if ( !req.paramsHandler.checkCloudConfig( label , config ) )
	{
		return false;
	}
	request = request.replace( new RegExp(/-/, 'g' ) , '_' );
	if ( engine == 'tuya' )
	{
		let TuyaCloud = require( 'tuyacloudnodejs' );
		var Caller = new TuyaCloud( config[ label ] );
		  
	}
	else if ( engine == 'smartthings' )
	{
		let SmartThings = require( 'smartthingsnodejs' );
		var Caller = new SmartThings( config[ label ] );
	}
	else
	{
		let msg = "Error: Engine '" + engine + "' is not supported"
		req.logger.error( msg );
		result = req.resHandler.payload( false , -12 , msg , { } );
		res.header( 'Content-Type' , 'application/json' );
		res.status( 500 ).send( result );
		return false;
	}
	if ( !req.paramsHandler.checkCloudTypes( type , engine ) )
	{
		return false;
	}
	let endpoints = Caller[ type ]( )._endpoints;
	if ( !req.paramsHandler.checkEndpoint( endpoints , request ) )
	{
		return false;
	}
	let uri = endpoints[ request ];
	if ( params[ 0 ] )
	{
		let devs = fs.readFileSync( './config/local/devices.json' );
		let devices = JSON.parse( devs );
		if ( devices.hasOwnProperty( params[ 0 ] ) )
		{
			params[ 0 ] = devices[ params[ 0 ] ].id;
		}
	}
	if ( engine == 'tuya' )
	{
		let app_key = config[ label ].appKey;
		let home_id = config[ label ].homeID;
		uri = req.paramsHandler.formatTuyaCloudEndpoint( uri , params , config[ label ] );
		( async function( ) 
		{
			// get a new token
			req.logger.cloud( "Starting tuya cloud token call" );
			let data = await Caller.token( ).get_new( );
			let d = data;//JSON.parse( data );
			req.logger.cloud( 'Tuya cloud token call result: ' , data )
			let requestHandler = Caller._dependencies.Request( config[ label ] , Caller._dependencies );
			let payload = ( Object.keys( req.body ).length !== 0 ) ? req.body : '';
			req.logger.cloud( "Starting tuya cloud request " + request + ' ' + req.method + ' => ' + uri , payload );
			data = await requestHandler.call( uri , req.method , d.result.access_token , payload , '' );
			req.logger.cloud( "Finished tuya cloud request " + req.method + ' => ' + uri  , data );
			res.header( 'Content-Type' , 'application/json' );
			res.status( 200 ).end( JSON.stringify( data ) );
		} )( );
	}
	else if ( engine == 'smartthings' )
	{
		uri = req.paramsHandler.formatSmartThingsCloudEndpoint( uri , params );
		( async function( ) 
		{
			let requestHandler = Caller._dependencies.Request( config[ label ] , Caller._dependencies );
			let payload = ( Object.keys( req.body ).length !== 0 ) ? req.body : '';
			req.logger.cloud( "Starting SmartThings cloud request " + request + ' ' + req.method + ' => ' + uri , payload );
			data = await requestHandler.call( uri , req.method , payload );
			req.logger.cloud( "Finished SmartThings cloud request " + req.method + ' => ' + uri  , data );
			res.header( 'Content-Type' , 'application/json' );
			res.status( 200 ).end( JSON.stringify( data ) );
		} )( );
	}
} );

app.get( '/timeout' , ( req , res ) => 
{
	req.logger.msg( 'testing the timeout' );
} );

// *** The 404 Route, last route ***
app.get( '*' , ( req , res ) => 
{
	let msg = 'No service is associated with the url => ' + req.url;
	req.logger.error( msg );
	let result = req.resHandler.notFound( -6 , msg , { } );
	res.header( 'Content-Type' , 'application/json' );
	res.status( 404 ).send( result );	
} );

app.use( function( err , req , res , next ) 
{
	logger = require( './helpers/logger' )( req.session );
	let error = ( err.hasOwnProperty( 'stack' ) ) ? err.stack.split ( "\n" , 1 ).join( "" ) : err;
	logger.error( ( ( err.hasOwnProperty( 'stack' ) ) ? err.stack : err ) );
	result = req.resHandler.payload( false , 500 , 'Fatal error: ' + error , {} );
	res.header( 'Content-Type' , 'application/json' );
	res.status( 500 ).send( result );	
} );

app.listen( config.port , config.address , ( ) => 
{
	let start_time = new Date( );
	console.log( '\x1b[35m%s\x1b[0m' , '[' + start_time.toString( ) + 
		'] Node server running at ' + config.address + ' on port '  + config.port );
	
} ).setTimeout( config.timeout );