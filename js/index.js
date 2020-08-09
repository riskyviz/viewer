$('#setLocation').on('click', function() {
    var $this = $(this);
    var loadingText = '<i class="fa fa-circle-o-notch fa-spin"></i> Loading...';
    if ($(this).html() !== loadingText) {
        $this.data('original-text', $(this).html());
        $this.html(loadingText);
    }

});

var geodata = {};


async function boot() {
    var geojson = await fetch("data/output.geojson");
    geodata = await geojson.json();
}

function locate() {
    if ("geolocation" in navigator) {
        var that =this;

        this.watchID = navigator.geolocation.getCurrentPosition(function(position) {
            var lon = position.coords.longitude;
            sessionStorage.setItem("longitude", lon);
            var lat = position.coords.latitude;
            sessionStorage.setItem("latitude", lat);
            var point1 = turf.point([lon,lat], { });//x,y

            var features = geodata.features;

            for (var i = 0, len = features.length; i < len; i++) {
                var isInside = turf.inside(point1,features[i]);
                if(isInside) {
                    var place = features[i].properties.id;
                    var scores = features[i].properties.scores;
                    var score = scores[scores.length-1];
                    sessionStorage.setItem("location", place);
                    sessionStorage.setItem("score", score);
                    window.location.assign("local.html");
                }
            }
        },function(err) {});
    } else {
        // alert("no geolocation");
    }
}


