function fill(item, selector, content, link) {
    var field = item.find(selector);

    if (content == null || content.length == 0) {
        field.hide();
        return;
    }

    if (link === undefined || link == null) {
        field.find(".value").text(content);
        return;
    }

    field.find(".value")
        .text("")
        .append(
            $("<a>")
                .attr("target", "_blank")
                .attr("href", link)
                .text(content)
        );
}

function addDoNotCalls(territoriesData, territory, link, doNotCallField) {
    var hasDoNotCalls = false;
    var doNotCall = findTerritoryDoNotCall(territoriesData, territory);
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
        $.each(addressList, function (key, value) {
            var url = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(value);
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

// NUEVA VERSIÓN: fillAssignments recibe isZoom para decidir el link
function fillAssignments(item, assignments, territoriesData, isZoom) {
    var assignmentsField = item.find(".assignments");
    var doNotCallField = item.find(".do-not-call");

    if (assignments.length > 0) {
        var element = assignmentsField.find(".value").empty();
        var hasDoNotCalls = false;

        assignments.forEach(function (territory) {
            var driveLink = findTerritoryDrive(territoriesData, territory);

            var finalLink = null;
            
            // Lógica inteligente de redirección
            if (isZoom) {
                // Si es Zoom, usamos el link de Drive (Teléfonos)
                finalLink = driveLink;
            } else {
                // Si es presencial, mandamos al mapa interno
                finalLink = "territorios/mapa.html?territorio=" + territory;
            }

            var linkEl = null;
            if (finalLink) {
                linkEl = $("<a>")
                    .attr("href", finalLink)
                    .attr("target", "_blank")
                    .text(territory)
                    .appendTo(element);
            } else {
                linkEl = $("<span>")
                    .text(territory)
                    .appendTo(element);
            }

            element.append(" ");

            hasDoNotCalls = addDoNotCalls(territoriesData, territory, linkEl, doNotCallField) || hasDoNotCalls;
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
    for (var i in data.table.rows) {
        if (data.table.rows[i].c[0] && data.table.rows[i].c[0].v == place) {
            return data.table.rows[i].c[1] ? data.table.rows[i].c[1].v : null;
        }
    }
    return null;
}

function findAssignment(data) {
    if (!data) return [];
    return data.split(",").map(s => s.trim()).filter(s => s.length > 0);
}

function findTerritoryDoNotCall(data, territory) {
    for (var i in data.table.rows) {
        if (data.table.rows[i].c[0] && data.table.rows[i].c[0].v == territory) {
            return data.table.rows[i].c[1] ? data.table.rows[i].c[1].v : '';
        }
    }
    return '';
}

function findTerritoryDrive(data, territory) {
    for (var i in data.table.rows) {
        var row = data.table.rows[i].c;
        if (row[0] && row[0].v == territory) {
            return row[6] ? row[6].v : '';
        }
    }
    return '';
}

function parseGoogleDate(dateString) {
    if (!dateString) return null;
    var matches = dateString.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
    if (!matches) return null;
    var year = parseInt(matches[1], 10);
    var month = parseInt(matches[2], 10);
    var day = parseInt(matches[3], 10);
    var hour = matches[4] ? parseInt(matches[4], 10) : 0;
    var minute = matches[5] ? parseInt(matches[5], 10) : 0;
    var second = matches[6] ? parseInt(matches[6], 10) : 0;
    return new Date(year, month, day, hour, minute, second);
}

function processData(groupsData, placesData, territoriesData) {
    var template = $("#table .event").first();
    if (!template.length) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var formattedGroupsData = {};

    for (var i = 0; i < groupsData.table.rows.length; i++) {
        var entry = groupsData.table.rows[i].c;
        var rawDate = entry[0]?.v || entry[0]?.f || null;
        var date = typeof rawDate === "string" && rawDate.startsWith("Date(")
        ? parseGoogleDate(rawDate)
        : new Date(rawDate);

        if (!date || date < today) continue;

        var dayKey = date.toISOString().split("T")[0];
        if (!formattedGroupsData[dayKey]) {
            formattedGroupsData[dayKey] = [];
        }
        formattedGroupsData[dayKey].push({
            hour: entry[2]?.f || entry[2]?.v || "",
            conductor: entry[4]?.v || "",
            auxiliar: entry[5]?.v || "",
            place: entry[3]?.v || "",
            notes: entry[6]?.v || "",
            assignments: findAssignment(entry[9]?.v || "")
        });
    }

    for (var day in formattedGroupsData) {
        var parts = day.split("-");
        var date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        var item = template.clone();
        item.show();

        item.find(".day .number .value").text(date.getDate());
        item.find(".day .date .value").text(date.toLocaleString('es', { weekday: 'long' }).replace(/^./, s => s.toUpperCase()));

        var times = formattedGroupsData[day];
        var templateRow = item.find(".row").clone();
        item.find(".row").remove();

        times.forEach(function (time) {
            var row = templateRow.clone();

            row.find(".time .value").text(time.hour);
            var placeField = row.find(".place .value");
            placeField.empty();

            // Detectamos si es Zoom
            var isZoom = /ID:\s?(\d{3,})/i.test(time.place);

            if (isZoom) {
                const match = time.place.match(/ID:\s?([\d\s]+)/i);
                const rawID = match[1].replace(/\s+/g, "");
                const zoomURL = `https://zoom.us/j/${rawID}`;

                placeField.append(
                    $("<a>")
                        .attr("href", zoomURL)
                        .attr("target", "_blank")
                        .text(match[0])
                );

                const rest = time.place.replace(match[0], "").trim();
                if (rest.length > 0) {
                    placeField.append(" " + rest);
                }
            } else {
                placeField.text(time.place);
            }
            
            row.find(".cond .value").text(time.conductor);
            row.find(".aux .value").text(time.auxiliar);
            row.find(".notes .value").text(time.notes);

            // Pasamos isZoom a la función de asignaciones
            fillAssignments(row, time.assignments, territoriesData, isZoom);
            item.find(".rows").append(row);
        });

        $("#table").append(item);
    }

    $(".lds-dual-ring").slideUp();
}

function groups() {
    var groupsUrl = 'https://docs.google.com/spreadsheets/d/1uTjpzxOZ5GNIKorAhHVzerRB4zbDhBvYIVtXF9T17-s/gviz/tq?tqx=out:json&sheet=json';
    var placesUrl = 'https://docs.google.com/spreadsheets/d/1uTjpzxOZ5GNIKorAhHVzerRB4zbDhBvYIVtXF9T17-s/gviz/tq?tqx=out:json&sheet=lugares_json';
    var territoriesUrl = 'https://docs.google.com/spreadsheets/d/1uTjpzxOZ5GNIKorAhHVzerRB4zbDhBvYIVtXF9T17-s/gviz/tq?tqx=out:json&sheet=territorios';

    $(".lds-dual-ring").show();

    var groupsRequest = $.get(groupsUrl);
    var placesRequest = $.get(placesUrl);
    var territoriesRequest = $.get(territoriesUrl);

    $.when(groupsRequest, placesRequest, territoriesRequest)
        .done(function (groupsRes, placesRes, territoriesRes) {
            try {
                var groupsData = JSON.parse(groupsRes[0].substring(groupsRes[0].indexOf('(') + 1, groupsRes[0].lastIndexOf(')')));
                var placesData = JSON.parse(placesRes[0].substring(placesRes[0].indexOf('(') + 1, placesRes[0].lastIndexOf(')')));
                var territoriesData = JSON.parse(territoriesRes[0].substring(territoriesRes[0].indexOf('(') + 1, territoriesRes[0].lastIndexOf(')')));
                
                $("#table").find(".event").not(":first").remove();
                $(".lds-dual-ring").hide();

                processData(groupsData, placesData, territoriesData);
            } catch (e) {
                console.error("Error:", e);
                $(".lds-dual-ring").hide();
            }
        })
        .fail(function () {
            $(".lds-dual-ring").hide();
            alert("Error al cargar los datos.");
        });
}
