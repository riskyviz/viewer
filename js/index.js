












async function boot() {

    await configure();

    view = new View();
    controller = new Controller();
    model = new Model();

    var min_zoom = null;
    var max_zoom = null;

    for(var zoom_level in configuration["zoom_levels"]) {
        var zoom_level_int = Number.parseInt(zoom_level);
        if (min_zoom == null || zoom_level_int < min_zoom) {
            min_zoom = zoom_level_int;
        }
        if (max_zoom == null || zoom_level_int > max_zoom) {
            max_zoom = zoom_level_int;
        }
    }
    var lat = sessionStorage.getItem("latitude");
    var lon = sessionStorage.getItem("longitude");

    if (lat == null) {
        lat = 52.4862;
        lon = 1.8904;
    }

    var positionInfo = sessionStorage.getItem("location") || "?";
    document.getElementById("result").innerHTML = positionInfo;

    view.initMap(lon,lat,min_zoom,max_zoom);
    await controller.locate(lon,lat);

    await model.loadDataForZoom(14,false);

    document.getElementById("geolocate_btn").onclick = function() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var lon = position.coords.longitude;
                var lat = position.coords.latitude;
                controller.locate(lon, lat);
            });
        }
    }


}

