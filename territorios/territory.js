// Defino MAP_TYPE antes de usarlo
var MAP_TYPE = {
  ORIGINAL: 1,
  FOCUSED: 2,
  HEAT_MAP: 3,
  CAMPAIGN: 7
};

var MAP_EXTRAS = {
  PLACES: 1,
  BLOCKS: 2
};

// Función rgb para generar color hexadecimal
function rgb(r, g, b) {
  const decColor = 0x1000000 + (Math.round(b)) + 0x100 * (Math.round(g)) + 0x10000 * (Math.round(r));
  return '#' + decColor.toString(16).substr(1);
}

// Defino mapTypes con funciones onClick que reciben opciones como parámetro para usarlo internamente
var mapTypes = {};

// Mapa ORIGINAL: muestra colores originales del territorio (desde KML)
mapTypes[MAP_TYPE.ORIGINAL] = {
  name: "Territorios",
  legendId: "#original-legend",
  colorProcessor: function(territory, options) {
    return territory.colors[MAP_TYPE.ORIGINAL] || rgb(180, 180, 180);
  },
  onClick: function(options) {
    showMap(options, MAP_TYPE.ORIGINAL);
  }
};

// Mapa FOCUSED: resalta solo el territorio seleccionado por parámetro "territorio"
mapTypes[MAP_TYPE.FOCUSED] = {
  name: "Asignado",
  legendId: "#original-legend",
  colorProcessor: function(territory, options) {
    if (options.params.territorio !== undefined && territory.name === options.params.territorio) {
      return territory.colors[MAP_TYPE.ORIGINAL] || rgb(0, 120, 215);
    }
    return rgb(180, 180, 180);
  },
  onClick: function(options) {
    showMap(options, MAP_TYPE.FOCUSED);
  }
};

// Mapa HEAT_MAP: usa color según fecha, más reciente = verde-azulado, más antiguo = rojo-azulado
mapTypes[MAP_TYPE.HEAT_MAP] = {
  name: "Frecuencia",
  legendId: "#heat-map-legend",
  colorProcessor: function(territory, options) {
    if (territory.date && !territory.isComplete) {
      return rgb(255, 200, 0);
    } else if (territory.date) {
      const minTime = options.minDate.getTime();
      const maxTime = options.maxDate.getTime();
      const currentTime = territory.date.getTime();
      if (maxTime === minTime) {
        return rgb(0, 255, 153);
      }
      let ratio = (currentTime - minTime) / (maxTime - minTime);
      ratio = Math.min(Math.max(ratio, 0), 1);
      const red = Math.round(255 * (1 - ratio));
      const blue = Math.round(255 * ratio);
      const green = 0;
      return rgb(red, green, blue);
    }
    return rgb(0, 0, 255);
  },
  onClick: function(options) {
    showMap(options, MAP_TYPE.HEAT_MAP);
  }
};

// Mapa CAMPAIGN: muestra colores según estado y accesibilidad
mapTypes[MAP_TYPE.CAMPAIGN] = {
  name: "Campaña",
  legendId: "#campaign-legend",
  colorProcessor: function(territory, options) {
    if (territory.date && !territory.isComplete) {
      return rgb(255, 255, 0);
    } else if (territory.inaccessible) {
      return rgb(0, 0, 0);
    } else if (territory.date) {
      return rgb(0, 255, 153);
    }
    return rgb(180, 180, 180);
  },
  onClick: function(options) {
    showMap(options, MAP_TYPE.CAMPAIGN);
  }
};

// Estilos del mapa
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
	description += "<br/><a target='_blank' href='" + territory.link2 + "'>Casa en casa</a>";
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

function kmlColorToRgba(kmlColor) {
  // kmlColor es string 8 caracteres, formato AABBGGRR
  if (!kmlColor || kmlColor.length !== 8) return 'rgba(0,0,0,0.3)'; // fallback
  const a = parseInt(kmlColor.substring(0, 2), 16) / 255;
  const b = parseInt(kmlColor.substring(2, 4), 16);
  const g = parseInt(kmlColor.substring(4, 6), 16);
  const r = parseInt(kmlColor.substring(6, 8), 16);
  return `rgba(${r},${g},${b},${a.toFixed(2)})`;
}

function hexToRgba(hex, alpha = 1) {
  // Elimina #
  hex = hex.replace(/^#/, '');
  if (hex.length !== 6) {
    //console.warn('Formato hex inválido:', hex);
    return `rgba(0,0,0,${alpha})`; // fallback
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function processPolygon(index, placemark, map, infoWindow, options, mapType) {
  if (placemark.polygon) {
    var territory = options.territories[placemark.name];
    if (territory !== undefined) {
      territory.description = placemark.description;

      if (mapType == MAP_TYPE.ORIGINAL) {
        const fillColorRgba = kmlColorToRgba(placemark.polygon.fillColor);
        const strokeColorRgba = kmlColorToRgba(placemark.polygon.strokeColor || placemark.polygon.fillColor);
        
        // Guardar color convertido
        territory.colors[mapType] = fillColorRgba;

        calculateGroupCoordinates(options, territory, placemark);

        placemark.polygon.setOptions({
          strokeColor: strokeColorRgba,
          strokeOpacity: 1,
          fillColor: fillColorRgba,
          fillOpacity: parseFloat(fillColorRgba.match(/rgba\(.*?,.*?,.*?,(.*?)\)/)?.[1]) || 0.5
        });
      } else {
        placemark.polygon.setOptions({
          strokeColor: 'rgb(180, 180, 180)',
          strokeOpacity: 1.0,
          fillColor: 'rgb(180, 180, 180)',
          fillOpacity: 1.0
        });
      }

      addTerritoryInfoWindow(infoWindow, placemark, options.territories, map);
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
		//console.log("maxDate = " + options.maxDate);
		//console.log("minDate = " + options.minDate);
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
  //console.log("fetchTerritoriesKMZ")
	var geoXmlLayer = new geoXML3.parser({
        map: map,
        singleInfoWindow: true,
		suppressInfoWindows: true,
        afterParse: function afterParse(doc) {
          //console.log("KML parsed", doc);
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
  const icon = placemark.style?.icon;
  let iconHref = icon?.href;

  // 🔧 Corrige ruta del icono si es relativa
  if (iconHref && !iconHref.startsWith('http')) {
    if (options.basePathForExtras) {
      iconHref = options.basePathForExtras + '/' + iconHref;
    }
  }

  // Obtener posición correctamente como LatLng
  let position = null;
  const coords = placemark.Point.coordinates[0];
  if (coords instanceof google.maps.LatLng) {
    position = coords;
  } else if (Array.isArray(coords)) {
    // coords = [lng, lat, alt] en KML/geoXML3
    position = new google.maps.LatLng(coords[1], coords[0]);
  } else if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
    position = new google.maps.LatLng(coords.lat, coords.lng);
  } else {
    //console.warn('Formato inesperado de coordenadas:', coords);
    // fallback a (0,0) para evitar error
    position = new google.maps.LatLng(0, 0);
  }

  const marker = new google.maps.Marker({
    map: map,
    title: placemark.name,
    position: position,
    icon: iconHref
      ? {
          url: iconHref,
          scaledSize: new google.maps.Size(24, 24),
          anchor: icon.hotSpot
            ? new google.maps.Point(icon.hotSpot.x, icon.hotSpot.y)
            : new google.maps.Point(12, 12)
        }
      : undefined
  });

  if (contentProcessor != null) {
    addInfoWindow(map, marker, infoWindow, position, placemark.name, contentProcessor(placemark));
  }

  const label = new MapLabel({
    text: placemark.name,
    position: position,
    map: map,
    fontSize: 11,
    fontColor: "#333",
    align: 'right',
    minZoom: 16
  });

  options.extrasMarkers.push(marker);
  options.extrasBlocks.push(label);

  return marker;
}

function createMarkerLugares(map, options, placemark, doc, infoWindow, contentProcessor) {
  options.basePathForExtras = 'lugares/images';
  return createMarker(map, options, placemark, doc, infoWindow, contentProcessor);
}

function createMarkerWithBasePath(basePath) {
  return function(map, options, placemark, doc, infoWindow, contentProcessor) {
    const originalBasePath = options.basePathForExtras;
    options.basePathForExtras = basePath;
    const marker = createMarker(map, options, placemark, doc, infoWindow, contentProcessor);
    options.basePathForExtras = originalBasePath;
    return marker;
  }
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
  //console.log("Fetch Extra Kmz ", url)
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

function makeSheetCall(sheetName) {
  var url = `https://docs.google.com/spreadsheets/d/1uTjpzxOZ5GNIKorAhHVzerRB4zbDhBvYIVtXF9T17-s/gviz/tq?tqx=out:json&sheet=${sheetName}`;

  return new Promise(function(resolve, reject) {
    $.ajax({
      url: url,
      dataType: "text",
      success: function(responseText) {
        try {
          var jsonMatch = responseText.match(/google\.visualization\.Query\.setResponse\((.*)\)/s);
          if (!jsonMatch || jsonMatch.length < 2) {
            reject(new Error("Formato de respuesta inesperado"));
            return;
          }
          var jsonStr = jsonMatch[1];
          var data = JSON.parse(jsonStr);
          //console.log(`[makeSheetCall] Datos parseados para sheet "${sheetName}":`, data);
          resolve(data);
        } catch (error) {
          //console.error("[makeSheetCall] Error al parsear respuesta:", error);
          reject(error);
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        //console.error("[makeSheetCall] Error en la petición AJAX:", textStatus, errorThrown);
        reject(errorThrown || textStatus);
      }
    });
  });
}

function parseDate(dateStr) {
  if (!dateStr) return null;

  // dateStr esperado: "Date(2025,3,26)"
  var match = dateStr.match(/^Date\((\d+),(\d+),(\d+)\)$/);
  if (!match) return null;

  var year = parseInt(match[1], 10);
  var month = parseInt(match[2], 10); // ojo, JS usa meses base 0, pero aquí ya viene así?
  var day = parseInt(match[3], 10);

  // En JS, los meses van de 0 a 11, pero el dato parece ya en base 0? (abril es 3)
  // En la fecha 2025,3,26 el mes 3 es abril (mes 4 en humano), entonces NO restamos 1
  // Por lo tanto:
  return new Date(year, month, day);
}

function fetchSheetData(map, options, infoWindow) {
  makeSheetCall("territorios")
    .then(function(data) {
      //console.log("[fetchSheetData] data:", data);

      if (!data.table || !data.table.rows) {
        //console.error("[fetchSheetData] Formato inesperado en datos");
        return;
      }

      data.table.rows.forEach(function(row) {
        var c = row.c;

        options.territories[c[0]?.v] = {
          name: c[0]?.v,
          date: parseDate(c[2]?.v),
          dateStr: c[2]?.v || "",
          isComplete: c[3]?.v === true || c[3]?.v === "TRUE",
          blocks: c[4]?.v,
          notes: c[5]?.v,
          link: c[6]?.v,
          link2: c[129]?.v || "",
          colors: {}
        };
      });

      //console.log("[fetchSheetData] Territories cargados:", options.territories);

      showLegend(options.mapShown);
    })
    .catch(function(error) {
      //console.error("[fetchSheetData] Error al cargar datos:", error);
    });
}

function showLegend(mapType) {
	$(".legend-type").hide();
	var legend = $(mapTypes[mapType].legendId);
	legend.show();
}

function showMap(options, mapType) {
  // Ocultar la capa actual solo si existe
  if (options.layers[options.mapShown]) {
    if (options.docs[options.mapShown]) {
      options.layers[options.mapShown].hideDocument(options.docs[options.mapShown]);
    }
  }

  // Mostrar la nueva capa solo si existe
  if (options.layers[mapType]) {
    if (options.docs[mapType]) {
      options.layers[mapType].showDocument(options.docs[mapType]);
    }
  }

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
				//console.log("Location error: " + errorMessage);
			});
		} else {
			//console.log("Location error: unsupported.");
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

function initMap() {
  //console.log("initMap ejecutado");

  var options = {
    alreadyRun: false,
    mapShown: MAP_TYPE.ORIGINAL,
    layers : {},
    docs: {},
    extraLayers: {},
    extraDocs: {},
    territories: {},
    groups: {},
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

  var map = new google.maps.Map(document.getElementById("map-canvas"), {
    center: { lat: -34.9, lng: -56.2 },
    zoom: 12,
    styles: mapStyles,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
      mapTypeIds: ['roadmap', 'hybrid']
    }
  });

  // Colocar controles y leyendas en el mapa
  map.controls[google.maps.ControlPosition.LEFT_TOP].push($("#legend-box")[0]);
  $.each($(".map-control"), function(index, control) {
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(control);
    $(control).css("z-index", 1);
  });
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($("#show-location").hide()[0]);

  var infoWindow = new google.maps.InfoWindow();

  // Procesar parámetros URL para filtro o selección de mapa
  loadMapType(options);

  // Cargar datos desde Google Sheets y guardar en options.territories
  fetchSheetData(map, options, infoWindow);

  // Mostrar la leyenda para el mapa seleccionado inicialmente
  showLegend(options.mapShown);

  // Cargar y mostrar el KML con territorios
  options.mapShown = MAP_TYPE.ORIGINAL;

  fetchTerritoriesKmz(map, infoWindow, options, options.mapShown);

  fetchExtraKmz("lugares/doc.kml", map, infoWindow, options, MAP_EXTRAS.PLACES, createPlaceContent, null, createMarkerWithBasePath("lugares/"));
  fetchExtraKmz("manzanas/doc.kml", map, infoWindow, options, MAP_EXTRAS.BLOCKS, null, null, createMarker);



  // Cerrar infoWindow al click en mapa y ocultar combos
  google.maps.event.addListener(map, "click", function () {
    infoWindow.close();
    $(".combo-options").hide();
  });

  // Agregar controles y botones
  addMapTypeOptions(options);
  addShowExtrasToggle(map, options, infoWindow);
  addShowLegendToggle(map, options);
  addShowAllToggle(map, options);
  addShowLocation(map, options);

  // Ajustes visuales para capas y filtros
  fixOverlays();
  turnOnGrayscale();

  google.maps.event.addListener(map, 'maptypeid_changed', function () {
    turnOnGrayscale();
  });
  google.maps.event.addListener(map, 'zoom_changed', function () {
    turnOnGrayscale();
  });

  // Zoom a grupo al hacer click en la leyenda
  $("#original-legend .legend-row").click(function () {
    var group = $(this).find(".legend-title").text().split(" ")[1];
    var bounds = options.groups[group];
    if(bounds) {
      map.fitBounds(bounds);
    }
  });
}
