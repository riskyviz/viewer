

function style(feature) {
    return {
        fillColor: getColour(feature.properties.scores[model.getSelectedTimeIndex()][configuration["selected_field"]]),
        weight: 0.2,
        opacity: 1,
        color: 'black',
        fillOpacity: 0.5
    };
}

function onEachFeature(feature, layer) {
    layer.on({
        click: onClick
    });
}

function resetHighlight(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 0.2,
        opacity: 1,
        color: 'black',
        fillOpacity: 0.6
    });
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

function onClick(e){
    var lat = e.latlng.lat;
    var lon = e.latlng.lng;
    controller.locate(lon,lat);
}

class View {
    constructor() {
        this.map = null;
        this.dataLayers = {};
        this.logoIcon = L.icon({
            iconUrl: 'img/marker.svg',
            iconSize: [40, 50], // size of the icon
            iconAnchor: [20, 49], // point of the icon which will correspond to marker's location
            popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
        });
        this.highlight = null;
    }

    initMap(lon,lat,min_zoom,max_zoom) {
        this.min_zoom = min_zoom;
        this.max_zoom = max_zoom;

        var that = this;

        this.map = L.map('mapid',{
            minZoom: min_zoom,
            maxZoom: max_zoom
        }).setView([lat, lon], max_zoom);

        L.tileLayer('https://a.tile.openstreetmap.de/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ',
            tileSize: 512,
            zoomOffset: -1,
        }).addTo(this.map);

        this.map.on('moveend', function() {
            model.loadDataForZoom(that.map.getZoom());
        });
    }

    setMaxZoom() {
        this.map.setZoom(this.max_zoom);
    }

    showOnMap(lon,lat) {
        this.map.flyTo([lat, lon], this.map.getZoom());
        // this.marker = L.marker([lat, lon], {icon: this.logoIcon}).addTo(this.map);
    }

    highlightArea(lon_min,lat_min,lon_max,lat_max) {
        var bounds = [[lat_max,lon_max],[lat_min,lon_min]];
        if (this.highlight) {
            this.map.removeLayer(this.highlight);
        }
        this.highlight = L.rectangle(bounds, {color: 'blue', weight: 2, fill: false}).addTo(this.map);
    }

    getMapBoundaries() {
        var bounds = this.map.getBounds();
        var sw = bounds.getSouthWest();
        var ne = bounds.getNorthEast();
        return { "min_lon": sw.lng, "max_lon":ne.lng, "min_lat":sw.lat, "max_lat":ne.lat }
    }

    refresh() {
        this.clearDataLayers();
        this.updateDataLayers();
    }

    clearDataLayers() {
        for (var fn in this.dataLayers) {
            this.dataLayers[fn].remove();
            delete this.dataLayers[fn];
        }
    }

    async updateDataLayers() {
        var bounds = this.getMapBoundaries();
        var area_geojsons = await model.lookupAreas(bounds.min_lon,bounds.max_lon,bounds.min_lat,bounds.max_lat);

        for (var fn in this.dataLayers) {
            if (!(fn in area_geojsons)) {
                this.dataLayers[fn].remove();
                delete this.dataLayers[fn];
            }
        }
        for (var fn in area_geojsons) {
            if (!(fn in this.dataLayers)) {
                this.dataLayers[fn] = L.geoJson(area_geojsons[fn], {style: style, onEachFeature: onEachFeature}).addTo(this.map);
            }
        }

        return area_geojsons;
    }
}

var view = null;