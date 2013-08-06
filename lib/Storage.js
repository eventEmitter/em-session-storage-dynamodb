

	var   Class 		= require( 'ee-class' )
		, log 			= require( 'ee-log' )
		, project 		= require( 'ee-project' )
		, AWS 			= require( 'aws-sdk' );


	var schema 			= require( '../schema/session' );


	
	// soo, the smart guys from AWS catch all errors thrown inside callbacks given to them
	// several workarounds required to be able to code anything that works, stupid kiddies!
	var AWSError = function( err ){
		log.trace( new Error( err.message ) );
		process.exit();
	}

	// process.nextTick puts the callback into another stack, we're free again!
	var AWSCallback = function( callback ){
		process.nextTick( function(){
			callback( Array.prototype.slice.call( arguments, 1 ));
		} );
	}



	module.exports = new Class( {


		  online: false
		, queue: []


		, TABLE_NAME: "session"


		, init: function( options ){
			this.aws = AWS;
			this.aws.config.set( 'accessKeyId', 		project.config.dynamoDB.accessKeyId );
			this.aws.config.set( 'secretAccessKey', 	project.config.dynamoDB.secretAccessKey );
			this.aws.config.set( 'region', 				project.config.dynamoDB.region );


			this.db = new this.aws.DynamoDB( { apiVersion: '2012-08-10' } );
			this.db.listTables( function( err, data ){
				if ( err ) throw new AWSError( err );
				else {
					// create schema?
					if ( !data || !data.TableNames || data.TableNames.indexOf( this.TABLE_NAME ) === -1 ){
						log.warn( "creating sesison table ..." );

						this.db.createTable( schema, function( err, data ){
							if ( err ) throw new AWSError( err );
							else {
								this.observeTableStatus();
							}
						}.bind( this ) );
					}
					else this.observeTableStatus();
				}
			}.bind( this ) );
		}



		, observeTableStatus: function(){
			this.db.describeTable( { TableName: this.TABLE_NAME }, function( err, data ){
				if ( err ) throw new AWSError( err );
				else {
					//log.debug( "observing", data && data.Table && data.Table.TableStatus ? data.Table.TableStatus : "nothig ..." );
					if ( data && data.Table && data.Table.TableStatus && data.Table.TableStatus === "ACTIVE" ){
						this.online = true;
						log.debug( "session table is online ..." );
						this.executeQueue();
					}
					else {
						setTimeout( this.observeTableStatus.bind( this ), 1000 );
					}
				}
			}.bind( this ) );
		}


		, executeQueue: function(){
			var i = this.queue.length, m = 0, item;

			if ( i > 10 ) i = 10;

			while( this.queue.length > 0 && m < i ){
				item = this.queue.shift();
				this.executeJob( item.action, item.args );
				m++;
			}

			if ( this.queue.length > 0 ){
				setTimeout( this.executeQueue.bins( this ), 1000 );
			}
		}


		, queueJob: function( action, args ){
			this.queue.push( { action: action, args: Array.prototype.slice.call( args, 0 ) } );
		}


		, executeJob: function( action, args ){
			this[ action ].apply( this, args );
		}	



		// get the complete session
		, get: function( sessionId, callback ){
			if ( !this.online ) return this.queueJob( "get", arguments ), this;

			// callback: function( err, sessionData ){}
			// err must not be set if no value could be found ( this will return instead undefined as value )
			this.db.query( { 
				  TableName: 		this.TABLE_NAME
				, Select: 			"ALL_ATTRIBUTES" 
				, ConsistentRead: 	true
				, KeyConditions: {
					sessionId: { 
						  AttributeValueList:  [ {
						  	S: sessionId
						  } ]
						, ComparisonOperator:  "EQ"
					}
				}
			}, function( err, data ){
				if ( err ) throw new AWSError( err );
				else {
					AWSCallback( callback, err, data );
				}
			}.bind( this ) );
		}


		// sessiondata must be a js object
		, set: function( sessionId, sessionData, callback ){
			if ( !this.online ) return this.queueJob( "set", arguments ), this;
			
			// callback: function( err, sessionData ){}
			// err must not be set if no value could be found ( this will return instead undefined as value )
			this.db.putItem( { 
				  TableName: 		this.TABLE_NAME
				, Item: {
					sessionId: { S: sessionId }
					, created: { N: "1" }
					, accessed: { N: "1" }
				}
			}, function( err, data ){
				if ( err ) throw new AWSError( err );
				else {
					AWSCallback( callback, err, data );
				}
			}.bind( this ) );
		}


		// key is a key on the root of the sessiondata object
		, update: function( sessionId, key, value, callback ){
			// callback: function( err ){}
		}


		// key is a key on the root of the sessiondata object
		, remove: function( sessionId, key, callback ){
			// callback: function( err ){}
		}


		// delete the session from the storage
		, delete: function( sessionId, callback ){
			// callback: function( err ){}
		}		
	} );