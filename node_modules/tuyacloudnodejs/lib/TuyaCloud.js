module.exports = class TuyaCloud
{
	constructor( config ) 
	{
		this._config = this._checkConfig( config );
		this._dependencies =
		{
			"baseClass" 		: require( "./magic-methods" ) ,
			"Token"			: require( "./Token" ) ,
			"Request"			: require( "./Request" ) ,
			"Caller"			: require( "./Caller" ) ,
			"Scenes"			: require( "./Scenes" ) ,
			"Home"			: require( "./Home" ) ,
			"Devices"			: require( "./Devices" ) ,
			"crypto"			: require( "crypto" ) ,
			"requestsHandler"	: require( "request" )
		};
	}

	_checkConfig( config )
	{
		return config;
	}
	
	token( )
	{
		let init = this._dependencies.Token( ).init( this._dependencies );
		return new init( this._config );
	}
	
	devices( token )
	{
		let init = this._dependencies.Devices( ).init( this._dependencies );
		return new init( this._config , token );
	}
	
	scenes( token )
	{
		let init = this._dependencies.Scenes( ).init( this._dependencies );
		return new init( this._config , token );
	}
	
	home( token )
	{
		let init = this._dependencies.Home( ).init( this._dependencies );
		return new init( this._config , token );
	}
};