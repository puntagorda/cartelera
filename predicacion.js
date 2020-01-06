function fill(item, selector, content, link) {
	var field = item.find(selector);
	if (link !== undefined && link != null) {
		field
			.find(".value")
			.text("")
			.append(
				$("<a>")
					.attr("target", "_blank")
					.attr("href", link)
					.text(content)
			);
	} else {
		field.find(".value").text(content);
	}
	if (content.length == 0) {
		field.hide();
	}
}

function addDoNotCalls(territoriesData, territory, link, doNotCallField) {
	var hasDoNotCalls = false;
	var doNotCall = findTerritory(territoriesData, territory);
	if (doNotCall != '') {
		hasDoNotCalls = true;
		var addressList = doNotCall.split("\n");
		link.append(
			$("<span>").addClass('arrow-right')
		);
		var ul = $("<ul>");
		doNotCallField
			.find(".value")
			.append(
				$("<ul>")
					.addClass("dnc-list")
					.hide()
					.append(
						$("<li>")
							.text("Territorio " + territory)
							.append(ul)
					)		
			);
		$.each(addressList, function(key, value) {
			var url = "https://www.google.com/maps/search/?api=1&query=" + value;
			$("<li>")
				.append(
					$("<a>")
						.attr("target", "_blank")
						.attr("href", url)
						.text(value)
				)
				.appendTo(ul);
		});
	}
	return hasDoNotCalls;
}

function fillAssignments(item, assignments, territoriesData) {
	var assignmentsField = item.find(".assignments");
	var doNotCallField = item.find(".do-not-call");
	if (assignments.length > 0) {
		var element = assignmentsField.find(".value").text("");
		var hasDoNotCalls = false;
		$.each(assignments, function(key, value) {
			var link = $("<a>")
				.attr("target", "_blank")
				.attr("href", "territorios/mapa.html?territorio=" + value)
				.text(value)
				.appendTo(element);
			hasDoNotCalls = addDoNotCalls(territoriesData, value, link, doNotCallField);
		});
		if (hasDoNotCalls) {
			doNotCallField.find(".value").prepend(
			$("<a>")
				.attr("href", "#")
				.text("Ver más...")
				.addClass("see-more")
				.click(function (event) {
					event.preventDefault();
					var link = $(this);
					if (link.text() == "Ver más...") {
						link.text("Ver menos");
					} else {
						link.text("Ver más...");
					}
					doNotCallField.find(".value .dnc-list").slideToggle();
				})
		);
		} else {
			doNotCallField.hide();
		}
	} else {
		assignmentsField.hide();
		doNotCallField.hide();
	}
}

function findPlace(data, place) {
	for (var i in data.feed.entry) {
		if (data.feed.entry[i].gsx$lugar.$t == place) {
			return data.feed.entry[i].gsx$url.$t;
		}
	}
	return null;
}

function findAssignment(data) {
	var assignments = [];
	if (data != '') {
		assignments = data.split(",")
	}
	return assignments;
}

function findTerritory(data, territory) {
	var territories = [];
	for (var i in data.feed.entry) {
		if (data.feed.entry[i].gsx$territorio.$t == territory) {
			return data.feed.entry[i].gsx$novisitar.$t;
		}
	}
	return '';
}

function processData(groupsRequest, placesRequest, territoriesRequest) {
	var groupsData = JSON.parse(groupsRequest.responseText);
	var placesData = JSON.parse(placesRequest.responseText);
	var territoriesData = JSON.parse(territoriesRequest.responseText);
	var formattedGroupsData = {};
	var template = $(".event");
	var phoneLink = "https://wa.me/598";
	var today = new Date(1900 + new Date().getYear(), new Date().getMonth(), new Date().getDate());

	for (var i = 0; i < groupsData.feed.entry.length; i++) {
		var entry = groupsData.feed.entry[i];
		var day = entry.gsx$fecha.$t;
		var splittedDay = day.split("/");
		var date = new Date(splittedDay[2], splittedDay[1] - 1, splittedDay[0]);
		if (date >= today) {
			if (formattedGroupsData[date] === undefined) {
				formattedGroupsData[date] = [];
			}
			formattedGroupsData[date].push({
				"hour": entry.gsx$hora.$t,
				"conductor": entry.gsx$conductor.$t,
				"auxiliar": entry.gsx$auxiliar.$t,
				"conductorPhone": entry.gsx$teléfonoconductor.$t.slice(1).replace(/ /g, ""),
				"auxiliarPhone": entry.gsx$teléfonoauxiliar.$t.slice(1).replace(/ /g, ""),
				"place": entry.gsx$lugar.$t,
				"notes": entry.gsx$notas.$t,
				"assignments": findAssignment(entry.gsx$territorios.$t),
			});
		}
	}
	for (var day in formattedGroupsData) {
		var date = new Date(day);
		var item = template.clone();
		fill(item, ".number", date.getDate());
		fill(item, ".date", date.toLocaleString('es', {  weekday: 'long' }));
		var times = formattedGroupsData[day];
		var templateRow = item.find(".row").clone();
		item.find(".row").remove();
		for (var i in times) {
			var row = templateRow.clone();
			var time = times[i];
			fill(row, ".time", time.hour);
			fill(row, ".place", time.place, findPlace(placesData, time.place));
			fill(row, ".cond", time.conductor, phoneLink + time.conductorPhone);
			fill(row, ".aux", time.auxiliar, phoneLink + time.auxiliarPhone);
			fill(row, ".notes", time.notes);
			fillAssignments(row, time.assignments, territoriesData);
			item.find(".rows").append(row);
		}
		item.show();
		$("#table").append(item);
		$(".lds-dual-ring").slideUp();
	}
}

function groups() {
	var groups = 'https://spreadsheets.google.com/feeds/list/1uTjpzxOZ5GNIKorAhHVzerRB4zbDhBvYIVtXF9T17-s/5/public/values?alt=json';
	var places = 'https://spreadsheets.google.com/feeds/list/1uTjpzxOZ5GNIKorAhHVzerRB4zbDhBvYIVtXF9T17-s/14/public/values?alt=json';
	var territories = 'https://spreadsheets.google.com/feeds/list/1uTjpzxOZ5GNIKorAhHVzerRB4zbDhBvYIVtXF9T17-s/10/public/values?alt=json';

	var groupsRequest = new XMLHttpRequest();
	groupsRequest.open('GET', groups);
	groupsRequest.onload = function() {

		var placesRequest = new XMLHttpRequest();
		placesRequest.open('GET', places);
		placesRequest.onload = function() {

			var territoriesRequest = new XMLHttpRequest();
			territoriesRequest.open('GET', territories);
			territoriesRequest.onload = function() {
				processData(groupsRequest, placesRequest, territoriesRequest);
			}
			territoriesRequest.send();
				
		}
		placesRequest.send();
		
	}
	groupsRequest.send();
}