module.exports = function( )
{
	let module = { };
	
	module.init = function( dependencies )
	{
		return dependencies.baseClass.magicMethods
		( 
			class Token
			{
				constructor( config ) 
				{
					this._config = config;
					this._endpoints =
					{
						"get_new": "/v1.0/token?grant_type=1" ,
						"get_refresh": "/v1.0/token/{refresh_token}"
					}
				}
				
				endpoints( )
				{
					return this._endpoints;
				}
				
				__get( name ) 
				{
					let caller = new dependencies.Caller( this._config , this._endpoints , dependencies , '' );
					return caller.send( name , arguments );
				} 
			} 
		);
	};
	return module;	
};			