module.exports = function( res )
{
	let module = {};
	
	module.payload = function( success , code , msg , data )
	{
		var dt = new Date( );
		return JSON.stringify
		( {
			"result":
			{
				"success": success ,
				"message": msg ,
				"data": data ,
				"code": code
			} ,
			"code": 200 ,
			"time": dt.getTime( )
		} );
	};
	
	module.timeout = function( code , msg , data )
	{
		var dt = new Date( );
		return JSON.stringify
		( {
			"result":
			{
				"success": false ,
				"message": msg ,
				"data": data ,
				"code": code
			} ,
			"code": 408 ,
			"time": dt.getTime( )
		} );
	};
	
	module.notFound = function( code , msg , data )
	{
		var dt = new Date( );
		return JSON.stringify
		( {
			"result":
			{
				"success": false ,
				"message": msg ,
				"data": data ,
				"code": code
			} ,
			"code": 404 ,
			"time": dt.getTime( )
		} );
	};
	
	module.output = function( data , code , headers )
	{
		if ( this.type == 'scene' )
		{
			return false
		}
		if ( headers && code )
		{
			res.header( 'Content-Type' , headers );
			res.status( code ).send( data );
		}
		else if ( code )
		{
			res.status( code ).end( data );
		}
		else
		{
			res.end( data );
		}
	};
	
	module.format = function( type , json , schema )
	{
		let data = JSON.parse( json );
		if ( type == 'tuya' )
		{
			if ( Object.keys( data.result.data ).length !== 0  &&
							data.result.data.hasOwnProperty( 'dps' ) )
			{
				for ( const key in schema )
				{
					data.result.data[ key ] = data.result.data.dps[ schema[ key ] ];
				}
			}
			data = JSON.stringify( data );
		}
		else if ( type == 'miio' && typeof data.result.data === 'object' )
		{
			data.result.data = Object.assign( {} , data.result.data );
			let i = 0;
			for ( const key in schema )
			{
				if ( Object.keys( data.result.data ).length !== 0  && 
							data.result.data[ i ].hasOwnProperty( 'siid' ) )
				{
					let value = { };
					let test = {};
					if ( data.result.data[ i ].siid == schema[ key ].siid && 
								data.result.data[ i ].piid == schema[ key ].piid )
					{
						
						//value[ key ] = data.result.data[ i ].value;
						data.result.data[ key ] = data.result.data[ i ].value;
						
					}
					//data.result.data.push( value );
				}
				i++;
			}
			data = JSON.stringify( data );
		}
		else	// no support
		{
			data = json;
		}
		return data;
	};
	
	module.type = '';
	
	return module;
};