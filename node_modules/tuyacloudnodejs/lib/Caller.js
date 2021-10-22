module.exports = class Caller
{
	constructor( config , endpoints , dependencies , token ) 
	{
		this._config = config;
		this._endpoints = endpoints;
		this._token = token;
		this.dependencies = dependencies;
	}
	
	send( name )
	{
		if ( !this._endpoints.hasOwnProperty( name ) )
		{
			return function( )
			{
				return "Method '" + name + "' is not supported!";
			}
		}
		return function( )
		{
			let method = name.split( '_' )[ 0 ].toUpperCase( );
			let payload = '';
			let sign_headers = '';
			let uri = this._endpoints[ name ];
			if ( Object.keys( arguments ).length !== 0 )
			{
				for ( const [ key , value ] of Object.entries( arguments ) ) 
				{
					if ( typeof value === 'object' )
					{
						payload = value;
					}
					else
					{
						uri = uri.replace( /{.*?}/ , value );
					}
				}
			}
			let request = this.dependencies.Request( this._config , this.dependencies );
			return request.call( uri , method , this._token , payload , sign_headers );
			
		}.bind( this );
	}
};