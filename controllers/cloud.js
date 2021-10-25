module.exports = function ( req , res , devices )
{
	let module = { };
	
	module._TuyaCLoud = null;
	
	module._SmartThings = null;
	
	module.getEngine = function( type )
	{
		if ( type == 'tuya' )
		{
			this._TuyaCLoud = ( this._TuyaCLoud ) ? this._TuyaCLoud  : require( 'tuyacloudnodejs' );
			return this._TuyaCLoud;
		}
		else if ( type == 'smartthings' )
		{
			this._SmartThings = ( this._SmartThings ) ? this._SmartThings : require( 'smartthingsnodejs' );
			return this._SmartThings;
		}
		else
		{
			req.logger.cloud( "Cloud engine '" + type + "' not supported!" );
			return false;
		}
	}
	
	module.executeTuyaCloudScene = async function( token , label , actions , values , config )
	{
		let TuyaCloud = this.getEngine( 'tuya' );
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
	
	module.executeSmartThingsScene = async function( label , actions , values , config , schema , component )
	{
		let Module = this.getEngine( 'smartthings' );
		let SmartThings = new Module( config );
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
		data = await SmartThings.devices( ).post_commands( devices[ label ].id , payload );
		req.logger.cloud( "Post SmartThings cloud commands result for device '" + label + "'" , data );
		return data;
	};
	
	module.getTuyaCloudDeviceData = async function( token , label , config )
	{
		let TuyaCloud = this.getEngine( 'tuya' );
		let Tuya = new TuyaCloud( config );
		req.logger.cloud( "Getting tuya cloud details for device '" + label + "'" );
		data = await Tuya.devices( token ).get_status( devices[ label ].id );
		req.logger.cloud( "Tuya cloud details for device '" + label + "'" , data );
		return data;
	};
		
	module.getTuyaCloudToken = async function( config )
	{		
		let TuyaCloud = this.getEngine( 'tuya' );
		let Tuya = new TuyaCloud( config );
		req.logger.cloud( "Starting tuya cloud token call" );
		let data = await Tuya.token( ).get_new( );
		req.logger.cloud( 'Tuya cloud token call result: ' , data )
		return ( data.success ) ? data.result.access_token : null;
	};
	
	module.getSmartThingsDeviceData = async function( label , component , config )
	{
		let Module = this.getEngine( 'smartthings' );
		let SmartThings = new Module( config );
		req.logger.cloud( "Getting SmartThings capabilities for device '" + label + "'" );
		data = await SmartThings.devices( ).get_component( devices[ label ].id , component );
		req.logger.cloud( "Tuya SmartThings capabilities for device '" + label + "'" , data );
		return data;
	};
	
	return module;
};