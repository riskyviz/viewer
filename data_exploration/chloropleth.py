# -*- coding: utf-8 -*-

import os

from visigoth import Diagram
from visigoth.common import Legend, Text
from visigoth.map_layers import Chloropleth, Geoimport
from visigoth.utils.colour import DiscretePalette
from visigoth.containers import Map, Sequence

folder=os.path.split(__file__)[0]

d = Diagram()

hs = Sequence(orientation="horizontal") # main component
vs = Sequence(orientation="vertical")   # position to the right

m = Map(width=1024,font_height=18)

palette=DiscretePalette()
palette.setDefaultColour("grey")

palette.addColour("high","red")
palette.addColour("moderate","orange")
palette.addColour("low","green")

def scoreThreshold(score):
    band = ""
    if score is None:
        band = "unknown"
    elif score < 1.5:
        band = "low"
    elif score < 2.5:
        band = "moderate"
    else:
        band = "high"
    print(band)
    return band

risk = Chloropleth("../data/output.geojson",valueNameOrFn=lambda p:scoreThreshold(p["scores"][len(p["scores"])-1]),labelNameOrFn=lambda x:"Risk Score",palette=palette, stroke_width=0)
risk.setOpacity(0.5)
risk.setInfo("","","")
m.add(risk)

gi = Geoimport("nuts1.json",polygon_style=lambda p:{"fill":"none"}) # https://github.com/martinjc/UK-GeoJSON/blob/master/json/eurostat/ew/nuts1.json
m.add(gi)


vs.add(Text("England & Wales Covid Risk Estimates - Sample 18th July 2020"))
hs.add(m)
vs.add(Legend(palette))
hs.add(vs)
d.add(hs)

html = d.draw(format="html")
f = open("england_wales_risk.html", "w")
f.write(html)
f.close()

