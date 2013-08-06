


	var   StorageService 	= require( "./" )
		, storage 			= new StorageService()
		, log 				= require( "ee-log" );



	storage.get( "sucker", function( err, data ){
		log.info( "iu" );
	} );

	storage.set( "sucker", {}, function( err, data ){
		log.info( "oops" );
	} );
