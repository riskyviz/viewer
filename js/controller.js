

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
        var postcode = this.location_input.value;
        this.locationSearch(postcode);
        this.location_form.reset();
    }

    locationSearch(location_string) {

        var that = this;
        var params = new URLSearchParams({
            "q": location_string,
            "countrycodes": "gb",
            "format": "json"
        });
        fetch("https://nominatim.openstreetmap.org/search?" + params.toString()).then(
            response => response.json()
        ).then(
            results => {
                if (results.length) {
                    var lat = Number.parseFloat(results[0]["lat"]);
                    var lon = Number.parseFloat(results[0]["lon"]);
                    sessionStorage.setItem("latitude", lat);
                    sessionStorage.setItem("longitude", lon);
                    window.location.assign("index.html");
                    that.locate(lon,lat);
                }
            }
        )
    }

    async locate(lon,lat) {
        var point1 = turf.point([lon, lat], {});//x,y
        view.showOnMap(lon, lat);

        var area_geojsons = await view.updateDataLayers();

        for (var fn in area_geojsons) {
            var geodata = area_geojsons[fn];
            var features = geodata.features;
            var risk_level = "";
            var thresholds = configuration["risk-thresholds"];
            for (var i = 0, len = features.length; i < len; i++) {
                var isInside = turf.inside(point1, features[i]);
                if (isInside) {
                    var place = features[i].properties.id;
                    var scores = features[i].properties.scores;
                    var score = scores[scores.length - 1];

                    sessionStorage.setItem("location", place);
                    sessionStorage.setItem("score", score);

                    document.getElementById("result").textContent = place;
                    document.getElementById("currentRate").textContent = score.toFixed(2);
                    document.getElementById("placeName").textContent = place;
                    document.getElementById("riskStripePlace").textContent = place;
                    document.getElementById("indicator").setAttribute("fill", getColor(score));

                    if (score >= thresholds["medium-high"]) {
                        document.getElementById("riskScale").setAttribute("src", 'img/highRisk.svg');
                        var riskLevel = document.getElementById("riskLevel");
                        riskLevel.textContent = "HIGH RISK";
                        riskLevel.style.color = '#ff0034';
                        risk_level = "high";
                    } else if (score >= thresholds["low-medium"]) {
                        document.getElementById("riskScale").setAttribute("src", 'img/medRisk.svg');
                        var riskLevel = document.getElementById("riskLevel");
                        riskLevel.textContent = "MEDIUM RISK";
                        riskLevel.style.color = '#FFD300';
                        risk_level = "medium";
                    } else if (score >= 0) {
                        document.getElementById("riskScale").setAttribute("src", 'img/lowRisk.svg');
                        var riskLevel = document.getElementById("riskLevel");
                        riskLevel.textContent = "LOW RISK";
                        riskLevel.style.color = '#80C904';
                        risk_level = "low";
                    } else {
                        document.getElementById("riskScale").setAttribute("src", '');
                    }
                    var advice_area = document.getElementById("advice_by_risk");
                    if (advice_area) {
                        advice_area.innerHTML = "";
                        if (configuration["advice_by_risk"]) {
                            var advice_html = configuration["advice_by_risk"][risk_level];
                            if (advice_html) {
                                advice_area.innerHTML = advice_html;
                            }
                        }
                    }
                    var cb = createColourBar(features[i].properties.scores, model.getTimes(), thresholds["low-medium"], thresholds["medium-high"], 250, 250);
                    document.getElementById("colorBar").innerHTML = "";
                    document.getElementById("colorBar").appendChild(cb);
                    $('#myChart').remove();
                    $('#chartFather').append('<canvas id="myChart"></canvas>');
                    createChart(features[i].properties.scores, model.getTimes());
                    return;
                }
            }
        }
    }
}

var controller = null;

