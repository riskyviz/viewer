

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
        if (chart) {
            chart.update();
        }
        updateColourBar();
        view.refresh();
        updateText();
    }

    locationSearch(location_string) {

        var that = this;
        var params = new URLSearchParams({
            "q": location_string,
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
                        break;
                    }
                }
            }
        )
    }

    async locate(lon,lat) {
        view.setMaxZoom();
        view.showOnMap(lon, lat);
        model.setLocation(lon,lat);
    }
}

var controller = null;

