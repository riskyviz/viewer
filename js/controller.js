

class Controller {

    constructor() {
        this.location_input = document.getElementById("selector");
        this.location_form = document.getElementById("searchForm");

        var that = this;
        this.location_form.onsubmit = function (e) {
            e.preventDefault();
            that.doSearch();
        }
    }

    doSearch() {
        var location_string = this.location_input.value;
        this.locationSearch(location_string);
        this.location_form.reset();
    }

    selectField(field_name) {
        configuration["selected_field"] = field_name;
        view.refresh();
        updateCharts();
    }

    selectTime(time) {
        model.setSelectedTime(time);
        view.refresh();
        updateText();
    }

    locationSearch(location_string) {

        var that = this;
        var params = new URLSearchParams({
            "q": location_string,
            /* "countrycodes": "gb", */
            "format": "json"
        });
        fetch("https://nominatim.openstreetmap.org/search?" + params.toString()).then(
            response => response.json()
        ).then(
            results => {
                for (var r=0; r<results.length; r++) {
                    var lat = Number.parseFloat(results[r]["lat"]);
                    var lon = Number.parseFloat(results[r]["lon"]);
                    if (model.inBoundingBox(lon, lat)) {
                        configuration["latitude"] = lat;
                        configuration["longitude"] = lon;
                        that.locate(lon, lat).then(r => {
                                configuration["location"] = location_string;
                                updateText();
                            }
                        );
                    }
                }
            }
        )
    }

    async locate(lon,lat) {
        var point1 = turf.point([lon, lat], {});
        view.showOnMap(lon, lat);
        var area_geojsons = await view.updateDataLayers();

        for (var fn in area_geojsons) {
            var geodata = area_geojsons[fn];
            var features = geodata.features;
            for (var i = 0, len = features.length; i < len; i++) {
                var isInside = turf.inside(point1, features[i]);
                if (isInside) {
                    model.setLocalScores(features[i].properties.scores);
                    updateCharts();
                }
            }
        }
    }
}

var controller = null;

