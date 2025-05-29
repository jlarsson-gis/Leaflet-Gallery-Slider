// leafletSlider.js
// Author: jlarsson-gis
// 
// Dependencies: Leaflet (Tested on Leaflet 1.9.4)




// User variables: Adjust these before using!! These can either be adjust here, or if you'd rather leave this js alone, you can adjust them in your main HTML file within a <script> tag before calling this script.
var photosymbol = photosymbol ?? 'Map_marker_icon_Nicolas_Mollet_Photo_Media_Default.png'; // Photo marker symbol
var max_concurrent_events = max_concurrent_events ?? 2; // Maximum number of concurrent events. This is to ensure the correct amount of space is reserved above the map. If this threshold is exceeded, then any events more than the threshold number will not be shown at a given slider step.
var imageBaseHref = imageBaseHref ?? './'; //Where are you locating the directory you used as input to extractLocations.py, relative to the webpage you are embedding this on.
var events = events ?? []; //List of events objects, similar to as follows:
//  Example events, event 1 which started in Jan 1970 and ended in Dec 1971 and event 2 which started in July 1970 and ended in Apr 1971.
// var events = [
//	{
//		name: "Example event 1", //Name of event
//		startMonth: 1,  //Start month, 1-12
//		startYear: 1970, // Start year
//		endMonth: 12, // End month, inclusive
//		endYear: 1971 // End year
//	},
//	{
//		name: "Example event 2", //Name of event
//		startMonth: 7,  //Start month, 1-12
//		startYear: 1970, // Start year
//		endMonth: 4, // End month, inclusive
//		endYear: 1971 // End year
//	}
// ];






//Begin Javascript code
var map = L.map('map').setView([39.099,-76.75], 10);
L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
	maxZoom: 12,
	minZoom: 4,
	attribution: '&copy;  Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community'
}).addTo(map);

var group = new L.featureGroup();

//Define other markers you would like to always appear in the feature group "group". Example:

//L.marker([39.2534782,-76.7127765]).bindPopup('Example text -- change me!!').setZIndexOffset(0).addTo(map).addTo(group)




//Create empty geoJSON layer and add to map. This will be used to house the points.
var myLayer = L.geoJSON().addTo(map);
myLayer.addTo(map);

//Set up slider. Set slider maximum as the length of the photolengths array from photos_geojson.js. This is an array which contains the names of each month being used.
var slider_maximum = parseInt(photomonths.length)
document.getElementById("progress").setAttribute("max",slider_maximum)
document.getElementById("progress").setAttribute("min","0")
document.getElementById("progress").setAttribute("step","1")
document.getElementById("progress").value = slider_maximum


years = ""
yearRange = [photomonths[0][2], photomonths[photomonths.length-1][2]]
numMonths = photomonths.length
for(i = yearRange[0]; i <= yearRange[1]; i++){
	if(i == yearRange[0]){
		firstMonth = photomonths[0][1]
		width = (12.5-firstMonth)/photomonths.length
	} else if(i == yearRange[1]){
		finalMonth = photomonths[photomonths.length-1][1]+0.5
		width = finalMonth/photomonths.length
	} else {
		width = 12/photomonths.length
	}
	years += "<div style='width: " + width*100 + "%'>" + i + "</div>"
}
document.getElementById("years").innerHTML = years;

function rstrip(str, unwanted) {
    return str.endsWith(unwanted) ? str.slice(0, -1) : str;
};
function lstrip(str, unwanted) {
    return str.startsWith(unwanted) ? str.slice(1, str.length) : str;
};
imageBaseHref = rstrip(rstrip(lstrip(imageBaseHref, "."), "\\"), "/")
if(imageBaseHref != ""){imageBaseHref+"/"}

chooseDate()
		
function chooseDate(){
	myLayer.clearLayers()
	function onEachFeature(feature, layer) {
    	if (feature.properties && feature.properties.popupContent) {
    	    layer.bindPopup(feature.properties.popupContent);
    	}
	}
	zIndexVariable = 0
	if(document.getElementById("progress").value == slider_maximum){
		zIndexVariable = -2000
		var filteredphotos = L.geoJson(photopoints, {pointToLayer: function (feature, latlng) {
        	return new L.circleMarker(latlng, {radius: 2, fillcolor: "#CCCCCC", color: "#000000", weight:0.5})
    	}}).bindPopup(function (layer) {
    		return "<span style='display:inline-block;height:256px; width:256px; text-align: center;'><span style=' display: inline-block;height:256px; vertical-align: middle;'></span><a target='_blank' href='"+imageBaseHref+layer.feature.properties.name+"'><img src='"+imageBaseHref+layer.feature.properties.name+"' style=' display: inline-block;max-width:256px; max-height:256px; vertical-align: middle;'></a></span>";
		}).addTo(myLayer);
		document.getElementById("MonthDate").innerHTML = "All Months"
	} else {
		var filteredphotos = L.geoJson(photopoints, {onEachFeature: onEachFeature, filter: photoFilter, pointToLayer: function (feature, latlng) {
        	return new L.Marker(latlng, {zIndexOffset: 2000,icon: new L.Icon({iconUrl: photosymbol, iconAnchor: [16,34], popupAnchor:  [0,-17]})});
    	}}).bindPopup(function (layer) {
    		return "<span style='display:inline-block;height:256px; width:256px; text-align: center;'><span style=' display: inline-block;height:256px; vertical-align: middle;'></span><a target='_blank' href='"+imageBaseHref+layer.feature.properties.name+"'><img src='"+imageBaseHref+layer.feature.properties.name+"' style=' display: inline-block;max-width:256px; max-height:256px; vertical-align: middle;'></a></span>";
		}).addTo(myLayer);

		document.getElementById("MonthDate").innerHTML = photomonths[document.getElementById("progress").value][3]

		eventsAtStep = []
		for (var i = 0; i < events.length && eventsAtStep.length <= max_concurrent_events; i++) {
			monthsrange = [[events[i]["startMonth"], events[i]["startYear"]],[events[i]["endMonth"], events[i]["endYear"]]]
			selMonthRow = photomonths[document.getElementById("progress").value]
			month = [selMonthRow[1], selMonthRow[2]]
			if((month[1] > monthsrange[0][1] || ( month[1] == monthsrange[0][1] && month[0] >= monthsrange[0][0])) && (month[1] < monthsrange[1][1] || ( month[1] == monthsrange[1][1] && month[0] <= monthsrange[1][0]))){
				eventsAtStep.push(events[i]["name"])
			}
		}
		while(eventsAtStep.length < max_concurrent_events){
			eventsAtStep.push("")
		}
		document.getElementById("Stage").innerHTML = eventsAtStep.join("<br>")
					
	}
	
    function zIndexFunction(feature){
	    index = 0
		if(document.getElementById("progress").value == slider_maximum){
			index = -2000
		} else {
			index = 2000
		}
		return index
	        	
    }

	function photoFilter(feature) {
		if(document.getElementById("progress").value == slider_maximum) return true
		selMonthRow = photomonths[document.getElementById("progress").value]
		selMonth = [selMonthRow[1], selMonthRow[2]]
		if (feature.properties.month[0] == selMonth[0] && feature.properties.month[1] == selMonth[1]) return true
	}
	myLayer.addTo(group)

	try {map.fitBounds(group.getBounds());} // SyntaxError
	catch (e){ console.log(e);}

	
			
}
