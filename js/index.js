
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

    var lat = configuration["latitude"];
    var lon = configuration["longitude"];
    view.initMap(lon, lat, min_zoom, max_zoom);
    await model.loadDataForZoom(configuration["initial_zoom"], false);
    model.setSelectedTime(model.times[configuration["selected_time_index"]]);

    var location = configuration["location"];
    if (location != "") {
        controller.locationSearch(location);
    } else {
        await controller.locate(lon, lat);
    }
    document.getElementById("geolocate_btn").onclick = function() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var lon = position.coords.longitude;
                var lat = position.coords.latitude;
                controller.locate(lon, lat);
            });
        }
    }

    var field_names = [configuration["combined_field_name"]];
    var field_labels = [];
    for(var idx=0; idx<configuration["field_names"].length; idx++) {
        field_names.push(configuration["field_names"][idx]);
    }

    for(var idx=0; idx<field_names.length; idx++) {
        var field_name = field_names[idx];
        var field_label = configuration["field_labels"][field_name];
        field_labels.push(field_label);
    }
    configureSelect("select_data",field_names,field_labels,function(s) { controller.selectField(s); }, configuration["selected_field"]);

    var time_labels = [];
    for(var idx=0; idx<model.times.length; idx++) {
        time_labels.push(formatDate(parseDate(model.times[idx])));
    }

    configureSelect("select_time",model.times,time_labels,function(s) {
        controller.selectTime(s); }, model.getSelectedTime());

    function changeSelectedTime(increment) {
        var new_index = model.getSelectedTimeIndex() + increment;
        if (new_index >= 0 && new_index < model.getTimes().length) {
            controller.selectTime(model.getTimes()[new_index]);
            document.getElementById("select_time").selectedIndex = model.getSelectedTimeIndex();
        }
    }

    document.getElementById("btn_minus").onclick = function() {
        changeSelectedTime(-1);
    }

    document.getElementById("btn_plus").onclick = function() {
        changeSelectedTime(1);
    }

    var startDate = parseDate(model.getTimes()[0]);
    var endDate = parseDate(model.getTimes()[model.getTimes().length-1]);
    $(".end_date").text(formatDate(endDate));
    $(".start_date").text(formatDate(startDate));


}

