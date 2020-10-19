
var configuration = {};

function lookup(obj,keys,replacement) {
    var v = obj;
    for(var k in keys) {
        let key = keys[k];
        if (v !== undefined && key in v) {
            if (k == keys.length-1 && replacement !== undefined) {
                v[key] = replacement;
            } else {
                v = v[key];
            }
        } else {
            return null;
        }
    }
    return v;
}
async function loadConfiguration() {
    var sub_keys = ["title","headline","about_html","advice_by_risk.very_high","advice_by_risk.high","advice_by_risk.medium","advice_by_risk.low"];
    for(var idx in sub_keys) {
        var keylist = sub_keys[idx].split(".");
        var value = lookup(configuration,keylist);
        if (value) {
            if (value.endsWith(".html")) {
                // the value is a URL pointing to an HTML file?  Replace with the URL contents
                var r = await fetch(value,{cache: "no-store"});
                if (r.ok) {
                    value = await r.text();
                    // substitute the contents back into the configuration
                    lookup(configuration,keylist,value);
                }
            }
            if (keylist.length==1) {
                var key = keylist[0];
                var ele = document.getElementById(key);
                if (ele) {
                    if (key.endsWith("html")) {
                        ele.innerHTML = value;
                    } else {
                        ele.appendChild(document.createTextNode(value));
                    }
                }
            }
        }
    }
}

async function configure() {
    let r = await fetch("config/config.json",{cache: "no-store"});
    configuration = await r.json();
    await loadConfiguration();
}

function getBand(d,field_name) {
    if (field_name == configuration["combined_field_name"]) {
        return d;
    }
    var thresholds =  configuration["risk_thresholds"][field_name];
    var band = thresholds.length;
    for(var idx=0; idx<thresholds.length; idx++) {
        if (d < thresholds[idx]) {
            band = idx;
            break;
        }
    }
    return band;
}

function getColour(d) {
    var band = getBand(d,configuration["selected_field"]);
    return this.configuration["risk_colours"][band];
}

function getLabel(d) {
    var band = getBand(d,configuration["selected_field"]);
    return this.configuration["risk_labels"][band];
}

function getCategory(d) {
    var band = getBand(d,configuration["selected_field"]);
    return this.configuration["risk_categories"][band];
}
