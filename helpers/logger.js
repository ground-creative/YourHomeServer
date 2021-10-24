const util = require('util');

module.exports = function( session )
{
	let module = { };
	
	module.session = session;
	
	module.simple = function( msg , data )
	{
		if ( data )
		{
			data = util.inspect( data , { "showHidden": false , "depth": null , "colors": true } );
			console.log( '[' + this._getTime( ) + '][' + module.session + '] ' + msg , data );
		}
		else
		{
			console.log( '[' + this._getTime( ) + '][' + module.session + '] ' + msg );
		}
		return false;
	};
	
	module.request = function( msg , data )
	{
		if ( data )
		{
			data = util.inspect( data , { "showHidden": false , "depth": null , "colors": true } );
			console.log( '\x1b[36m%s\x1b[0m' , '[' + this._getTime( ) + '][' + module.session + '] ' + msg , data );
		}
		else
		{
			console.log( '\x1b[36m%s\x1b[0m' , '[' + this._getTime( ) + '][' + module.session + '] ' + msg );
		}
		return false;
	};
	
	module.cloud = function( msg , data )
	{
		if ( data )
		{
			//data = ( Object.keys( data ).length !== 0 ) ? JSON.stringify( data ) : data;
			data = util.inspect( data , { "showHidden": false , "depth": null , "colors": true } );
			console.log( "\x1b[43m" , '[' + this._getTime( ) + '][' + module.session + '] ' + msg + "\x1b[0m" , data );
		}
		else
		{
			console.log( "\x1b[43m" , '[' + this._getTime( ) + '][' + module.session + '] ' + msg + "\x1b[0m" );
		}
		return false;
	};
	
	module.msg = function( msg , data )
	{
		if ( data )
		{
			data = util.inspect( data , { "showHidden": false , "depth": null , "colors": true } );
			console.log( '\x1b[33m%s\x1b[0m' , '[' + this._getTime( ) + '][' + module.session + '] ' + msg , data );
		}
		else
		{
			console.log( '\x1b[33m%s\x1b[0m' , '[' + this._getTime( ) + '][' + module.session + '] ' + msg );
		}
		return false;
	};
	
	module.connected = function( msg , data )
	{
		if ( data )
		{
			data = util.inspect( data , { "showHidden": false , "depth": null , "colors": true } );
			console.log( '\x1b[32m%s\x1b[0m' , '[' + this._getTime( ) + '][' + module.session + '] ' + msg , data );
		}
		else
		{
			console.log( '\x1b[32m%s\x1b[0m' , '[' + this._getTime( ) + '][' + module.session + '] ' + msg );
		}
		return false;
	};
	
	module.disconnected = function( msg , data )
	{
		if ( data )
		{
			data = util.inspect( data , { "showHidden": false , "depth": null , "colors": true } );
			console.log( '\x1b[32m%s\x1b[0m' , '[' + this._getTime( ) + '][' + module.session + '] ' + msg , data );
		}
		else
		{
			console.log( '\x1b[32m%s\x1b[0m' , '[' + this._getTime( ) + '][' + module.session + '] ' + msg );
		}
		return false;
	};
	
	module.error = function( msg , data )
	{
		if ( data )
		{
			data = util.inspect( data , { "showHidden": false , "depth": null , "colors": true } );
			console.error( "\x1b[41m" , '[' + this._getTime( ) + '][' + module.session + '] ' + msg + "\x1b[0m" , data );
		}
		else
		{
			console.error( "\x1b[41m" , '[' + this._getTime( ) + '][' + module.session + '] ' + msg + "\x1b[0m" );
		}
		return false;
	};
	
	module.scene = function( msg , data )
	{
		if ( data )
		{
			data = util.inspect( data , { "showHidden": false , "depth": null , "colors": true } );
			console.error( "\x1b[44m" , '[' + this._getTime( ) + '][' + module.session + '] ' + msg + "\x1b[0m" , data );
		}
		else
		{
			console.error( "\x1b[44m" , '[' + this._getTime( ) + '][' + module.session + '] ' + msg + "\x1b[0m" );
		}
		return false;
	};
	
	module._getTime = function( )
	{
		let date_ob = new Date( );
		let date = ( "0" + date_ob.getDate( ) ).slice( -2 );
		let month = ( "0" + ( date_ob.getMonth( ) + 1 ) ).slice( -2 );
		let year = date_ob.getFullYear( );
		let hours = date_ob.getHours( );
		let minutes = date_ob.getMinutes( );
		let seconds = date_ob.getSeconds( );
		let mseconds = date_ob.getMilliseconds( );
		if ( hours < 10 ){ hours = "0"+hours; }
		if ( minutes < 10 ){ minutes = "0"+minutes; }
		if ( seconds < 10 ){ seconds = "0"+seconds; }
		if ( mseconds < 10 ){ mseconds = "000"+mseconds; }
		else if ( mseconds < 100 ){ mseconds = "00"+mseconds; }
		else if ( mseconds < 1000 ){ mseconds = "0"+mseconds; }
		let str = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds + "." + mseconds;
		return str;
	};
	return module;
};