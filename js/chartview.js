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

