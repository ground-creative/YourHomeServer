module.exports = function( config , dependencies )
{
	let module = { };
		
	module._crypto = function( )
	{ 
		return dependencies.crypto;
	}
	
	module._sign = function( signStr )
	{
		return this._crypto( ).createHmac( 'sha256' , config.secretKey ).
				update( signStr , 'utf8' ).digest( 'hex' ).toUpperCase( );
	};
	
	module.call = function( uri , method , token , payload , sigHeaders )
	{
		let request = require( 'request' );
		payload = ( payload ) ? JSON.stringify( payload ) : '';
		let timestamp = Date.now( ).toString( );
		let contentHash = this._crypto( ).createHash('sha256').update( payload ).digest('hex');
		let stringToSign = [ method , contentHash , '' , uri ].join( '\n' );
		let signStr = config.accessKey + token + timestamp + stringToSign;
		let sign = this._sign( signStr );
		var headers =
		{
			't': timestamp ,
			'sign_method': 'HMAC-SHA256' ,
			'Accept': 'Accept: application/json, text/plan' ,
			'client_id': config.accessKey ,
			'User-Agent': 'nodetuyapi' ,
			'sign': sign ,
		};
		let obj = 
		{
			headers: headers ,
			uri: config.server + uri ,
			method: method ,
			body: payload
		};
		if ( token )
		{
			headers.access_token = token;
		}
		if ( method == "PUT" || method == "POST" )
		{
			headers[ 'Content-Type' ] = 'application/json';
		}
		return new Promise( function( resolve , reject ) 
		{
			request( obj , function ( error , res , body ) 
			{
				if ( !error && res.statusCode == 200 ) 
				{
					// json: true seems to brake the request headers (for now)
					//body = body.replace( /\\/g , "" );
					//body = body.replace( /"{"/g , '{"' );
					//body = body.replace( /}"}/g , "}}" );
					//body = body.replace( /"""/g , '"' );
					//body = body.replace( /""/g , '"\\"' );
					body = JSON.parse( body );
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