# MIT License
#
# Copyright (c) 2020 riskyviz
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

import xarray as xr
import argparse
import json
import datetime
import copy

from pyproj import Transformer

start_date = datetime.datetime(2020,1,1)
end_date = datetime.datetime(2020,1,8)

def date_to_path(dt):
    return dt.strftime("aqum_daily_daqi_mean_%Y%m%d.nc")

transformer = Transformer.from_crs("epsg:27700","epsg:4326")

bb_filter = False
bb_lon_min=-1.489
bb_lat_min=51.28
bb_lon_max=0.236
bb_lat_max=52.686

geojson_feature = {
    "type": "Feature",
    "properties": {},
    "geometry": {"type": "MultiPolygon", "coordinates": [[]]}
}

geojson = {
    "type": "FeatureCollection",
    "features": [],
    "properties": {}
}

class Shard(object):

    id_counter = 0
    def __init__(self,base_file_name,min_lat,min_lon,max_lat,max_lon):
        self.id = Shard.id_counter
        Shard.id_counter += 1
        self.min_lat = min_lat
        self.min_lon = min_lon
        self.max_lat = max_lat
        self.max_lon = max_lon
        self.file_name = "shard%d_"%(self.id)+base_file_name

        self.extent_max_lat = min_lat
        self.extent_max_lon = min_lon

    def __repr__(self):
        return "(lat: %f to %f, lon: %f to %f)"%(self.min_lat,self.max_lat,self.min_lon,self.max_lon)

    def includes(self,lon_lat_list):
        min_lat = min(lat for (_,lat) in lon_lat_list)
        min_lon = min(lon for (lon,_) in lon_lat_list)
        return min_lat >= self.min_lat and min_lat < self.max_lat \
            and min_lon >= self.min_lon and min_lon < self.max_lon

    def add(self,lon_lat_list):
        max_lat = max(lat for (_, lat) in lon_lat_list)
        max_lon = max(lon for (lon, _) in lon_lat_list)
        self.extent_max_lat = max(max_lat,self.extent_max_lat)
        self.extent_max_lon = max(max_lon, self.extent_max_lon)

    def getExtentLat(self):
        return (self.min_lat,self.extent_max_lat)

    def getExtentLon(self):
        return (self.min_lon, self.extent_max_lon)

    def getFileName(self):
        return self.file_name

    def writeProperties(self,properties):
        properties["shard_filename"] = self.file_name
        properties["min_lat"] = self.min_lat
        properties["max_lat"] = self.extent_max_lat
        properties["min_lon"] = self.min_lon
        properties["max_lon"] = self.extent_max_lon

    def getCoordinates(self):
        return [(self.min_lon,self.min_lat),(self.min_lon,self.extent_max_lat),
                (self.extent_max_lon,self.extent_max_lat),(self.extent_max_lon,self.min_lat)]

class Converter(object):

    def __init__(self):
        pass

    def convert(self,output_file_name, shard_size_degrees=1):

        id_counter=0
        dt = start_date
        output_data = {}
        times = []
        area_min_lat = 90
        area_max_lat = -90
        area_min_lon = 180
        area_max_lon = -180
        while dt < end_date:
            print("Processing",dt)
            times.append(dt.strftime(("%Y-%m-%d")))
            path = date_to_path(dt)
            ds = xr.open_dataset(path)

            # for v in ds.variables:
            #    print(v)

            field = "daily_air_quality_index"

            field_data = ds.variables[field].data

            ycs = ds.coords["projection_y_coordinate"].data
            xcs = ds.coords["projection_x_coordinate"].data
            # print(np.min(field_data),np.max(field_data))
            # print(ycs.shape)
            # print(xcs.shape)

            for y in range(1,ycs.shape[0]-1):
                for x in range(1,xcs.shape[0]-1):
                    if (x,y) not in output_data:
                        y_min = ycs[y] - (ycs[y] - ycs[y - 1]) * 0.5
                        y_max = ycs[y] + (ycs[y + 1] - ycs[y]) * 0.5
                        x_min = xcs[x] - (xcs[x] - xcs[x - 1]) * 0.5
                        x_max = xcs[x] + (xcs[x + 1] - xcs[x]) * 0.5

                        corners = []
                        for yx in [(y_min,x_min),(y_max,x_min),(y_max,x_max),(y_min,x_max)]:
                            lat,lon = transformer.transform(yx[1], yx[0])
                            corners.append((lon,lat))

                        mid_lat,mid_lon = transformer.transform(xcs[x],ycs[y])

                        min_lat = min([lat for (_,lat) in corners])
                        max_lat = max([lat for (_,lat) in corners])
                        min_lon = min([lon for (lon,_) in corners])
                        max_lon = max([lon for (lon,_) in corners])

                        if bb_filter and (min_lat > bb_lat_max or max_lat < bb_lat_min or min_lon > bb_lon_max or max_lon < bb_lon_min):
                            output_data[(x,y)] = False
                        else:
                            output_data[(x,y)] = {
                                "bounds": corners,
                                "scores": [],
                                "lon": float(mid_lon),
                                "lat": float(mid_lat),
                                "id": "a%d"%(id_counter)
                            }
                            area_min_lat = min(area_min_lat, min_lat)
                            area_max_lat = max(area_max_lat, max_lat)
                            area_min_lon = min(area_min_lon, min_lon)
                            area_max_lon = max(area_max_lon, max_lon)
                            id_counter += 1

                    if output_data[(x,y)]:
                        output_data[(x,y)]["scores"].append(float(field_data[y,x]))

            dt += datetime.timedelta(days=1)

        # calculate shard boundaries
        shards = []
        lat = area_min_lat
        while lat <= area_max_lat:
            lon = area_min_lon
            while lon <= area_max_lon:
                shards.append(Shard(output_file_name,lat,lon,lat+shard_size_degrees,lon+shard_size_degrees))
                lon += shard_size_degrees
            lat += shard_size_degrees

        print(shards)

        for shard in shards:
            geojson_out = copy.deepcopy(geojson)
            geojson_out["properties"]["times"] = times
            for k in output_data:
                if output_data[k]:
                    lon_lats = output_data[k]["bounds"]
                    if shard.includes(lon_lats):
                        shard.add(lon_lats)
                        coords = [[lon, lat] for (lon, lat) in lon_lats]
                        geojson_feat = copy.deepcopy(geojson_feature)
                        for property in ["scores", "id", "lon", "lat"]:
                            geojson_feat["properties"][property] = output_data[k][property]
                        geojson_feat["geometry"]["coordinates"] = [[coords]]
                        geojson_out["features"].append(geojson_feat)

            open(shard.getFileName(),"w").write(json.dumps(geojson_out))

        geojson_out = copy.deepcopy(geojson)
        geojson_out["properties"]["times"] = times
        for shard in shards:
            geojson_feat = copy.deepcopy(geojson_feature)
            shard.writeProperties(geojson_feat["properties"])
            geojson_feat["geometry"]["coordinates"] = [[shard.getCoordinates()]]
            geojson_out["features"].append(geojson_feat)
        open(output_file_name, "w").write(json.dumps(geojson_out))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("output_file",help="The output geojson file to write out the converted data")
    args = parser.parse_args()
    print("Preparing => %s"%(args.output_file))
    Converter().convert(args.output_file)

