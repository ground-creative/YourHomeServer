const TuyAPI = require( 'tuyapi' );

module.exports = function ( label , schema , req )
{
	let module = { };
	
	module.info = function( device , data , value )
	{
		if ( value && !data.dps.hasOwnProperty( schema[ value ] ) )
		{
			req.logger.error( "Unsupported value '" + value + "' for device "  + label );
			return req.resHandler.payload( false , -3 , 
						"Unsupported value '" + "'" + value + "'" , {} );
		}
		var d = ( ( value ) ? data.dps[ schema[ value ] ] : data );
		req.logger.msg( 'Data from device '  + label + ':' , d );
		return req.resHandler.payload( true , 200 , 'Device data' , d );
	};
	
	module.on = function( device )
	{
		req.logger.msg( 'Turning on device ' + label );
		device.set( { dps: schema[ 'switch' ]  , set: true } );
		return req.resHandler.payload( true , 200 , 'Set switch value on.' , {} );
	};
	
	module.off = function( device )
	{
		req.logger.msg( 'Turning off device '  + label );
		device.set( { dps: schema[ 'switch' ] , set: false } );
		return req.resHandler.payload( true , 200 , 'Set switch value off.' , {} );
	};
	
	module.toggle = function( device , data )
	{
		req.logger.msg( 'Toggle switch from device '  + label );
		device.set( { dps: schema[ 'switch' ] , set: !( data.dps[ schema[ 'switch' ] ] ) } );
		return req.resHandler.payload( true , 200 , 'Toggle switch value' , {} );
	};
	
	module.brightness = function( device , value )
	{
		req.logger.msg( 'Setting brightness for device '  + label );
		device.set( { dps: schema[ 'brightness' ] , set: parseInt( value + '0' ) } );
		return req.resHandler.payload( true , 200 , 'Set brightness to value ' + value , {} );
	};
	
	module.temperature = function( device , value )
	{
		req.logger.msg( 'Setting temperature for device ' + label );
		device.set( { dps: schema[ 'temperature' ] , set: parseInt( value + '0' ) } );
		return req.resHandler.payload( true , 200 , 'Set temperature to value ' + value , {} );
	};
	
	module.work_mode = function( device , value )
	{
		req.logger.msg( 'Setting work mode for device ' + label );
		device.set( { dps: schema[ 'work_mode' ] , set: value } );
		return req.resHandler.payload( true , 200 , 'Set work mode to value ' + value , {} );
	};
	
	module.run = function( res , config , actions , values )
	{
		let stateHasChanged = false;
		let obj = { "id": config.id , "key": config.key };
		if ( config.ip )
		{
			obj.ip = config.ip;
			obj.version = '3.3';
			module._timeout = 10000;
		}
		
		const device = new TuyAPI( obj );
		
		device.find( ).then( ( ) => 
		{ 
			device.connect( ).catch( function( err ) 
			{
				let error = err.stack.split ( "\n" , 1 ).join( "" );
				req.logger.error( label + ' ' + err.stack );
				result = req.resHandler.payload( false , -11 , label + ' fatal error: ' + error , {} );
				req.resHandler.output( result , 500 , 'application/json' );
			} )
			
		} ).catch( function( err ) 
		{
			let error = err.stack.split ( "\n" , 1 ).join( "" );
			req.logger.error( label + ' ' + err.stack );
			result = req.resHandler.payload( false , -8 , label + ' fatal error: ' + error , {} );
			req.resHandler.output( result , 500 , 'application/json' );
		} );
		
		device.on( 'connected' , ( ) => 
		{ 
			req.logger.connected( 'Connected to device ' + label );	
		} );
		
		device.on( 'error' , ( error ) => 
		{ 
			req.logger.error( error );
		} );
		
		device.on( 'disconnected', ( ) => 
		{ 
			req.logger.disconnected( 'Disconnected from device '  + label );
		} );
		
		device.on( 'data' , data => 
		{
			if ( data.dps && !stateHasChanged )
			{
				var a = 0;
				var result = '';
				actions.forEach( async function( action ) 
				{
					if ( action == 'on' || ( action == 'switch' && values[ a ]  == 'on' ) )
					{
						result = module.on( device , data );
					}
					else if ( action == 'off' || ( action == 'switch' && values[ a ]  == 'off' ) )
					{
						result = module.off( device , data );
					}
					else if ( action == 'toggle' )
					{
						result = module.toggle( device , data );
					}
					else if ( action == 'info' )
					{
						result = module.info( device , data , values[ a ] );
					}
					else if ( action == 'brightness' )
					{
						result = module.brightness( device , values[ a ] );
					}
					else if ( action == 'work_mode' )
					{
						result = module.work_mode( device , values[ a ] );
					}
					else if ( action == 'temperature' )
					{
						result = module.temperature( device , values[ a ] );
					}
					else
					{
						req.logger.error( 'Unsupported action "' + action + '" for device '  + config.id );
						result = req.resHandler.payload( false , -4 , 'Unsupported action!' , {} );
					}
					a++;
				} );
				stateHasChanged = true;
				result = req.resHandler.format( 'tuya' , result , schema );
				req.resHandler.output( result , 200 );
			}
		} );

		setTimeout( function( )
		{ 
			device.disconnect( ); 
			
		} , module._timeout );
	};
	
	module._timeout = 20000;
	
	return module;
};