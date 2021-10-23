const TuyaCloud = require( 'tuyacloudnodejs' );

module.exports = function ( req , res , devices )
{
	let module = { };
	
	module.tuya = async function( token , label , actions , values , config )
	{
		let Tuya = new TuyaCloud( config );
		if ( devices[ label ].category == 'scene' )
		{
			req.logger.cloud( "Triggering tuya cloud scene '" + label + "'" );
			data = await Tuya.scenes( token ).post_trigger( config.homeID , devices[ label ].id );
			req.logger.cloud( "Sent tuya cloud trigger for scene '" + label + "'" , data );
		}
		else
		{
			let commands = [ ];
			for ( var i = 0; i < actions.length; i++ ) 
			{
				if ( values[ i ] === 'false' ) 
				{
					values[ i ] = false;
				}
				else if ( values[ i ] === 'true' )
				{
					values[ i ] = true;
				}
				else if ( !isNaN( values[ i ] ) )
				{
					values[ i ] = parseInt( values[ i ] );
				}
				commands.push( { "code": actions[ i ] , "value": values[ i ] } );
			}
			let payload = { "commands": commands };
			req.logger.cloud( "Posting tuya cloud commands for device '" + label + "'" , payload );
			data = await Tuya.devices( token ).post_commands( devices[ label ].id , payload );
			req.logger.cloud( "Post tuya cloud commands result for device '" + label + "'" , data );
		}
		return data;
	};
	
	module.smartthings= async function( label , actions , values , config , schema , component )
	{
		let SmartThings = require( 'smartthingsnodejs' );
		let engine = new SmartThings( config );
		let commands = [ ];
		if ( devices[ label ].category == 'scene' )
		{
			commands.push
			( { 	
				"command"	: "on" , 
				"capability"	: "switch" , 
				"component"	: component , 
				"arguments"	: [ ]
			} );	
		}
		else
		{
			for ( var i = 0; i < actions.length; i++ ) 
			{
				if ( values[ i ] === 'false' ) 
				{
					values[ i ] = false;
				}
				else if ( values[ i ] === 'true' )
				{
					values[ i ] = true;
				}
				else if ( !isNaN( values[ i ] ) )
				{
					values[ i ] = parseInt( values[ i ] );
				}
				commands.push
				( { 	
					"command"	: schema[ actions[ i ] ].command , 
					"capability"	: schema[ actions[ i ] ].capability , 
					"component"	: component , 
					"arguments"	: ( ( values[ i ] ) ? [ values[ i ] ] : [ ] )
				} );	
			}
		}
		let payload = commands;
		req.logger.cloud( "Posting SmartThings cloud commands for device '" + label + "'" , payload );
		data = await engine.devices( ).post_commands( devices[ label ].id , payload );
		req.logger.cloud( "Post SmartThings cloud commands result for device '" + label + "'" , data );
		return data;
	};
	
	module.deviceData = async function( token , label , actions , values , config )
	{
		if ( devices[ label ].type == 'tuya' )
		{
			let Tuya = new TuyaCloud( config );
			req.logger.cloud( "Getting tuya cloud details for device '" + label + "'" );
			data = await Tuya.devices( token ).get_status( devices[ label ].id );
			req.logger.cloud( "Tuya cloud details for device '" + label + "'" , data );
			return data;
		}
		return false;
	};
	
	module.getToken = async function( type , config )
	{
		if ( type == 'tuya' )
		{
			let Tuya = new TuyaCloud( config );
			// get a new token
			req.logger.cloud( "Starting tuya cloud token call" );
			let data = await Tuya.token( ).get_new( );
			let d = data;//JSON.parse( data );
			req.logger.cloud( 'Tuya cloud token call result: ' , data )
			//return ( ) ? d.result.access_token : false;
			return d.result.access_token;
		}
		return false;
	};
	
	return module;
};