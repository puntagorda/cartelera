var MAP_TYPE = {
	ORIGINAL: 1,
	FOCUSED: 2,
	HEAT_MAP: 3,
	// AVERAGE: 4,
	// PHONE: 5,
	// LETTER: 6,
	CAMPAIGN: 7
};

var MAP_EXTRAS = {
	PLACES: 1,
	BLOCKS: 2
};

var mapTypes = {};
mapTypes[MAP_TYPE.ORIGINAL] = {
	name: "Territorios",
	legendId: "#original-legend",
	onClick: function() {
		showMap(options, MAP_TYPE.ORIGINAL);
	}
};

mapTypes[MAP_TYPE.FOCUSED] = {
	name: "Asignado",
	legendId: "#original-legend",
	colorProcessor: function(territory, options) {
		if (options.params.territorio !== undefined && 
			territory.name == options.params.territorio) {
			return territory.colors[1];
		}
		return rgb(180, 180, 180);
	},
	onClick: function() {
		showMap(options, MAP_TYPE.ORIGINAL);
	}
};

mapTypes[MAP_TYPE.HEAT_MAP] = {
	name: "Frecuencia",
	legendId: "#heat-map-legend",
	colorProcessor: function(territory, options) {
		if (territory.date != "" && !territory.isComplete) {
			//In progress
			return rgb(255, 200, 0);
		} else {
			if (territory.date != "") {
				var percentage = (territory.date.getTime() - options.minDate.getTime()) / (options.maxDate.getTime() - options.minDate.getTime());
				percentage = percentage.toFixed(1);
				var red = 255 * percentage;
				var blue = 255 * (1 - percentage);
				var colorString = rgb(red, 0, blue);
				console.log(territory.name + ": " + (percentage * 100) + "% " + colorString);
				return colorString;
			}
			return rgb(0, 0, 255);
		}
	},
	onClick: function() {
		showMap(options, MAP_TYPE.HEAT_MAP);
	}
};
/*
mapTypes[MAP_TYPE.AVERAGE] = {
	name: "Promedio",
	legendId: "#heat-map-legend",
	colorProcessor: function (territory, options) {
		var dark = rgb(255, 0, 0);
		var minLight = 48;
		var maxLight = 255;
		if (territory.average != "") {
			var percentage = (territory.average - options.minAverage) / (options.maxAverage - options.minAverage);
			percentage = 1 - percentage.toFixed(1);
			var tone = minLight + (maxLight - minLight) * percentage;
			var colorString = rgb(maxLight, tone, 0);
			// console.log(territory.name + ": " + (percentage * 100) + "% " + colorString);
			return colorString;
		}
		return dark;
	},
	onClick: function() {
		showMap(options, MAP_TYPE.AVERAGE);
	}
};

mapTypes[MAP_TYPE.PHONE] = {
	name: "Telefónica",
	legendId: "#campaign-legend",
	colorProcessor: function(territory, options) {
		if (territory.phone !== undefined) {
			return rgb(255, 255, 0);
		} else {
			return rgb(255, 255, 255);
		}
	},
	onClick: function() {
		showMap(options, MAP_TYPE.PHONE);
	}
};
mapTypes[MAP_TYPE.LETTER] = {
	name: "Cartas",
	legendId: "#campaign-legend",
	colorProcessor: function(territory, options) {
		if (territory.letter !== undefined) {
			return rgb(0, 255, 153);
		}
		return rgb(255, 255, 255);
	},
	onClick: function() {
		showMap(options, MAP_TYPE.LETTER);
	}
};
*/

mapTypes[MAP_TYPE.CAMPAIGN] = {
	name: "Campaña",
	legendId: "#campaign-legend",
	colorProcessor: function(territory, options) {
		if (territory.date != "" && !territory.isComplete) {
			return rgb(255, 255, 0);
		} else if (territory.inaccessible) {
			return rgb(0, 0, 0);
		} else {
			if (territory.date != "") {
				return rgb(0, 255, 153);
			}
			return rgb(180, 180, 180);
		}
	},
	onClick: function() {
		showMap(options, MAP_TYPE.CAMPAIGN);
	}
};


var mapStyles = [
  {
    "featureType": "administrative",
    "stylers": [{
        "visibility": "off"
    }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.icon",
    "stylers": [{
        "visibility": "off"
    }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text",
    "stylers": [{
        "visibility": "off"
    }]
  },
  {
    "featureType": "transit",
    "stylers": [{
        "visibility": "off"
    }]
  }
];

function rgb(red, green, blue) {
    var decColor = 0x1000000 + Math.round(blue) + 0x100 * Math.round(green) + 0x10000 * Math.round(red);
    return '#' + decColor.toString(16).substr(1);
}

function addTerritoryLabel(placemark, map) {
	new MapLabel({
		text: placemark.name,
		position: placemark.polygon.bounds.getCenter(),
		map: map,
		fontSize: 16,
		fontColor: rgb(0, 0, 0),// placemark.polygon.fillColor,
		align: 'right',
		minZoom: 15
	});
}

function addTerritoryLabels(geoXmlDoc, map, options) {
	options.maxDate = new Date();
	$.each(geoXmlDoc.placemarks, function (index, placemark) {
		if (placemark.polygon) {
			addTerritoryLabel(placemark, map);
			var territory = options.territories[placemark.name];
			if (territory !== undefined) {
				if (territory.date != "") {
					if (options.minDate.getTime() > territory.date.getTime()) {
						options.minDate = territory.date;
					}
					// if (options.maxDate.getTime() < territory.date.getTime()) {
					//	options.maxDate = territory.date;
					// }
				}
				if (territory.average != "") {
					if (options.minAverage > territory.average) {
						options.minAverage = territory.average;
					}
					if (options.maxAverage < territory.average) {
						options.maxAverage = territory.average;
					}
				}
			}
		}
	});
}

function addContent(content, title, description) {
	if (description != "") {
		if (content != "") {
			content += "<br/>";
		}
		content += "<b>" + title + "</b> " + description;
	}
	return content;
}

function addInfoWindow(map, element, infoWindow, position, title, description) {
	google.maps.event.addListener(element, "click", function (e) {
		var content = "<h3>" + title + "</h3>" + description;
		infoWindow.setOptions({
			position: position,
			content: content
		});
		infoWindow.open(map, element);
	});	
}

function addTerritoryInfoWindow(infoWindow, placemark, territories, map) {
	var territory = territories[placemark.name];
	var title = "Territorio " + placemark.name;
	var description = "";
	var dateLabel = "";
	if (territory.isComplete) {
		dateLabel = "Terminado";
	} else {
		dateLabel = "Comenzado";
	}
	description = addContent(description, dateLabel, territory.dateStr);
	// description = addContent(description, "Completado", territory.isComplete ? "Sí" : "No");
	description = addContent(description, "Manzanas hechas", territory.blocks);
	// description = addContent(description, "Notas", territory.notes);
	description += "<br/><a target='_blank' href='" + territory.link + "'>Teléfonos</a>";
	addInfoWindow(map, placemark.polygon, infoWindow, placemark.polygon.bounds.getCenter(), title, description);
}

function calculateGroupCoordinates(options, territory, placemark) {
	var bounds = options.groups[territory.group];
	if (bounds === undefined) {
		bounds = new google.maps.LatLngBounds();
	}
	var coordinates = placemark.Polygon[0].outerBoundaryIs[0].coordinates;
	$.each(coordinates, function(index, coordinate) {
		bounds.extend(coordinate);
	});
	options.groups[territory.group] = bounds;
}

function processPolygon(index, placemark, map, infoWindow, options, mapType) {
	if (placemark.polygon) {
		var territory = options.territories[placemark.name];
		if (territory !== undefined) {
			territory.description = placemark.description;
			if (mapType == MAP_TYPE.ORIGINAL) {
				territory.colors[mapType] = placemark.polygon.fillColor;
				calculateGroupCoordinates(options, territory, placemark);
			} else {
				territory.colors[mapType] = mapTypes[mapType].colorProcessor(territory, options);
			}
			placemark.polygon.strokeColor = territory.colors[mapType];
			placemark.polygon.fillColor = territory.colors[mapType];
			addTerritoryInfoWindow(infoWindow, placemark, options.territories, map);
		} else {
			placemark.polygon.strokeColor = rgb(180, 180, 180);
			placemark.polygon.fillColor = rgb(180, 180, 180);
		}
	}
}

function findTerritory(geoXmlDoc, territory) {
  for (var i = 0, len = geoXmlDoc.placemarks.length; i < len; i++) {
  		if (geoXmlDoc.placemarks[i].name == territory) {
	      return geoXmlDoc.placemarks[i];
    	}
    }
    return null;
}

function focusTerritory(geoXmlDoc, map, options) {
	var territory = options.params.territorio;
	if (territory !== undefined) {
		var placemark = findTerritory(geoXmlDoc, territory);
		var bounds = new google.maps.LatLngBounds();
		var coordinates = placemark.Polygon[0].outerBoundaryIs[0].coordinates;
		$.each(coordinates, function(index, coordinate) {
			bounds.extend(coordinate);
		});
		google.maps.event.addListenerOnce(map, 'idle', function() {
		    map.fitBounds(bounds);
			google.maps.event.trigger(placemark.polygon, 'click');
		});
	}
}

function processTerritories(doc, map, infoWindow, options, mapType) {
    var geoXmlDoc = doc[0];
	if (!options.alreadyRun) {
		addTerritoryLabels(geoXmlDoc, map, options);
		console.log("maxDate = " + options.maxDate);
		console.log("minDate = " + options.minDate);
		// console.log("maxAverage = " + options.maxAverage + "; minAverage = " + options.minAverage);
	}
	options.docs[mapType] = geoXmlDoc;

	$.each(geoXmlDoc.placemarks, function(index, placemark) {
		processPolygon(index, placemark, map, infoWindow, options, mapType);
	});
	if (mapType == options.mapShown) {
		focusTerritory(geoXmlDoc, map, options);
	} else {
		options.layers[mapType].hideDocument(options.docs[mapType]);
	}
	options.alreadyRun = true;
}

function fetchTerritoriesKmz(map, infoWindow, options, mapType) {
	var geoXmlLayer = new geoXML3.parser({
        map: map,
        singleInfoWindow: true,
		suppressInfoWindows: true,
        afterParse: function afterParse(doc) {
            processTerritories(doc, map, infoWindow, options, mapType);
			$("#show-location").show();
        }
    });
    geoXmlLayer.parse('territories.kml');
	options.layers[mapType] = geoXmlLayer;
}

function createPlaceContent(placemark) {
	var descriptionStr = "";
	var descriptionItems = placemark.description.split("<br>");
	$.each(descriptionItems, function(index, descriptionItem) {
		var descriptionArray = descriptionItem.split(": ");
		descriptionStr = addContent(descriptionStr, descriptionArray[0], descriptionArray[1]);
	});
	return descriptionStr;
}

function createMarker(map, options, placemark, doc, infoWindow, contentProcessor) {
	placemark.style.icon.scaledSize = new google.maps.Size(24, 24);
	
	var marker = new google.maps.Marker({
	    map: map,
	    title: placemark.name,
	    position: placemark.Point.coordinates[0],
		icon: placemark.style.icon
	});
	
	if (contentProcessor != null) {
		addInfoWindow(map, marker, infoWindow, placemark.Point.coordinates[0], placemark.name, contentProcessor(placemark));
	}
	
	options.extrasMarkers.push(marker);
    return marker;
}

function addBlockLabel(map, options, placemark) {
	var coordinates = placemark.Point.coordinates[0];
	var label = new MapLabel({
		text: placemark.name,
		position: new google.maps.LatLng(coordinates.lat, coordinates.lng),
		map: map,
		fontSize: 11,
		fontColor: "#777777",
		align: 'right',
		minZoom: 16
	});
	options.extrasBlocks.push(label);
}

function processBlocks(map, options, doc) {
	$.each(doc[0].placemarks, function(index, placemark) {
		addBlockLabel(map, options, placemark);
	})
}

function fetchExtraKmz(url, map, infoWindow, options, extraType, contentProcessor, afterParse, createMarker) {
	var geoXmlLayer = new geoXML3.parser({
        map: map,
        singleInfoWindow: true,
		suppressInfoWindows: true,
		createMarker: function(placemark, doc) {
			if (createMarker != null) {
				createMarker(map, options, placemark, doc, infoWindow, contentProcessor);
			}
		},
        afterParse: function (doc) {
			options.extraDocs[extraType] = doc[0];
			if (afterParse != null) {
				afterParse(map, options, doc);
			}
		}
    });
    geoXmlLayer.parse(url);
	options.extraLayers[extraType] = geoXmlLayer;
}

function parseDate(dateString) {
	if (dateString != "") {
		var dateArray = dateString.split("/");
		var date = new Date(parseInt("20" + dateArray[2]), parseInt(dateArray[1]) - 1, parseInt(dateArray[0]));
		return date;
	}
	return dateString;
}

function makeSheetCall(sheetId) {
	var url = "https://sheets.googleapis.com/v4/spreadsheets/1uTjpzxOZ5GNIKorAhHVzerRB4zbDhBvYIVtXF9T17-s/values/" + sheetId + "?key=AIzaSyDeLzgtsrTNxNrXFe7H-RxBwg8CY30X4Lk";
	return $.ajax({ 
	  dataType: "json",
	  url: url,
	  async: true,
	  success: function(result) {}                     
	});
}

function fetchSheetData(map, options, infoWindow) {
	var sheets = {
		territoriesId: "territorios"
	}
	var calls = [];
	$.each(sheets, function(index, sheet) {
		calls.push(makeSheetCall(sheet));
	})

	$.when(calls[0])
		.done(function(territoriesResponse) {
			$.each(territoriesResponse.values, function(i, val) {
				options.territories[val[0]] = {
					name: val[0],
					date: parseDate(val[2]),
					dateStr: val[2],
					isComplete: val[3] == "TRUE",
					blocks: val[4],
					notes: val[5],
					link: val[6],
					colors: {}
				};
			});
		
		fetchExtraKmz(
			'lugares/doc.kml', map, infoWindow, options, MAP_EXTRAS.PLACES, createPlaceContent, null, createMarker
		);
		
		fetchExtraKmz(
			'manzanas/doc.kml', map, infoWindow, options, MAP_EXTRAS.BLOCKS, null, processBlocks, null
		);
		
		$.each(MAP_TYPE, function(index, mapType){
			fetchTerritoriesKmz(map, infoWindow, options, mapType);
		});
		
	});
	
}

function showLegend(mapType) {
	$(".legend-type").hide();
	var legend = $(mapTypes[mapType].legendId);
	legend.show();
}

function showMap(options, mapType) {
	options.layers[options.mapShown].hideDocument(options.docs[options.mapShown]);
	options.layers[options.mapShown].showDocument(options.docs[mapType]);
	options.mapShown = mapType;
	showLegend(mapType);
}

function addShowExtrasToggle(map, options, infoWindow) {
	$("#show-extras-btn").click(function() {
		options.extrasShown = !options.extrasShown;
		//$.each(options.extrasBlocks, function (index, block) {
		//	block.setMap(options.extrasShown ? map : null);
		//});
		$.each(options.extrasMarkers, function (index, marker) {
			marker.setVisible(options.extrasShown);
		});
		infoWindow.close();
		$(".gmnoprint, .gm-style-cc, .widget-my-location, .map-control, #legend-box").hide();
		$(this).toggleClass("selected");
	});
}

function addShowLegendToggle(map, options) {
	$("#show-legend-btn").click(function() {
		if (options.legendShown) {
			$("#legend-box").hide();
		} else {
			$("#legend-box").show();
		}
		options.legendShown = !options.legendShown;
		$(this).toggleClass("selected");
	});
}

function addShowAllToggle(map, options) {
	$("#show-all-btn").click(function() {
		options.allShown = !options.allShown;
		//$.each(options.extrasBlocks, function (index, block) {
		//	block.setMap(options.extrasShown ? map : null);
		//});
		//$.each(options.extrasMarkers, function (index, marker) {
		//	marker.setVisible(options.extrasShown);
		//});
		$(this).toggleClass("selected");
	});
}

function addMapTypeOptions(options) {
	var comboOptions = $(".combo-options");	
	$.each(mapTypes, function(index, mapType) {
		var option = $("<div>")
			.addClass("combo-item")
			.text(mapType.name)
			.appendTo(comboOptions);
		if (index == options.mapShown) {
			option.addClass("selected")
		}
		option.click(function() {
			$("#map-type-combo .combo-value").text(mapType.name);
			$(".combo-item").removeClass("selected");
			$(this).addClass("selected");
			showMap(options, index);
			comboOptions.hide();
		});
	});
	var comboChooser = $("#map-type-combo").click(function(){
		comboOptions.toggle();
	});
}

function addShowLocation(map, options) {
	$("#show-location-btn").click(function(){
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				var pos = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				};
	
				if (options.locationMarker !== undefined) {
					options.locationMarker.setMap(null);
				}
				options.locationMarker = new google.maps.Marker({
					map: map,
					title: "Estás aquí",
					position: pos,
					animation: google.maps.Animation.DROP
				});
					
				map.setCenter(pos);
				map.setZoom(17);
			}, function(error) {
				var errorMessage;
				switch(error.code) {
			        case error.PERMISSION_DENIED:
			            errorMessage = "Permission denied."
			            break;
			        case error.POSITION_UNAVAILABLE:
			            errorMessage = "Position unavailable."
			            break;
			        case error.TIMEOUT:
			            errorMessage = "Time out."
			            break;
			        case error.UNKNOWN_ERROR:
			            errorMessage = "Unknown."
			            break;
			    }
				console.log("Location error: " + errorMessage);
			});
		} else {
			console.log("Location error: unsupported.");
		}
	});
}

function processParams() {
	var params = {}; 
	location.search.substring(1).replace(/([^=&]+)=([^&]*)/g, function(m, key, value) {
	    params[decodeURIComponent(key)] = decodeURIComponent(value);
	});
	return params;
}

function findMapType(paramMapType) {
	var result = -1;
	$.each(mapTypes, function(index, mapType) {
		if (mapType.name.toLowerCase() == paramMapType.toLowerCase()) {
			result = index;
			return false;
		}
	});
	return result;
}

function loadMapType(options) {
	options.params = processParams();
	var paramMapType = options.params.mapa;
	if (options.params.territorio !== undefined) {
		paramMapType = 'Asignado';
		$("#show-all-btn").show();
	}
	if (paramMapType !== undefined) {
		var mapType = findMapType(paramMapType);
		if (mapType > 0) {
			options.mapShown = mapType;
			$("#map-type-combo .combo-value").text(mapTypes[mapType].name);
		}
	}
}

function turnOnGrayscale() {
	setTimeout(function() {
		$('.gm-style > div:first-child > div:first-child > div[style*="z-index: 0"')
			.css("-webkit-filter", "grayscale(100%)");
	}, 300);
}

function fixOverlays() {
	setTimeout(function() {
		$(".gm-style > div:first-child > div:first-child > div:first-child")
			.css("z-index", 104);
	}, 300);
}

jQuery(document).ready(function () {
	
	var options = {
		alreadyRun: false,
		mapShown: MAP_TYPE.ORIGINAL,
		layers : {},
		docs: {},
		extraLayers: {},
		extraDocs: {},
		territories: [],
		groups: [],
		minDate: new Date(),
		maxDate: new Date(2010, 1, 1), 
		minAverage: 999,
		maxAverage: -1,
		extrasShown: true,
		legendShown: false,
		allShown: true,
		extrasMarkers: [],
		extrasBlocks: [],
		params: {}
	};

    var map = new google.maps.Map($("#map-canvas")[0], {
		styles: mapStyles,
		mapTypeControlOptions: {
			style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
			mapTypeIds: ['roadmap', 'hybrid']
		}
    });
	
	map.controls[google.maps.ControlPosition.LEFT_TOP].push($("#legend-box")[0]);
	$.each($(".map-control"), function(index, control) {
	    map.controls[google.maps.ControlPosition.TOP_LEFT].push(control);
		$(control).css("z-index", 1);
	});	
	map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($("#show-location").hide()[0]);
	
	var infoWindow = new google.maps.InfoWindow();
	loadMapType(options);
	fetchSheetData(map, options, infoWindow);
	showLegend(options.mapShown);
	
	google.maps.event.addListener(map, "click", function (e) {
		infoWindow.close();
		$(".combo-options").hide();
	});

	addMapTypeOptions(options);
	addShowExtrasToggle(map, options, infoWindow);
	addShowLegendToggle(map, options);
	addShowAllToggle(map, options);
	addShowLocation(map, options);
	
	fixOverlays();
	turnOnGrayscale();
	google.maps.event.addListener(map, 'maptypeid_changed', function() { 
		turnOnGrayscale();
	});
	google.maps.event.addListener(map, 'zoom_changed', function() { 
		turnOnGrayscale();
	});
	
	$("#original-legend .legend-row").click(function() {
		var group = $(this).find(".legend-title").text().split(" ")[1];
		var bounds = options.groups[group];
		map.fitBounds(bounds);
	});
});