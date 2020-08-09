import xarray as xr
import numpy as np
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

bb_filter = True
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

class Converter(object):

    def __init__(self):
        pass

    def convert(self,output_file_name):

        id_counter=0
        dt = start_date
        output_data = {}
        times = []
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
                            id_counter += 1

                    if output_data[(x,y)]:
                        output_data[(x,y)]["scores"].append(float(field_data[y,x]))

            dt += datetime.timedelta(days=1)


        geojson_out = copy.deepcopy(geojson)
        geojson_out["properties"]["times"] = times
        for k in output_data:
            if output_data[k]:
                geojson_feat = copy.deepcopy(geojson_feature)
                for property in ["scores","id","lon","lat"]:
                    geojson_feat["properties"][property] = output_data[k][property]
                geojson_feat["geometry"]["coordinates"] = [[[[lat,lon] for (lat,lon) in output_data[k]["bounds"]]]]
                geojson_out["features"].append(geojson_feat)
        open(output_file_name,"w").write(json.dumps(geojson_out))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("output_file",help="The output file (netCDF4) to write out the converted data")
    args = parser.parse_args()
    print("Converting => %s"%(args.output_file))
    Converter().convert(args.output_file)

