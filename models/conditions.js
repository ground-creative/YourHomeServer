module.exports = function ( req , res , localController , cloudController , cloudConfig )
{
	let module = { };
	
	module.eval = async function( name , conditions , config , schemas , devices )
	{
		let data = '';
		let token = '';
		let testCondition = false;
		for ( const key in conditions[ name ].conditions )
		{
			let label = conditions[ name ].conditions[ key ].label;
			try
			{
				if ( conditions[ name ].conditions[ key ].hasOwnProperty( "type" ) )
				{
					let schema = schemas[ devices[ label ].type ][ devices[ label ].category ];
					let config = conditions[ name ].conditions[ key ].config;
					if ( devices[ label ].type == 'tuya' )
					{
						if ( !token )
						{	
							token = await cloudController.getTuyaCloudToken( cloudConfig[ config ] );
						}
						query = await cloudController.getTuyaCloudDeviceData( token , label , cloudConfig[ config ] );
						data = req.paramsHandler.parseTuyaCloudQueryData( 'info' , query.result , schema );
					}
					else if ( devices[ label ].type == 'smartthings' )
					{
						let component = conditions[ name ].conditions[ key ].component;
						query = await cloudController.getSmartThingsDeviceData( label , component , cloudConfig[ config ] );
						data = req.paramsHandler.parseSmartThingsCloudQueryData( 'info' , query.data , schema );
					}
					else
					{
						let msg = "Cloud engine " + devices[ label ].type + " is not supported for " + condition.label + " " + error;
						req.logger.error( msg );
						result = req.resHandler.payload( true , -14 , msg , {} );
						return res.status( 500 ).end( result );
					}
				}
				else
				{
					let url = 'http://127.0.0.1:' + config.port + '/local/device/' + label + '/?action=info';
					let query = await localController.request( url );
					data = JSON.parse( query ).result.data;
				}
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
							let testOrCond = false;
							for ( const key in or )
							{
								req.logger.msg( "Starting to check subcondition " + or[ key ].label + ':' , or[ key ].eval );
								if ( or[ key ].hasOwnProperty( "type" ) )
								{
									let config = or[ key ].config;
									let schema = schemas[ devices[ or[ key ].label ].type ][ devices[ or[ key ].label ].category ];
									if ( devices[ or[ key ].label ].type == 'tuya' )
									{
										if ( !token )
										{	
											token = await cloudController.getTuyaCloudToken( cloudConfig[ config ] );
										}
										testOrCond = await this.evalTuyaCloudSub( token , or[ key ] , cloudConfig[ config ] , schema );
									}
									else if ( devices[ or[ key ].label ].type == 'smartthings' )
									{
										testOrCond = await this.evalSmartThingsSub( or[ key ] , cloudConfig[ config ] , schema );
									}
									else
									{
										testOrCond = await this.evalLocalSub( or[ key ] , config );
									}
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
			if ( testCondition == false )
			{
				break;
			}
		}
		return testCondition;
	};
	
	module.evalSmartThingsSub = async function( condition , config , schema )
	{
		let testCondition = false;
		let query = await cloudController.getSmartThingsDeviceData( condition.label , condition.component , config );
		let data = req.paramsHandler.parseSmartThingsCloudQueryData( 'info' , query.data , schema );
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
		return testCondition;
	};
	
	module.evalTuyaCloudSub = async function( token , condition , config , schema )
	{
		let testCondition = false;
		let query = await cloudController.getTuyaCloudDeviceData( token , condition.label , config );
		let data = req.paramsHandler.parseTuyaCloudQueryData( 'info' , query.result , schema );
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
		return testCondition;
	};
	
	module.evalLocalSub = async function( condition , config )
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