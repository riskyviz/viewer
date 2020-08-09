
var lon = sessionStorage.getItem("longitude");
var lat = sessionStorage.getItem("latitude");
var mymap = L.map('mapid').setView([lat, lon], 12);

L.tileLayer('https://a.tile.openstreetmap.de/{z}/{x}/{y}.png', {
    maxZoom: 18,
    initialZoom: 10,
    minZoom: 6,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ',
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

