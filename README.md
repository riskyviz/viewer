# viewer

Simple and re-usable web app for viewing geo-localized risk and environmental data 
requiring only a static web server.

Based on the [riskCOVID prototype web app] (https://github.com/riskyviz/webapp/)

The view is pre-loaded with UK (London area) air quality data for January 2020.  

The data is obtained from the Met Office AQUM (Air Quality Unified Model), for more information see:

* https://www.metoffice.gov.uk/research/weather/atmospheric-dispersion/atmospheric-composition

* https://metdatasa.blob.core.windows.net/covid19-response/README_data_air_quality.html

Data is loaded and converted to `output.geojson` to be loaded and viewed in the web app using:

```
cd data
wget https://metdatasa.blob.core.windows.net/covid19-response/metoffice_aqum_hourly/pm2p5/aqum_hourly_pm2p5_20200101.nc
wget https://metdatasa.blob.core.windows.net/covid19-response/metoffice_aqum_hourly/pm2p5/aqum_hourly_pm2p5_20200102.nc
...
wget https://metdatasa.blob.core.windows.net/covid19-response/metoffice_aqum_hourly/pm2p5/aqum_hourly_pm2p5_20200108.nc
python3 convert.py output.geojson
```

Note - to run `convert.py` you will need to install the following packages:

```
pip3 install pyproj
pip3 install xarray
pip3 install netcdf4
```