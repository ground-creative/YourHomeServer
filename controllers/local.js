module.exports = function ( req , res , devices )
{
	let module = { };
	
	module.run = function( label , schema , actions , values )
	{
		if ( !schema )
		{
			return false;
		}
		if ( devices[ label ].type == 'tuya' )
		{
			const engine = require( '../models/tuya' )( label , schema , req );
			engine.run( res , devices[ label ] , actions , values );
		}
		else if ( devices[ label ].type == 'miio' )
		{
			const engine = require( '../models/miio' )( label , schema , req );
			engine.run( res , devices[ label ] , actions , values );
		}
		else
		{
			let msg = 'Config error: unsupported device for label ' + label;
			req.logger.error( msg );
			var result = req.resHandler.payload( false , -5 , msg , {} );
			req.response.output( result );
		}
	};
	
	module.request = function( url )
	{
		return new Promise( function( resolve , reject ) 
		{
			req.reqHandler( { "uri": url , "method": "GET" } , function ( error , res , body ) 
			{
				if ( !error ) 
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
	
	return module;
};