
function parseDate(s) {
    // parse date of the form YYYY-MM-DD HH:MM:SS
    var year = parseInt(s.slice(0,4));
    var month = parseInt(s.slice(5,7));
    var day = parseInt(s.slice(8,10));
    var hour = parseInt(s.slice(11,13));
    var minute = parseInt(s.slice(14,17));
    var second = parseInt(s.slice(18,20));

    return new Date(Date.UTC(year,month-1,day,hour,minute,second,0));
}

/**
 * Format a javascript Date according to the locale
 * @param dt
 * @returns {string}
 */
function formatDate(dt) {
    return dt.toLocaleString();
}

function configureSelect(id, values, labels, cb, initial_value) {
    var sel = document.getElementById(id);
    sel.innerHTML = "";
    var initial_index = -1;
    for(var idx=0; idx<values.length; idx++) {
        var opt_ele = document.createElement("option");
        opt_ele.setAttribute("value",values[idx]);
        var label_txt = document.createTextNode(labels[idx]);
        opt_ele.appendChild(label_txt);
        sel.appendChild(opt_ele);
        if (initial_value != undefined && values[idx] == initial_value) {
            initial_index = idx;
        }
    }
    if (initial_index >= 0) {
        sel.selectedIndex = initial_index;
    }
    sel.onchange = function(evt) {
        cb(sel.value);
    }
}

function wraps(s) {
    return "&nbsp;"+s+"&nbsp;";
}
