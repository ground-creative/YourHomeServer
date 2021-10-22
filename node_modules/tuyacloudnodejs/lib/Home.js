module.exports = function( )
{
	let module = { };
	
	module.init = function( dependencies )
	{
		return dependencies.baseClass.magicMethods
		( 
			class Home
			{
				constructor( config , token ) 
				{
					this._config = config;
					this._token = token;
					this._endpoints =
					{
						"get_single"				:		"/v1.0/homes/{home_id}" ,
						"get_devices"				:		"/v1.0/homes/{home_id}/devices" ,
						"get_members"			:		"/v1.0/homes/{home_id}/members" ,
						"get_user_list"				:		"/v1.0/users/{uid}/homes" ,
						"get_room_devices"			:		"/v1.0/homes/{home_id}/rooms/{room_id}/devices" ,
						"post_add"				:		"/v1.0/home/create-home" ,
						"post_member"			:		"/v1.0/homes/{home_id}/members" ,
						"post_device"				:		"/v1.0/homes/{home_id}/rooms/{room_id}/devices" ,
						"put_modify"				:		"/v1.0/homes/{home_id}" ,
						"put_member_permissions"	:		"/v1.0/homes/{home_id}/members/{uid}" ,
						"put_device"				:		"/v1.0/homes/{home_id}/rooms/{room_id}/devices	" ,
						"delete_home"				:		"/v1.0/homes/{home_id}" ,
						"delete_member"			:		"/v1.0/homes/{home_id}/members/{uid}}" ,
						"delete_device"			:		"/v1.0/homes/{home_id}/rooms/{room_id}/device" ,
						
					}
				}
				
				endpoints( )
				{
					return this._endpoints;
				}

				__get( name ) 
				{
					let caller = new dependencies.Caller( this._config , this._endpoints , dependencies , this._token );
					return caller.send( name , arguments );
				} 
			} 
		);
	};
	return module;	
};			