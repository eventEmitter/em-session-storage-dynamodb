



	module.exports = {
		TableName: "session"
		, AttributeDefinitions: [
			{
				  AttributeName: 	"sessionId"
				, AttributeType: 	"S"
			}
			, {
				  AttributeName: 	"created"
				, AttributeType: 	"N"
			}
			, {
				  AttributeName: 	"accessed"
				, AttributeType: 	"N"
			}
		]
		, KeySchema: [
			{
				  AttributeName: 	"sessionId"
				, KeyType: 			"HASH"
			}
			, {
				  AttributeName: 	"created"
				, KeyType: 			"RANGE"
			}
		]
		, LocalSecondaryIndexes: [
			{
				  IndexName: 				"index_created"
				, KeySchema: [
					{
						  AttributeName: 	"sessionId"
						, KeyType: 			"HASH"
					}
					, {
						  AttributeName: 	"created"
						, KeyType: 			"RANGE"
					}
				]
				, Projection: {
					ProjectionType: 		"KEYS_ONLY"
				}
			}
			, {
				  IndexName: 				"index_accessed"
				, KeySchema: [
					{
						  AttributeName: 	"sessionId"
						, KeyType: 			"HASH"
					}
					, {
						  AttributeName: 	"accessed"
						, KeyType: 			"RANGE"
					}
				]
				, Projection: {
					ProjectionType: 		"KEYS_ONLY"
				}
			}
		]
		, ProvisionedThroughput: {
			  ReadCapacityUnits:  			10
			, WriteCapacityUnits: 			5
		}
	};