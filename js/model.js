
class Model {
    constructor() {
        this.times = null;
        this.selected_time = null;
        this.selected_time_index = 0;
        this.areas = [];
        this.loadCache = {};
        this.current_root_name = '';
        this.local_scores = [];
        this.lon = configuration["longitude"];
        this.lat = configuration["latitude"];
    }

    setLocation(lon,lat) {
        this.lon = lon;
        this.lat = lat;
    }

    setBoundingBox(bounding_box) {
        this.bounding_box = bounding_box;
    }

    inBoundingBox(lon,lat) {
        return (lat >= this.bounding_box.min_lat && lat <= this.bounding_box.max_lat
            && lon >= this.bounding_box.min_lon && lon <= this.bounding_box.max_lon);
    }

    setTimes(times) {
        this.times = times;
    }

    getTimes() {
        return this.times;
    }

    setSelectedTime(time) {
        this.selected_time = time;
        for(var idx=0; idx<this.times.length; idx++) {
            if (this.times[idx] == time) {
                this.selected_time_index = idx;
            }
        }
    }

    setSelectedTimeIndex(time_index) {
        this.selected_time_index = time_index;
        this.selected_time = this.times[time_index];
    }

    getSelectedTime() {
        return this.selected_time;
    }

    getSelectedTimeIndex() {
        return this.selected_time_index;
    }

    setLocalScores(local_scores) {
        this.local_scores = local_scores;
    }

    getLocalScores() {
        return this.local_scores;
    }

    async loadDataForZoom(level) {
        level = Math.floor(level);
        this.current_zoom = level;
        var root_name = configuration["zoom_levels"]["" + level];

        if (root_name != this.current_root_name) {
            // this.loadCache = {};
            view.clearDataLayers();
            var geojson_root = await fetch(configuration["data_url"] + "/" + root_name, {cache: "no-store"});
            var geodata_root = await geojson_root.json();
            this.loadAreas(geodata_root);
            this.setTimes(geodata_root["properties"]["times"]);
            if (this.selected_time == null) {
                this.setSelectedTimeIndex(configuration["selected_time_index"]);
            }
            this.setBoundingBox(geodata_root["properties"]["bounding_box"]);
            this.current_root_name = root_name;
        }

        var area_geojsons = await view.updateDataLayers();
        this.configureLocal(area_geojsons);
        updateCharts();
        $('#myModal').modal('hide');
    }

    loadAreas(geodata_root) {
        this.areas = [];
        for (var idx = 0; idx < geodata_root.features.length; idx++) {
            this.areas.push(geodata_root.features[idx].properties);
        }
    }

    async lookupAreas(min_lon, max_lon, min_lat, max_lat) {
        var result = {};
        var count = 0;
        for (var idx = 0; idx < this.areas.length; idx++) {
            var p = this.areas[idx];
            if (!(min_lat > p.max_lat || max_lat < p.min_lat || min_lon > p.max_lon || max_lon < p.min_lon)) {
                var fn = p.shard_filename;
                if (!(fn in this.loadCache)) {
                    var fetched = await fetch(configuration["data_url"] + "/" + fn,{cache: "no-store"});
                    var geoj = await fetched.json();
                    this.loadCache[fn] = geoj;
                }
                count += 1;
                result[fn] = this.loadCache[fn];
            }
        }
        return result;
    }

    configureLocal(area_geojsons) {
        var point1 = turf.point([this.lon, this.lat], {});
        for (var fn in area_geojsons) {
            var geodata = area_geojsons[fn];
            var features = geodata.features;
            for (var i = 0, len = features.length; i < len; i++) {
                var isInside = turf.inside(point1, features[i]);
                if (isInside) {
                    var coords = features[i].geometry.coordinates[0][0];
                    var min_lon = 180;
                    var min_lat = 90;
                    var max_lon = -180;
                    var max_lat = -90;
                    for(var idx=0; idx<coords.length; idx++) {
                        var lon = coords[idx][0];
                        var lat = coords[idx][1];
                        min_lon = Math.min(lon,min_lon);
                        min_lat = Math.min(lat,min_lat);
                        max_lon = Math.max(lon,max_lon);
                        max_lat = Math.max(lat,max_lat);
                    }
                    view.highlightArea(min_lon,min_lat,max_lon,max_lat);
                    this.setLocalScores(features[i].properties.scores);
                    break;
                }
            }
        }
    }
}

var model = null;
