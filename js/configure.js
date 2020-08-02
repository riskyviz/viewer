
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
    var sub_keys = ["title","headline","explanation_html","advice_by_risk.high","advice_by_risk.medium","advice_by_risk.low","info_area_html"];
    for(var idx in sub_keys) {
        var keylist = sub_keys[idx].split(".");
        var value = lookup(configuration,keylist);
        if (value) {
            if (value.endsWith(".html")) {
                // the value is a URL pointing to an HTML file?  Replace with the URL contents
                var r = await fetch(value);
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
    let r = await fetch("config/config.json");
    configuration = await r.json();
    await loadConfiguration();
}