
class Model {
    constructor() {
        this.times = null;
        this.areas = [];
        this.loadCache = {};
        this.current_zoom = null;
    }

    getTimes() {
        return this.times;
    }

    async loadDataForZoom(level) {
        level = Math.floor(level);
        if (level == this.current_zoom) {
            return;
        }
        view.clearDataLayers();
        this.loadCache = {};
        var root_name = configuration["zoom_levels"]["" + level];
        if (root_name) {
            var geojson_root = await fetch("data/" + root_name);
            var geodata_root = await geojson_root.json();
            this.loadAreas(geodata_root);
            this.times = geodata_root["properties"]["times"];
        } else {
            // fixme should load the "closest" available higher zoom_level?
            this.areas = [];
            geodata_root = null;
        }
        this.current_zoom = level;
        view.updateDataLayers();
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
        console.log(min_lon, max_lon, min_lat, max_lat);

        for (var idx = 0; idx < this.areas.length; idx++) {
            var p = this.areas[idx];
            if (!(min_lat > p.max_lat || max_lat < p.min_lat || min_lon > p.max_lon || max_lon < p.min_lon)) {
                var fn = p.shard_filename;
                if (!(fn in this.loadCache)) {
                    // console.log("loading: "+fn);
                    var fetched = await fetch("data/" + fn);
                    var geoj = await fetched.json();
                    this.loadCache[fn] = geoj;
                    // console.log("loaded: "+fn);
                }
                count += 1;
                result[fn] = this.loadCache[fn];
            }
        }
        console.log("lookupAreas:" + count);
        return result;
    }
}

var model = null;
