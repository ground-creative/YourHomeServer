const url = require( 'url' );

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
			this._paramErr( 'Request error: missing parameter "actions"' , -15 );
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
	
	module.checkCloudConfig = function( label , config )
	{
		if ( !config.hasOwnProperty( label ) )
		{
			this._paramErr( "Error: Coudn't find config label with name '" + label + "'" , -14 );
			return false;
		}
		return true;
	};
	
	module.schema = function( label , schemas , devices )
	{
		if ( !devices[ label ] )
		{
			this._paramErr( 'Label error: could not find device config for label ' + "'" + label + "'" , -8 );
			return false;
		}
		else if ( !schemas[ devices[ label ].type ][ devices[ label ].category ] )
		{
			this._paramErr( 'Label error: could not find device config for label ' + "'" + label + "'" , -9 );
			return false;
		}
		if ( !schemas[ devices[ label ].type ][ devices[ label ].category ] )
		{
			this._paramErr( 'Schema error: device schema not supported for device ' + label+ "'" , -6 );
			return false;
		}
		return schemas[ devices[ label ].type ][ devices[ label ].category ];
	};
	
	module.checkSceneName = function( name , scenes )
	{
		if ( !scenes[ name ] )
		{
			this._paramErr( "Abort: '" + name + "' scene does not exist" , -7 );
			return false;
		}
		return true;
	};
	
	module.checkEndpoint = function( endpoints , request )
	{
		if ( !endpoints.hasOwnProperty( request ) )
		{
			this._paramErr( "Invalid endpoint '" + request + "'" , -12 , { "endpoints list": endpoints } );
			return false;
		}
		return true;
	};
	
	module.checkCloudTypes = function( type , engine )
	{
		let types = [ ];
		if ( engine == 'tuya' )
		{
			types = [ 'home' , 'scenes' , 'token' , 'devices' ];
		}
		else if ( engine == 'smartthings' )
		{
			types = [ 'devices' , 'apps' , 'conditions' ];
		}
		if ( !types.includes( type ) )
		{
			this._paramErr( "Error: type '" + type + "' is not supported" , -13 );
			return false;
		}
		return true;
	}
	
	module.checkConditionName = function( name , conditions )
	{
		if ( !conditions[ name ] )
		{
			this._paramErr( "Abort: '" + name + "' condition does not exist" , -4 );
			return false;
		}
		return true;
	};
	module.parseLocalQueryData = function( actions , query )
	{
		let data = '';
		if ( actions == "info" )
		{
			data =  JSON.parse( query ).result.data;
		}
		else
		{
			data = { };
			actions = actions.split( '^' );
			let values = JSON.parse( query );
			for ( const k in actions )
			{
				val = ( actions[ k ] == 'off' || actions[ k ] == 'on' ) ? 'switch' : actions[ k ];
				if ( values.result.data.hasOwnProperty( actions[ k ] ) )
				{
					data[ val ] = values.result.data[ val ];
				}
			}
		}
		return data;
	};
	
	module.parseSmartThingsCloudQueryData = function( actions , query , schema )
	{
		let data = '';
		if ( actions == "info" )
		{
			data = Object.assign( { } , query );
			for ( const k in schema )
			{
				if ( data[ schema[ k ].capability ] && data[ schema[ k ].capability ][ k ] )
				{
					data[ k ] = data[ schema[ k ].capability ][ k ].value;
				}
			}
		}
		else
		{
			data = { };
			for ( const key in actions )
			{
				if ( query[ schema[ actions[ key ] ].capability ] && 
					query[ schema[ actions[ key ] ].capability ][ actions[ key ] ] )
				{
					data[ actions[ key ] ] = query[ schema[ actions[ key ] ].capability ][ actions[ key ] ].value;
				}
			}
		}
		return data;
	};

	module.parseTuyaCloudQueryData = function( actions , query , schema )
	{
		let data = '';
		if ( actions == "info" )
		{
			data = Object.assign( { } , query );
			for ( const k in data )
			{
				data[ data[ k ].code ] = data[ k ].value;
			}
		}
		else
		{
			data = { };
			for ( const k in actions )
			{
				for ( const key of query )
				{
					if ( key.code == actions[ k ] )
					{
						data[ actions[ k ] ] = key.value;
					}
					
				}
			}
		}
		return data;		
	};
	
	module.dynamicSceneValues = function( string )
	{
		let g = url.parse( req.url , true ).query;
		if ( Object.keys( g ).length !== 0 )
		{
			for ( const key in g )
			{
				let regex = new RegExp( '{' + key + '}' , 'g' );
				string = string.replace( regex , g[ key ] );
			}
		}
		return string;	
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
	
	module.formatTuyaCloudEndpoint = function( uri , params , config )
	{
		uri = uri.replace( '{home_id}' , config.homeID );
		uri = uri.replace( '{uid}' , config.uid );
		uri = uri.replace( '{appId}' , config.appKey );
		uri = uri.replace( '{user_id}' , config.user_id );
		uri = uri.replace( '{room_id}' , params[ 0 ] );
		uri = uri.replace( '{function_code}' , params[ 0 ] );
		uri = uri.replace( '{device_group_id}' , params[ 0 ] );
		uri = uri.replace( '{group_id}' , params[ 0 ] );
		uri = uri.replace( '{device_id}' , params[ 0 ] );
		uri = uri.replace( '{scene_id}' , params[ 0 ] );
		return uri;
	};
	
	module.formatSmartThingsCloudEndpoint = function( uri , params )
	{
		uri = uri.replace( '{device_id}' , params[ 0 ] );
		uri = uri.replace( '{appNameOrId}' , params[ 0 ] );
		uri = uri.replace( '{installedAppId}' , params[ 0 ] );
		uri = uri.replace( '{component_id}' , params[ 1 ] );
		uri = uri.replace( '{configurationId}' , params[ 1 ] );
		uri = uri.replace( '{subscriptionId}' , params[ 1 ] );
		uri = uri.replace( '{capability_id}' , params[ 2 ] );
		return uri;
	};
	
	module.testConditions = function( value , data , label )
	{
		if ( value.match( '=' ) )
		{
			let cond = value.split( '=' );
			cond[ 1 ] = this.formatConditions( cond[ 1 ] );
			if ( data[ cond[ 0 ] ] == cond[ 1 ] )
			{
				console.log( 'Condition ' + label + ':' + cond[ 0 ] + '=' + cond[ 1 ] + ' is true' );
				return true;
			}
			else
			{
				console.log( 'Condition ' + label + ':' + cond[ 0 ] + '=' + cond[ 1 ] + ' is false' );
				return false;
			}
		}
		else if ( value.match( '>' ) )
		{
			let cond = value.split( '>' );
			cond[ 1 ] == parseInt( cond[ 1 ] );
			if ( data[ cond[ 0 ] ] > cond[ 1 ] )
			{
				console.log( 'Condition ' + label + ':' + cond[ 0 ] + '>' + cond[ 1 ] + ' is true' );
				return true;
			}
			else
			{
				console.log( 'Condition ' + label + ':' + cond[ 0 ] + '>' + cond[ 1 ] + ' is false' );
				return false;
			}
		}
		else if ( value.match( '>' ) )
		{
			let cond = value.split( '<' );
			cond[ 1 ] == parseInt( cond[ 1 ] );
			if ( data[ cond[ 0 ] ] < cond[ 1 ] )
			{
				console.log( 'Condition ' + label + ':' + cond[ 0 ] + '<' + cond[ 1 ] + ' is true' );
				return true;
			}
			else
			{
				console.log( 'Condition ' + label + ':' + cond[ 0 ] + '<' + cond[ 1 ] + ' is false' );
				return false;
			}
		}
		return false;
	};
	
	module._paramErr = function( msg , code , data )
	{
		req.logger.error( msg );
		data = ( data ) ? data : { };
		let result = req.resHandler.payload( true , code , msg , data );
		res.header( 'Content-Type' , 'application/json' );
		res.status( 500 ).send( result );	
	};
	
	return module;
};