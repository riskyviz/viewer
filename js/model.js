
class Model {
    constructor() {
        this.times = null;
        this.selected_time = null;
        this.selected_time_index = -1;
        this.areas = [];
        this.loadCache = {};
        this.current_zoom = null;
        this.current_root_name = '';
        this.local_scores = [];
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

    async loadDataForZoom(level,update_data_layers) {
        level = Math.floor(level);
        this.current_zoom = level;
        var root_name = configuration["zoom_levels"]["" + level];
        if (root_name == this.current_root_name) {
            if (update_data_layers) {
                view.updateDataLayers();
            }
            return;
        }
        view.clearDataLayers();
        this.loadCache = {};
        if (root_name != this.current_root_name) {
            var geojson_root = await fetch(configuration["data_url"] + "/" + root_name,{cache: "no-store"});
            var geodata_root = await geojson_root.json();
            this.loadAreas(geodata_root);
            this.setTimes(geodata_root["properties"]["times"]);
            this.setBoundingBox(geodata_root["properties"]["bounding_box"]);
            this.current_root_name = root_name;
            view.updateDataLayers();
        }

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
}

var model = null;
