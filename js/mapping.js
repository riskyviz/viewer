
var lon = sessionStorage.getItem("longitude");
var lat = sessionStorage.getItem("latitude");
var mymap = L.map('mapid').setView([lat, lon], 12);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    minZoom: 10,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
}).addTo(mymap);

var logoIcon = L.icon({
    iconUrl: 'img/marker.svg',
    iconSize: [40, 50], // size of the icon
    iconAnchor: [20, 49], // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

mymap.flyTo([lat, lon], 14);
var Marker = L.marker([lat, lon], {icon: logoIcon}).addTo(mymap);

