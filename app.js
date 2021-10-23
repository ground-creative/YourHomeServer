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
	if ( !scenes[ name ] )
	{
		let msg = "Abort: '" + name + "' scene does not exist";
		req.logger.error( msg );
		result = req.resHandler.payload( false , -10 , msg , {} );
		res.end( result );
		return false;
	}
	let devs = fs.readFileSync( './config/local/devices.json' );
	let devices = JSON.parse( devs );
	let raw = fs.readFileSync( './config/local/schemas.json' );
	let schemas = JSON.parse( raw );
	let params = require( './helpers/params-handler' )( req , res );
	let localController = require( './controllers/local' )( req , res , devices );
	let cloudController = require( './controllers/cloud' )( req , res , devices );
	let cloudConfig = JSON.parse( fs.readFileSync( './config/cloud.json' ) );
	req.resHandler.type = 'scene';
	let token = '';
	( async function( )
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
			let schema = params.schema( label , schemas , devices );
			if ( !schema )
			{
				return false;
			}
			let actions = scenes[ name ][ key ].actions.split( '^' );
			let vals = scenes[ name ][ key ].values;
			let values = ( vals ) ? vals.split( '^' ) : '';
			if ( scenes[ name ][ key ].hasOwnProperty( 'type' ) && scenes[ name ][ key ].type == 'cloud' )
			{
				
				if ( devices[ label ].type == 'tuya' )
				{
					if ( !token )
					{
						token = await cloudController.getToken( devices[ label ].type , cloudConfig[ scenes[ name ][ key ].config ] );
					}
					cloudController.tuya( token , label , actions , values , cloudConfig[ scenes[ name ][ key ].config ] );
				}
				else if ( devices[ label ].type == 'smartthings' )
				{
					cloudController.smartthings( label , actions , values , 
						cloudConfig[ scenes[ name ][ key ].config ] , schema , scenes[ name ][ key ].component );
				}
			}
			else
			{
				localController.run( label , schema , actions , values );
			}
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
	let raw = fs.readFileSync( './config/local/schemas.json' );
	let schemas = JSON.parse( raw );
	if ( !scenes[ name ] )
	{
		let msg = "Abort: '" + name + "' scene does not exist";
		req.logger.error( msg );
		result = req.resHandler.payload( false , -10 , msg , {} );
		res.end( result );
		return false;
	}
	let request = require( 'request' );
	let getData = function( key )
	{
		let obj = 
		{
			uri: 'http://127.0.0.1:' + config.port + '/local/device/' + key + '/?action=info' ,
			method: 'GET'
		};
			
		return new Promise( function( resolve , reject ) 
		{
			request( obj , function ( error , res , body ) 
			{
				if ( !error && res.statusCode == 200 ) 
				{
					resolve( body );
				} 
				else 
				{
					resolve( error );
					//reject( error );
				}
			} );
		} );
	};
	let devs = fs.readFileSync( './config/local/devices.json' );
	let devices = JSON.parse( devs );
	let cloudConfig = JSON.parse( fs.readFileSync( './config/cloud.json' ) );
	let cloudController = require( './controllers/cloud' )( req , res , devices );
	let token = '';
	( async function( )
	{
		let body = { };
		try
		{
			for ( const key in scenes[ name ] )
			{
				let actions = scenes[ name ][ key ].actions;	
				let data = '';
				if ( scenes[ name ][ key ].type == 'cloud' )
				{
					if ( !token )
					{
						token = await cloudController.getToken( devices[ key ].type , cloudConfig[ scenes[ name ][ key ].config ] );
					}
					actions = actions.split( '^' );
					let query = await cloudController.deviceData( token , key , actions , '' , cloudConfig[ scenes[ name ][ key ].config ] );
					if ( actions == "info" )
					{
						data = Object.assign( { } , query.result );
						for ( const k in data )
						{
							data[ data[ k ].code ] = data[ k ].value;
						}
					}
					else
					{
						data = { };
						for ( const k in actions )
						{
							for ( const key of query.result  )
							{
								if ( key.code == actions[ k ] )
								{
									data[ actions[ k ] ] = key.value;
								}
								
							}
						}
					}
				}
				else
				{
					let query = await getData( key );
					if ( actions == "info" )
					{
						data =  JSON.parse( query ).result.data;
					}
					else
					{
						data = {};
						actions = actions.split( '^' );
						let values = JSON.parse( query );
						for ( const k in actions )
						{
							val = ( actions[ k ] == 'off' || actions[ k ] == 'on' ) ? 'switch' : actions[ k ];
							if ( values.result.data.hasOwnProperty( actions[ k ] ) )
							{
								data[ val ] = values.result.data[ val ];
							}
						}
					}
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
	let params = require( './helpers/params-handler' )( req , res );
	let actions = params.actions( );
	if ( !params.actions( ) )
	{
		return false;
	}
	let devs = fs.readFileSync( './config/local/devices.json' );
	let devices = JSON.parse( devs );
	let raw = fs.readFileSync( './config/local/schemas.json' );
	let schemas = JSON.parse( raw );
	let schema = params.schema( label , schemas , devices );
	if ( !schema )
	{
		return false;
	}
	let values = params.values( );
	let localController = require( './controllers/local' )( req , res , devices );
	localController.run( label , schema , actions , values );
} );

app.get( '/local/eval/:name' , ( req , res ) => 
{
	let name = req.params.name;
	let conds = fs.readFileSync( './config/conditions.json' );
	let conditions = JSON.parse( conds );
	if ( !conditions[ name ] )
	{
		let msg = "Abort: '" + name + "' condition does not exist";
		req.logger.error( msg );
		result = req.resHandler.payload( false , -10 , msg , {} );
		res.end( result );
		return false;
	}
	let request = require( 'request' );
	let params = require( './helpers/params-handler' )( req , res );
	
	//let conditionsController = require( 'conditions' );

	let runScene = function( name )
	{
		let obj = 
		{
			uri: 'http://127.0.0.1:' + config.port + '/local/scene/' + name + '/' ,
			method: 'GET'
		};
			
		return new Promise( function( resolve , reject ) 
		{
			request( obj , function ( error , res , body ) 
			{
				if ( !error && res.statusCode == 200 ) 
				{
					resolve( body );
				} 
				else 
				{
					resolve( error );
					//reject( error );
				}
			} );
		} );
	};
	
	let getData = function( key )
	{
		let obj = 
		{
			uri: 'http://127.0.0.1:' + config.port + '/local/device/' + key + '/?action=info' ,
			method: 'GET'
		};
			
		return new Promise( function( resolve , reject ) 
		{
			request( obj , function ( error , res , body ) 
			{
				if ( !error && res.statusCode == 200 ) 
				{
					resolve( body );
				} 
				else 
				{
					resolve( error );
					//reject( error );
				}
			} );
		} );
	};
	
	let testCond = ( async function( )
	{
		let testCondition = false;
		for ( const key in conditions[ name ].conditions )
		{
			let label = conditions[ name ].conditions[ key ].label;
			let query = await getData( label );
			let data = JSON.parse( query ).result.data;
			let eval = conditions[ name ].conditions[ key ].eval.split( '^' );
			for ( const k in eval )
			{
				req.logger.msg( "Starting to check condition " + label + ' => ' , eval );
				testCondition = params.testConditions( eval[ k ] , data , label );
				if ( testCondition )
				{
					testCondition = true;
				}
				else
				{
					if ( conditions[ name ].conditions[ k ].hasOwnProperty( 'or' ) )
					{
						let testOr = false;
						let or = conditions[ name ].conditions[ k ].or;
						for ( const key in or )
						{
							req.logger.msg( "Starting to check subcondition " + or[ key ].label + ' => ' , or[ key ].eval );
							let testOrCond = await testCondTest( or[ key ] );
							if ( testOrCond )
							{
								testOr = true;
								testCondition = true;
								break;
							}
							else
							{
								testOr = false
								testCondition = false;
							}
							req.logger.msg( "Finished checking subcondition " + or[ key ].label + ' => ' , or[ key ].eval );
						}
						if ( !testOr )
						{
							testCondition = false;
							break;
						}
					}
					else
					{
						testCondition = false;
						break;
					}
				
				}
				req.logger.msg( "Finished checking condition " + label + ' => ' , eval );
			}
		}
		return testCondition;
	} );
	
	let testCondTest = ( async function( condition )
	{
		let testCondition = false;
		let query = await getData( condition.label );
		let data = JSON.parse( query ).result.data;
		let eval = condition.eval.split( '^' );
		for ( const k in eval )
		{
			testCondition = params.testConditions( eval[ k ] , data , condition.label );
			if ( testCondition )
			{
				testCondition = true;
			}
			else
			{
				testCondition = false;
				break;
			}
		}
		return testCondition;
	} );
	
	( async function( )
	{
		let condStatus = await testCond( );
		if ( condStatus === true && conditions[ name ].hasOwnProperty( 'then' ) )
		{
			req.logger.msg( 'The conditions result is true, running then opertator' , conditions[ name ].then );
			runScene( conditions[ name ].then.run );
		}
		else if ( conditions[ name ].hasOwnProperty( 'else' ) )
		{
			req.logger.msg( 'The condition result is false, running else operator' , conditions[ name ][ 'else' ] );
			runScene( conditions[ name ][ 'else' ].run );
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

app.all( [ '/cloud/:engine/:type/:label/:request/:thingID?' ,  
		'/cloud/:engine/:type/:label/:request/:thingID/:componentID?' , 
		'/cloud/:engine/:type/:label/:request/:thingID/:componentID/:capabilityID?' ] , ( req , res ) => 
{
	let request = req.params.request;
	let type = req.params.type;
	let label = req.params.label;
	let engine = req.params.engine;
	let thing_id = req.params.thingID;
	let component_id = req.params.componentID;
	let capability_id = req.params.capabilityID;
	let types = [ 'home' , 'scenes' , 'token' , 'devices' ];
	if ( !types.includes( type ))
	{
		let msg = "Error: type '" + type + "' is not supported";
		req.logger.error( msg );
		result = req.resHandler.payload( false , -13 , msg , { } );
		res.header( 'Content-Type' , 'application/json' );
		res.status( 500 ).send( result );
		return false;
	}
	let config = JSON.parse( fs.readFileSync( './config/cloud.json' ) );
	if ( !config.hasOwnProperty( label ) )
	{
		let msg = "Error: Coudn't find config with name '" + request + "'"
		req.logger.error( msg );
		result = req.resHandler.payload( false , -12 , msg , { } );
		res.header( 'Content-Type' , 'application/json' );
		res.status( 500 ).send( result );
		return false;
	}
	if ( engine == 'tuya' )
	{
		let app_key = config[ label ].appKey;
		let home_id = config[ label ].homeID;
		let TuyaCloud = require( 'tuyacloudnodejs' );
		let Tuya = new TuyaCloud( config[ label ] );
		let endpoints = Tuya[ type ]( )._endpoints;
		request = request.replace( new RegExp(/-/, 'g') , '_' );
		if ( !endpoints.hasOwnProperty( request ) )
		{
			let msg = "Invalid endpoint '" + request + "'";
			req.logger.error( msg );
			result = req.resHandler.payload( false , -12 , msg , { "endpoints list": endpoints } );
			res.header( 'Content-Type' , 'application/json' );
			res.status( 500 ).send( result );
			return false;
		}
		let uri = endpoints[ request ];
		if ( thing_id )
		{
			let devs = fs.readFileSync( './config/local/devices.json' );
			let devices = JSON.parse( devs );
			if ( devices.hasOwnProperty( thing_id ) )
			{
				thing_id = devices[ thing_id ].id;
			}
		}
		uri = uri.replace( '{home_id}' , config[ label ].homeID );
		uri = uri.replace( '{uid}' , config[ label ].uid );
		uri = uri.replace( '{appId}' , config[ label ].appKey );
		uri = uri.replace( '{user_id}' , config[ label ].user_id );
		uri = uri.replace( '{room_id}' , thing_id );
		uri = uri.replace( '{function_code}' , thing_id );
		uri = uri.replace( '{device_group_id}' , thing_id );
		uri = uri.replace( '{group_id}' , thing_id );
		uri = uri.replace( '{device_id}' , thing_id );
		uri = uri.replace( '{scene_id}' , thing_id );
		( async function( ) 
		{
			// get a new token
			req.logger.cloud( "Starting tuya cloud token call" );
			let data = await Tuya.token( ).get_new( );
			let d = data;//JSON.parse( data );
			req.logger.cloud( 'Tuya cloud token call result: ' , data )
			let requestHandler = Tuya._dependencies.Request( config[ label ] , Tuya._dependencies );
			let payload = ( Object.keys( req.body ).length !== 0 ) ? req.body : '';
			req.logger.cloud( "Starting tuya cloud request " + request + ' ' + req.method + ' => ' + uri , payload );
			data = await requestHandler.call( uri , req.method , d.result.access_token , payload , '' );
			req.logger.cloud( "Finished tuya cloud request " + req.method + ' => ' + uri  , data );
			res.header( 'Content-Type' , 'application/json' );
			//res.status( 200 ).send( data );
			data = JSON.stringify( data );
			res.status( 200 ).end( data );
			//res.end( data );
		} )( );
	}
	else if ( engine == 'smartthings' )
	{
		let SmartThings = require( './smartthings/SmartThings' );
		let engine = new SmartThings( config[ label ] );
		let endpoints = engine[ type ]( )._endpoints;
		request = request.replace( new RegExp(/-/, 'g' ) , '_' );
		if ( !endpoints.hasOwnProperty( request ) )
		{
			let msg = "Invalid endpoint '" + request + "'";
			req.logger.error( msg );
			result = req.resHandler.payload( false , -12 , msg , { "endpoints list": endpoints } );
			res.header( 'Content-Type' , 'application/json' );
			res.status( 500 ).send( result );
			return false;
		}
		let uri = endpoints[ request ];
		if ( thing_id )
		{
			let devs = fs.readFileSync( './config/local/devices.json' );
			let devices = JSON.parse( devs );
			if ( devices.hasOwnProperty( thing_id ) )
			{
				thing_id = devices[ thing_id ].id;
			}
		}
		uri = uri.replace( '{device_id}' , thing_id );
		uri = uri.replace( '{component_id}' , component_id );
		uri = uri.replace( '{capability_id}' , capability_id );
		( async function( ) 
		{
			let requestHandler = engine._dependencies.Request( config[ label ] , engine._dependencies );
			let payload = ( Object.keys( req.body ).length !== 0 ) ? req.body : '';
			req.logger.cloud( "Starting smartthings cloud request " + request + ' ' + req.method + ' => ' + uri , payload );
			data = await requestHandler.call( uri , req.method , payload );
			req.logger.cloud( "Finished smartthings cloud request " + req.method + ' => ' + uri  , data );
			res.header( 'Content-Type' , 'application/json' );
			data = JSON.stringify( data );
			res.status( 200 ).end( data );
		} )( );
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
	let error = err.stack.split ( "\n" , 1 ).join( "" );
	req.logger.error( err.stack );
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