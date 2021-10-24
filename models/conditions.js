module.exports = function ( req , res , localController )
{
	var module = { };
	
	module.eval = async function( name , conditions , config )
	{
		let testCondition = false;
		for ( const key in conditions[ name ].conditions )
		{
			let label = conditions[ name ].conditions[ key ].label;
			try
			{
				let url = 'http://127.0.0.1:' + config.port + '/local/device/' + label + '/?action=info';
				let query = await localController.request( url );
				let data = JSON.parse( query ).result.data;
				let eval = conditions[ name ].conditions[ key ].eval.split( '^' );
				for ( const k in eval )
				{
					req.logger.msg( "Starting to check condition " + label + ':' , eval );
					testCondition = req.paramsHandler.testConditions( eval[ k ] , data , label );
					if ( testCondition )
					{
						testCondition = true;
					}
					else
					{
						if ( conditions[ name ].conditions[ k ].hasOwnProperty( 'or' ) )
						{
							let testOr = false;
							let or = conditions[ name ].conditions[ k ].or;
							for ( const key in or )
							{
								req.logger.msg( "Starting to check subcondition " + or[ key ].label + ':' , or[ key ].eval );
								let testOrCond = await this.evalSub( or[ key ] , config );
								if ( testOrCond )
								{
									testOr = true;
									testCondition = true;
									break;
								}
								else
								{
									testOr = false
									testCondition = false;
								}
								req.logger.msg( "Finished checking subcondition " + or[ key ].label + ':' , or[ key ].eval );
							}
							if ( !testOr )
							{
								testCondition = false;
								break;
							}
						}
						else
						{
							testCondition = false;
							break;
						}
					
					}
					req.logger.msg( "Finished checking condition " + name + ":" + label + ':' , eval );
				}
			}
			catch( error )
			{
				let msg = "Condition evaluation " + name + ":" + label + " " + error;
				req.logger.error( msg );
				result = req.resHandler.payload( true , -14 , msg , {} );
				return res.status( 500 ).end( result );
			}
		}
		
		return testCondition;
	};
	
	module.evalSub = async function( condition , config )
	{
		let testCondition = false;
		try
		{
			let url = 'http://127.0.0.1:' + config.port + '/local/device/' + condition.label + '/?action=info';
			let query = await localController.request( url );
			let data = JSON.parse( query ).result.data;
			let eval = condition.eval.split( '^' );
			for ( const k in eval )
			{
				testCondition = req.paramsHandler.testConditions( eval[ k ] , data , condition.label );
				if ( testCondition )
				{
					testCondition = true;
				}
				else
				{
					testCondition = false;
					break;
				}
			}
		}
		catch( error )
		{
			let msg = "Subcondition evaluation " + condition.label + " " + error;
			req.logger.error( msg );
			result = req.resHandler.payload( true , -14 , msg , {} );
			return res.status( 500 ).end( result );
		}
		return testCondition;
	};
	
	return module;
};