let DATA_ENTRY_NAME = 'Oct22';
let CUP_HEIGHT = 310;
let MIN_WATER_HEIGHT = 10;
let WATER_PER_HOUR_RELAX = 15;
let WATER_PER_PRODUCTIVITY = 25;
let CUP_WIDTH = 250;

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
			"name": DATA_ENTRY_NAME
		},
		TableName: ddbTable
	}

	docClient.get(item_params, function (err, data) {
		if (err) console.log(err, err.stack); // an error occurred
		else {
			date = data.Item.startdate;
			names = data.Item.productivity;
			draw_cups(names);
			setInterval(live_update, 500);
			setInterval(function () {
				start_time = moment(date).format('MMMM Do YYYY');
				end_time = moment(date).add(14, 'days')
				remaining_time = end_time.diff(moment(), "days")
				$("#timestamp").html("<h2> Today is " + moment().format('MMMM Do YYYY') + ". There are " + remaining_time + " days left until we can rest and celebrate! <h2>");
				$("#period").html("<h2>Hey guys! Our journey begins since " + start_time + ". <h2>");
			});
		}
	});


	function update_dynamo(person, value, is_productivity) {
		person = (is_productivity ? "productivity." + person : "relax." + person);
		var params = {
			TableName: ddbTable,
			Key: {
				"name": DATA_ENTRY_NAME
			},
			UpdateExpression: "set " + person + " = " + person + "+ :val",
			ExpressionAttributeValues: {
				":val": value
			},
			ReturnValues: "UPDATED_NEW"
		};
		docClient.update(params, function (err, data) {
			if (err) console.log(err);
			else {
				$("input").val("");
				$.each(productivity, function (k, v) {
					$("#" + k + " .productive_water").css("height", Math.min(MIN_WATER_HEIGHT + v * WATER_PER_PRODUCTIVITY, CUP_HEIGHT));
				});
				$.each(relax, function (k, v) {
					$("#" + k + " .relax_water").css("height", Math.min(MIN_WATER_HEIGHT + v * WATER_PER_HOUR_RELAX, CUP_HEIGHT));
				});
			}
		});
	}

	function reset_dynamo(person, is_productivity) {
		person = (is_productivity ? "productivity." + person : "relax." + person);
		var params = {
			TableName: ddbTable,
			Key: {
				"name": DATA_ENTRY_NAME,
			},
			UpdateExpression: "set " + person + " = :r",
			ExpressionAttributeValues: {
				":r": 0
			},
			ReturnValues: "UPDATED_NEW"
		};
		docClient.update(params, function (err, data) {
			if (err) console.log(err);
			else {
				$("input").val("");
				$.each(productivity, function (k, v) {
					$("#" + k + " .productive_water").css("height", Math.min(MIN_WATER_HEIGHT + v * WATER_PER_PRODUCTIVITY, CUP_HEIGHT));
				});
				$.each(relax, function (k, v) {
					$("#" + k + " .relax_water").css("height", Math.min(MIN_WATER_HEIGHT + v * WATER_PER_PRODUCTIVITY, CUP_HEIGHT));
				});
			}
		});
	}


	function live_update() {
		docClient.get(item_params, function (err, data) {
			if (err) console.log(err, err.stack); // an error occurred
			else {
				productivity = data.Item.productivity;
				relax = data.Item.relax;
				$.each(productivity, function (k, v) {
					$("#" + k + " .productive_water").css("height", Math.min(MIN_WATER_HEIGHT + v * WATER_PER_PRODUCTIVITY, CUP_HEIGHT));
				});
				$.each(relax, function (k, v) {
					$("#" + k + " .relax_water").css("height", Math.min(MIN_WATER_HEIGHT + v * WATER_PER_HOUR_RELAX, CUP_HEIGHT));
				});
			}
		});
	}

	function draw_cups(names) {
		left = $('body').width() / 24
		distance = 2 * left
		CUP_WIDTH = 4 * left
		console.log(CUP_WIDTH);
		$.each(names, function (k, v) {
			var input = "<input class='productive_input' id = '" + k + "' type='number' placeholder='productive hrs'> <input class='relax_input' id = '" + k + "' type='number' placeholder='happy hrs'>"
			var $newDiv = $("<div/>") // creates a div element
				.attr("id", k) // adds the id
				.addClass("cup_set") // add a class
				.html("<div class = 'productive_cup'> <div class = 'productive_water'></div> </div> <div class = 'relax_cup'> <div class = \"relax_water\"></div> </div>" + input + "<div class = \"name\">" + "<h3>" + k + "<h3></div>");
			$('body').append($newDiv)
			$("#" + k).css("left", left);
			// left += ($('body').width() - CUP_WIDTH * (Object.keys(names).length + 1)) / (Object.keys(names).length - 1) + CUP_WIDTH;
			left += 	CUP_WIDTH + distance;
			$("#" + k).css("width", CUP_WIDTH);
			$(".name").css("width", CUP_WIDTH);
			
			$("#" + k + " .productive_input").keypress(function (event) {
				var keycode = (event.keyCode ? event.keyCode : event.which);
				if (keycode == '13') {
					value = parseInt($(this).val());
					if (value === 0) {
						reset_dynamo($(this).attr("id"), true);
					} else {
						update_dynamo($(this).attr("id"), value, true);
					}
				}
				// Stop the event from propogation to other handlers
				// If this line will be removed, then keypress event handler attached
				// at document level will also be triggered
				event.stopPropagation();
				return;
			});
			$("#" + k + " .relax_input").keypress(function (event) {
				console.log('a');
				var keycode = (event.keyCode ? event.keyCode : event.which);
				if (keycode == '13') {
					value = parseInt($(this).val());
					if (value === 0) {
						reset_dynamo($(this).attr("id"), false);
					} else {
						update_dynamo($(this).attr("id"), value, false);
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

