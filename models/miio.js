const miio = require('miio-api');

module.exports = function ( label , schema , req )
{
	let module = { };
	
	module.info = async function( device , value )
	{
		if ( value && !schema[ value ] )
		{
			req.req.logger.msg( "Unsupported value '" + value + "' for device " + label );
			return req.resHandler.payload( false , -3 , 'Unsupported value!' , { } );
		}
		else if ( value )
		{
			var payload = [ { 'siid': schema[ value ].siid , 'piid': schema[ value ].piid } ]
		}
		else
		{
			var payload = [ ];
			for ( const [ key , val ] of Object.entries( schema ) ) 
			{
				payload.push( { 'siid': val.siid , 'piid': val.piid } );
			}
		}
		var data = await device.call( "get_properties" , payload );
		var val = ( ( value ) ? data[ 0 ].value : data );
		req.logger.msg( 'Device data for ' + label , val );	
		return req.resHandler.payload( true , 200 , 'Device data' , val );
	};
	
	module.on = async function( device )
	{
		await device.call( "set_properties", 
		[
			{
				'siid': schema[ 'switch' ].siid , 
				'piid': schema[ 'switch' ].piid ,
				'value': true
			}
		] );
		req.logger.msg( 'Turned on device ' + label );	
		return req.resHandler.payload( true , 200 , 'Turned on device' , {} );	
	};
	
	module.off = async function( device )
	{
		await device.call( "set_properties", 
		[
			{
				'siid': schema[ 'switch' ].siid , 
				'piid': schema[ 'switch' ].piid ,
				'value': false
			}
		] );
		req.logger.msg( 'Turned off device ' + label );	
		return req.resHandler.payload( true , 200 , 'Turned off device' , {} );
	};
	
	module.toggle = async function( device , data )
	{
		let status = await device.call( "get_properties" , 
		[
			{
				'siid': schema[ 'switch' ].siid , 
				'piid': schema[ 'switch' ].piid
			} 
		] );
		await device.call("set_properties", 
		[
			{
				'siid': schema[ 'switch' ].siid , 
				'piid': schema[ 'switch' ].piid ,
				'value': !( status[ 0 ].value )
			}
		] );
		req.logger.msg( 'Toggled device ' + label );	
		return req.resHandler.payload( true , 200 , 'toggled device' , {} );
	};
	
	module.brightness = async function( device , value )
	{
		await device.call( "set_properties", 
		[
			{
				'siid': schema[ 'brightness' ].siid , 
				'piid': schema[ 'brightness' ].piid ,
				'value': parseInt( value )
			}
		] );
		req.logger.msg( 'Set brightness for device ' + label , value );		
		return req.resHandler.payload( true , 200 , 'Set device brightness ok.' , {} );
	};
	
	module.temperature = function( device , value ){ };
	
	module.work_mode = function( device , value ){ };
	
	module.run = function( res , config , actions , values )
	{
		( async function run( )
		{
			let device;
			let data;
			try 
			{
				device = await miio.device
				( {
					"address": config.ip ,
					"token": config.token
				} );
				req.logger.connected( 'Connected to device ' + label );
				var result = '';
				for ( var i = 0; i < actions.length; i++ ) 
				{
					var action = actions[ i ];
					if ( action == 'on' || ( action == 'switch' && values[ i ]  == 'on' ) )
					{
						result = await module.on( device );
					}
					else if ( action == 'off' || ( action == 'switch' && values[ i ]  == 'off' ) )
					{
						result = await module.off( device );
					}
					else if ( action == 'toggle' )
					{
						result = await module.toggle( device );
					}
					else if ( action == 'info' )
					{
						result = await module.info( device , values[ i ] );
					}
					else if ( action == 'brightness' )
					{
						result = await module.brightness( device , values[ i ] );
					}
					else
					{
						req.logger.msg( "Unsupported action '" + action + "' for device " + label );
						result = req.resHandler.payload( true , -4 , "Unsupported action '" + action + "'" , {} );
					}
				};
				result = req.resHandler.format( 'miio' , result , schema );
				req.resHandler.output( result );
			}
			catch( err ) 
			{
				req.logger.error( label + ' ' + err );
			} 
			finally 
			{
				if ( device ) 
				{
					req.logger.disconnected( 'Disconnected from device ' + label );
					device.destroy( );
				}
			}
		} )( );
	};
	
	return module;
};