$(document).ready(function () {
	// Amazon access
	// Initialize the Amazon Cognito credentials provider
	AWS.config.region = 'us-east-2'; // Region
	AWS.config.credentials = new AWS.CognitoIdentityCredentials({
		IdentityPoolId: 'us-east-2:81247ce0-374f-43cd-9e21-4de4cfeac123',
	});

	// Instantiate aws sdk service objects now that the credentials have been updated
	var docClient = new AWS.DynamoDB.DocumentClient({
		region: 'us-east-2'
	});
	var ddbTable = 'TEAM';
	var item_params = {
		Key: {
			"name": "teamwork"
		},
		TableName: ddbTable
	}

	docClient.get(item_params, function (err, data) {
		if (err) console.log(err, err.stack); // an error occurred
		else {
			name_list = data.Item.members;
			draw_cups(name_list);
			setInterval(live_update,250);
		}
	});


	function update_dynamo(person, value) {
		person = "members." + person;
		var params = {
			TableName: ddbTable,
			Key: {
				"name": "teamwork",
			},
			UpdateExpression: "set " + person + " = " + person + "+ :val",
			ExpressionAttributeValues: {
				":val": value
			},
			ReturnValues: "UPDATED_NEW"
		};
		docClient.update(params, function (err, data) {
			$(".input").val("");
			if (err) console.log(err);
			else {
				names = data.Attributes.members
				$.each(names, function (k, v) {
					$("#" + k + " .water").css("height", Math.min(20 + v * 30, 320));
				});
			}
		});
	}

	function reset_dynamo(person) {
		person = "members." + person;
		var params = {
			TableName: ddbTable,
			Key: {
				"name": "teamwork",
			},
			UpdateExpression: "set " + person + " = :r",
			ExpressionAttributeValues: {
				":r": 0
			},
			ReturnValues: "UPDATED_NEW"
		};
		docClient.update(params, function (err, data) {
			$(".input").val("");
			if (err) console.log(err);
			else {
				names = data.Attributes.members
				console.log(names);
				$.each(names, function (k, v) {
					$("#" + k + " .water").css("height", Math.min(20 + v * 30, 320));
				});
			}
		});
	}

	function live_update() {
		docClient.get(item_params, function (err, data) {
			if (err) console.log(err, err.stack); // an error occurred
			else {
				names = data.Item.members;
				$.each(names, function (k, v) {
					$("#" + k + " .water").css("height", Math.min(20 + v * 30, 320));
				});
			}
		});
	}

	function draw_cups(names) {
		left = 90;
		$.each(names, function (k, v) {
			var input = "<input class='input' id = '" + k + "' type='number' placeholder='work hour'>"

			var $newDiv = $("<div/>") // creates a div element
				.attr("id", k) // adds the id
				.addClass("cup") // add a class
				.html("<div class = \"water\"></div> <div class = \"name\">" + input + "<h1>" + k + "<h1></div>");
			$('body').append($newDiv)
			$("#" + k).css("left", left);
			$("#" + k + " .water").css("height", Math.min(20 + v * 30, 320));
			left += ($('body').width() - 180 * (Object.keys(names).length + 1)) / (Object.keys(names).length - 1) + 180;
			$("#" + k + " .name .input").keypress(function (event) {
				var keycode = (event.keyCode ? event.keyCode : event.which);
				if (keycode == '13') {
					value = parseInt($(this).val());
					if (value === 0) {
						reset_dynamo($(this).attr("id"));
					} else {
						update_dynamo($(this).attr("id"), value);
					}
				}
				//Stop the event from propogation to other handlers
				//If this line will be removed, then keypress event handler attached
				//at document level will also be triggered
				event.stopPropagation();
				return;
			});
		});
	}
});