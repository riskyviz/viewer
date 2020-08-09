async function boot() {

    var geojson = await fetch("data/output.geojson");
    var geodata = await geojson.json();
    var times = geodata["properties"]["times"];

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
        locate(lon,lat);
    }

    L.geoJson(geodata, {style: style, onEachFeature: onEachFeature}).addTo(mymap);

    lat = sessionStorage.getItem("latitude");
    lon = sessionStorage.getItem("longitude");
    locate(lon,lat);

    function locate(lon,lat) {
        var point1 = turf.point([lon,lat], { });//x,y
        var features = geodata.features;
        var risk_level = "";
        var thresholds = configuration["risk-thresholds"];
        for (var i = 0, len = features.length; i < len; i++) {
            var isInside = turf.inside(point1,features[i]);
            if(isInside) {
                var place = features[i].properties.id;
                var scores = features[i].properties.scores;
                var score = scores[scores.length-1];

                sessionStorage.setItem("location", place);
                sessionStorage.setItem("score", score);
                mymap.flyTo([lat,lon],14);
                Marker.remove();
                Marker = L.marker([lat, lon], {icon: logoIcon}).addTo(mymap);
                document.getElementById("result").textContent = place;
                document.getElementById("currentRate").textContent = score.toFixed(2);
                document.getElementById("placeName").textContent = place;
                document.getElementById("riskStripePlace").textContent = place;
                document.getElementById("indicator").setAttribute("fill", getColor(score));

                if(score >= thresholds["medium-high"]){
                    document.getElementById("riskScale").setAttribute("src", 'img/highRisk.svg');
                    var riskLevel = document.getElementById("riskLevel");
                    riskLevel.textContent = "HIGH RISK";
                    riskLevel.style.color = '#ff0034';
                    risk_level = "high";
                }
                else if(score >= thresholds["low-medium"]){
                    document.getElementById("riskScale").setAttribute("src", 'img/medRisk.svg');
                    var riskLevel = document.getElementById("riskLevel");
                    riskLevel.textContent = "MEDIUM RISK";
                    riskLevel.style.color = '#FFD300';
                    risk_level = "medium";
                }
                else if(score >= 0){
                    document.getElementById("riskScale").setAttribute("src", 'img/lowRisk.svg');
                    var riskLevel = document.getElementById("riskLevel");
                    riskLevel.textContent = "LOW RISK";
                    riskLevel.style.color = '#80C904';
                    risk_level = "low";
                }
                else{
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
                var cb = createColourBar(features[i].properties.scores,times,thresholds["low-medium"], thresholds["medium-high"], 250, 250);
                document.getElementById("colorBar").innerHTML="";
                document.getElementById("colorBar").appendChild(cb);
                $('#myChart').remove();
                $('#chartFather').append('<canvas id="myChart"></canvas>');
                createChart(features[i].properties.scores,times);
            }
        }
    }

    async function location_search(location_string) {

        var params = new URLSearchParams({
            "q":location_string,
            "countrycodes":"gb",
            "format":"json"
        });
        fetch("https://nominatim.openstreetmap.org/search?"+params.toString()).then(
            response => response.json()
        ).then(
            results => {
                if (results.length) {
                    var lat = Number.parseFloat(results[0]["lat"]);
                    var lon = Number.parseFloat(results[0]["lon"]);
                    locate(lon,lat);
                }
            }
        )
    }


    var location_input = document.getElementById("selector");
    var location_form = document.getElementById("searchForm");

    location_form.onsubmit = function(e) {
        e.preventDefault();
        var postcode = location_input.value;
        location_search(postcode);
        location_form.reset();

    }

    function parseDate(s) {
        // parse date of the form YYYY-MM-DD
        var year = parseInt(s.slice(0,4));
        var month = parseInt(s.slice(5,7));
        var day = parseInt(s.slice(8,10));
        return new Date(year,month-1,day,0,0,0,0);
    }

    /**
     * Format a javascript Date and return a short string eg "Mon 31 Jul"
     * @param dt
     * @returns {string}
     */
    function formatDate(dt) {
        return dt.toString().slice(0,10)
    }

    /**
     * Create a colour bar for the score history and return its HTML element,
     * ready to be added to the document
     *
     * @param scores array of scores
     * @param times array of Date objects
     * @param threshold1 threshold between low and medium scores
     * @param threshold2 threshold between medium and high scores
     * @param height height of the bar (suggest 40 or 50) in pixels
     * @param width width of the bar, suggest at least 300
     * @returns {HTMLCanvasElement}
     */
    function createColourBar(scores,times,threshold1,threshold2,height,width) {

        // work out the end date (with the latest score) ...
        var endDate = parseDate(times[times.length-1]);
        var startDate = parseDate(times[0]);

        cscores = [];
        for(var idx=scores.length-1; idx>=0; idx--) {
            cscores.push(scores[idx]);
        }

        document.getElementById("endDate").textContent = formatDate(endDate);
        document.getElementById("startDate").textContent = formatDate(startDate);
        document.getElementById("date").textContent = formatDate(endDate);
        // create a canvas object for drawing the bar
        var cnv = document.createElement("canvas");

        cnv.setAttribute("width",width);
        cnv.setAttribute("height", height);
        var ctx = cnv.getContext('2d');

        // create a margin at the left and the right
        var marginx = 25;  // use 25 pixels

        // work out the height and width of the colourbar itself
        var barwidth = width - (2*marginx);
        var barheight = height-25;

        // draw the coloured rectangles
        var count = cscores.length;
        var step = barwidth / count;
        for(var idx=0; idx < count; idx+=1) {
            var score = cscores[idx];
            var colour = getColor(score);
            if (colour != null) {
                ctx.fillStyle = colour;
                ctx.globalCompositeOperation = "lighter"
                ctx.fillRect(marginx + barwidth - (step*(1+idx)), 0, step, barheight);

            }
        }

        // label the start and end dates
        var x0 = marginx + step/2;
        var x1 = width - marginx - step/2;
        var y = barheight+15;

        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.font = "bold 12px 'Source Code Pro'";

        // draw some lines dividing each day
        ctx.strokeStyle = "grey";
        ctx.lineWidth = 0.1;
        var x = marginx;
        for(var idx=0; idx < count-1; idx+=1) {
            ctx.beginPath();
            x += step;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, barheight);
            ctx.stroke();
        }


        // add start "tick"
        ctx.moveTo(x0,barheight);
        ctx.lineTo(x0,barheight+5);
        ctx.stroke();

        // add end "tick"
        ctx.moveTo(x1,barheight);
        ctx.lineTo(x1,barheight+5);
        ctx.stroke();

        // add start and end labels
        ctx.fillText(formatDate(startDate),x0,y,2*marginx);
        ctx.fillText(formatDate(endDate),x1,y,2*marginx);

        // add an enclosing rectangle around the colour bar to make it look
        // a bit nicer
        ctx.strokeStyle = "grey";
        ctx.strokeRect(marginx,0,barwidth,barheight);

        return cnv;
    }

    function getDates(startDate, endDate) {
        var dates = [],
            currentDate = startDate,
            addDays = function(days) {
                var date = new Date(this.valueOf());
                date.setDate(date.getDate() + days);
                return date;
            };
        while (currentDate <= endDate) {
            dates.push(formatDate(currentDate));
            currentDate = addDays.call(currentDate, 1);
        }
        return dates;
    };

    function createChart(scores,times){
        var cht = document.getElementById('myChart').getContext('2d');
        cht.height = 500;

        // work out the end date (with the latest score) ...
        var endDate = parseDate(times[times.length-1]);
        // and the start date in the history
        var startDate = parseDate(times[0]);
        var dateArray = []
        dateArray = getDates(startDate,endDate);

        var chart = new Chart(cht, {
            // The type of chart we want to create
            type: 'line',

            // The data for our dataset
            data: {
                labels: dateArray,
                datasets: [{
                    label: "dataset",
                    borderColor: 'rgb(87,164,255)',
                    borderWidth: 3.5,
                    backgroundColor: 'rgba(255,255,255,0)',
                    data: scores,
                    fill: false,
                    pointRadius: 1.5,
                    pointHoverRadius: 3.5,
                    pointBackgroundColor: 'rgb(87,164,255)'
                }]
            },

            // Configuration options go here
            options: {
                maintainAspectRatio:true,
                aspectRatio: 1.8,
                scales:{
                    xAxes:[{
                        display: true,
                        gridLines: {
                            display: false
                        },

                        ticks:{
                            display: true,
                            autoSkip: true,
                            maxTicksLimit: 2,
                            maxRotation: 0,
                            minRotation: 0,
                            fontFamily: 'Source Code Pro'
                        }
                    },{
                        position: 'top',
                        ticks: {
                            display: false
                        },
                        gridLines: {
                            display: false,
                            drawTicks: false
                        }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: false,
                            labelString: 'Risk'
                        },
                        display: true,
                        ticks:{
                            fontFamily: 'Source Code Pro',
                            min: 0,
                            max: 9
                        }
                    }, {
                        position: 'right',
                        ticks: {
                            display: false
                        },
                        gridLines: {
                            display: false,
                            drawTicks: false
                        }
                    }],
                },
                legend: {
                    display: false
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return "Case Rate " + tooltipItem.yLabel.toFixed(2);
                        }
                    },
                    bodyFontSize: 16,
                    titleFontSize: 10,
                    titleFontStyle: 'normal',
                    bodyFontFamily: "'Source Code Pro'",
                    bodyFontStyle: "bold",
                    bodyAlign: 'center',
                    displayColors: false
                }
            }
        });
    }


}

