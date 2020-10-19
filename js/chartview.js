/**
 * Create a colour bar for the score history and return its HTML element,
 * ready to be added to the document
 *
 * @param scores array of scores
 * @param times array of Date objects
 * @param height height of the bar (suggest 40 or 50) in pixels
 * @param width width of the bar, suggest at least 300
 * @returns {HTMLCanvasElement}
 */
function createColourBar(scores,times,height,width) {

    var cscores = [];
    for(var idx=0; idx<scores.length; idx++) {
        cscores.push(scores[idx][configuration["selected_field"]]);
    }

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
        var colour = getColour(score);
        if (colour != null) {
            ctx.fillStyle = colour;
            ctx.globalCompositeOperation = "lighter"
            ctx.fillRect(marginx + step*idx, 0, step, barheight);
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

    // add an enclosing rectangle around the colour bar to make it look
    // a bit nicer
    ctx.strokeStyle = "grey";
    ctx.strokeRect(marginx,0,barwidth,barheight);

    return cnv;
}

function createChart(scores,times){
    var cht = document.getElementById('myChart').getContext('2d');
    cht.height = 500;

    var field = configuration["selected_field"];
    var label = configuration["field_labels"][field];
    var units = configuration["field_units"][field];

    var cscores = [];
    for(var idx=0; idx<scores.length; idx++) {
        cscores.push(scores[idx][field]);
    }

    var y_label = label;
    if (units) {
        y_label += " ( "+units+" )";
    }

    var dateArray = [];
    for(var idx=0; idx<times.length; idx++) {
        dateArray.push(parseDate(times[idx]));
    }

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
                data: cscores,
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
                        display: false,
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
                        display: true,
                        labelString: y_label
                    },
                    display: true,
                    ticks:{
                        fontFamily: 'Source Code Pro'
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
                        return tooltipItem.yLabel.toFixed(2);
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

function updateCharts() {
    var scores = model.getLocalScores();
    var score = scores[model.getSelectedTimeIndex()][configuration["selected_field"]];

    var colour = getColour(score);
    var risk_label = getLabel(score);
    var risk_category = getCategory(score);

    if (risk_category == "high") {
        document.getElementById("riskScale").setAttribute("src", 'img/highRisk.svg');
    } else if (risk_category == "medium") {
        document.getElementById("riskScale").setAttribute("src", 'img/medRisk.svg');
    } else {
        document.getElementById("riskScale").setAttribute("src", 'img/lowRisk.svg');
    }
    var advice_area = document.getElementById("advice_by_risk");
    if (advice_area) {
        advice_area.innerHTML = "";
        if (configuration["advice_by_risk"]) {
            var advice_html = configuration["advice_by_risk"][risk_category];
            if (advice_html) {
                advice_area.innerHTML = advice_html;
            }
        }
    }
    var cb = createColourBar(scores, model.getTimes(),250, 250);
    document.getElementById("colorBar").innerHTML = "";
    document.getElementById("colorBar").appendChild(cb);
    $('#myChart').remove();
    $('#chartFather').append('<canvas width="750" height="250" id="myChart"></canvas>');
    createChart(scores, model.getTimes());
    updateText();
}

function updateText() {
    var scores = model.getLocalScores();
    var score = scores[model.getSelectedTimeIndex()][configuration["selected_field"]];

    var colour = getColour(score);
    var risk_label = getLabel(score);
    var risk_category = getCategory(score);

    var field = configuration["selected_field"];
    var field_label = configuration["field_labels"][field];
    var units = configuration["field_units"][field];

    var local_date = formatDate(parseDate(model.getSelectedTime()));
    var score_string = score.toFixed(2);
    var location_label = configuration["location"];
    $(".place_name").html(location_label);
    $(".field_label").html(field_label);
    $(".field_units").html(units);
    $(".field_value").html(score_string);
    $(".forecast_time").html(local_date);
    $(".risk_level").html(risk_label);

    document.getElementById("indicator").setAttribute("fill", getColour(score));

    var summary_html = "<p>The forecast background value of "+field_label;
    if (location_label != "") {
        summary_html += " in " + location_label;
    }
    summary_html += " at "+local_date;
    summary_html += " is "+score_string;
    if (units != "") {
        summary_html += " "+units;
    }
    summary_html += ".</p><p>"
    summary_html += "The corresponding forecast background risk level is "+risk_label+".</p>";
    $(".summary_html").html(summary_html);
}
