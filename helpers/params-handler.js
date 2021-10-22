const url = require('url');
const response = require( '../helpers/response' );

module.exports = function ( req , res )
{
	var module = { };
	
	module.actions = function( )
	{
		let g = url.parse( req.url , true ).query;
		let act = ( g[ 'action' ] ) ? g[ 'action' ] : g[ 'actions' ];
		let actions = ( act ) ? act.split( '^' ) : '';
		if ( !actions )
		{
			this._paramErr( 'Request error: missing parameter "actions"' );
			return false;
		}
		return actions;
	};
	
	module.values = function( )
	{
		let g = url.parse( req.url , true ).query;
		let vals = ( g[ 'value' ] ) ? g[ 'value' ] : g[ 'values' ];
		let values = ( vals ) ? vals.split( '^' ) : '';
		return values;
	};
	
	module.schema = function( label , schemas , devices )
	{
		if ( !devices[ label ] )
		{
			this._paramErr( 'Label error: could not find device config for label ' + "'" + label + "'" );
			return false;
		}
		else if ( !schemas[ devices[ label ].type ][ devices[ label ].category ] )
		{
			this._paramErr( 'Label error: could not find device config for label ' + "'" + label + "'" );
			return false;
		}
		if ( !schemas[ devices[ label ].type ][ devices[ label ].category ] )
		{
			this._paramErr( 'Schema error: device schema not supported for device ' + label+ "'" );
			return false;
		}
		return schemas[ devices[ label ].type ][ devices[ label ].category ];
	};
	
	module._paramErr = function( msg )
	{
		req.logger.error( msg );
		let result = response( ).payload( true , -1 , msg , { } );
		res.header( 'Content-Type' , 'application/json' );
		res.status( 500 ).send( result );	
	};
	
	module.formatConditions = function( value )
	{
		if ( value == 'true' )
		{
			return true;
		}
		else if ( value == 'false' )
		{
			return false;
		}
		else if ( !isNaN( values[ i ] ) )
		{
			return parseInt( value );
		}
		return value;
	};
	
	module.testConditions = function( value , data , label )
	{
		if ( value.match( '=' ) )
		{
			let cond = value.split( '=' );
			cond[ 1 ] = this.formatConditions( cond[ 1 ] );
			if ( data[ cond[ 0 ] ] == cond[ 1 ] )
			{
				console.log( 'Condition ' + label + ' => ' + cond[ 0 ] + '=' + cond[ 1 ] + ' is true' );
				return true;
			}
			else
			{
				console.log( 'Condition ' + label + ' => ' + cond[ 0 ] + '=' + cond[ 1 ] + ' is false' );
				return false;
			}
		}
		else if ( value.match( '>' ) )
		{
			let cond = value.split( '>' );
			cond[ 1 ] == parseInt( cond[ 1 ] );
			if ( data[ cond[ 0 ] ] > cond[ 1 ] )
			{
				console.log( 'Condition ' + label + ' => ' + cond[ 0 ] + '>' + cond[ 1 ] + ' is true' );
				return true;
			}
			else
			{
				console.log( 'Condition ' + label + ' => ' + cond[ 0 ] + '>' + cond[ 1 ] + ' is false' );
				return false;
			}
		}
		else if ( value.match( '>' ) )
		{
			let cond = value.split( '<' );
			cond[ 1 ] == parseInt( cond[ 1 ] );
			if ( data[ cond[ 0 ] ] < cond[ 1 ] )
			{
				console.log( 'Condition ' + label + ' => ' + cond[ 0 ] + '<' + cond[ 1 ] + ' is true' );
				return true;
			}
			else
			{
				console.log( 'Condition ' + label + ' => ' + cond[ 0 ] + '<' + cond[ 1 ] + ' is false' );
				return false;
			}
		}
		return false;
	};
	
	return module;
};