function processParams() {
	var params = {}; 
	location.search.substring(1).replace(/([^=&]+)=([^&]*)/g, function(m, key, value) {
	    params[decodeURIComponent(key)] = decodeURIComponent(value);
	});
	return params;
}

function loadPublishers() {

	var url = 'https://spreadsheets.google.com/feeds/list/1nao8zPNoLtF4uvZjScex3CQlUV7Je6McBIEernhYa3g/6/public/values?alt=json';
	var formattedData = {};
	var params = processParams();
	
	var request = new XMLHttpRequest();
	request.open('GET', url);
	request.onload = function() {
		var data = JSON.parse(request.responseText);
		for (var i = 0; i < data.feed.entry.length; i++) {
			var entry = data.feed.entry[i];
			var name = entry.gsx$nombre.$t;
			var link = entry.gsx$url.$t;
			if (name != '') {
				formattedData[name] = link;
			}
		}
		
		console.log(formattedData);
		$(".lds-dual-ring").slideUp();
		
		if (params.nombre !== undefined) {
			var link = formattedData[params.nombre];
			if (link !== undefined) {
				window.location.replace(link);
			}
		}
	}
	request.send();
}