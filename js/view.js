

function getColor(d) {
    return d >= configuration["risk-thresholds"]["medium-high"] ? '#ff0034' :
        d >= configuration["risk-thresholds"]["low-medium"]  ? '#FFD300' :
            d >= 0 ? '#80C904':
                'transparent';
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.scores[feature.properties.scores.length-1]),
        weight: 0.2,
        opacity: 1,
        color: 'black',
        fillOpacity: 0.6
    };
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
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
        this.marker = null;
        this.dataLayers = {};
        this.current_zoom = -1;
        this.logoIcon = L.icon({
            iconUrl: 'img/marker.svg',
            iconSize: [40, 50], // size of the icon
            iconAnchor: [20, 49], // point of the icon which will correspond to marker's location
            popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
        });
    }

    initMap(lon,lat,min_zoom,max_zoom) {
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
            // alert("moveend:"+JSON.stringify(getMapBoundaries()));
            console.log(that.map.getZoom());
            model.loadDataForZoom(that.map.getZoom(),true);
        });
    }

    showOnMap(lon,lat) {
        if (this.marker) {
            this.marker.remove();
        }
        this.map.flyTo([lat, lon], 14);
        this.marker = L.marker([lat, lon], {icon: this.logoIcon}).addTo(this.map);
        // loadDataForZoom(this.map.getZoom(),false);
    }

    getMapBoundaries() {
        var bounds = this.map.getBounds();
        var sw = bounds.getSouthWest();
        var ne = bounds.getNorthEast();
        return { "min_lon": sw.lng, "max_lon":ne.lng, "min_lat":sw.lat, "max_lat":ne.lat }
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