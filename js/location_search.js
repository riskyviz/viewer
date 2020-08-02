async function location_search(location_string) {

    var params = new URLSearchParams({
        "q": location_string,
        "countrycodes": "gb",
        "format": "json"
    });
    fetch("https://nominatim.openstreetmap.org/search?" + params.toString()).then(
        response => response.json()
    ).then(
        results => {
            if (results.length) {
                var lat = Number.parseFloat(results[0]["lat"]);
                var lon = Number.parseFloat(results[0]["lon"]);
                sessionStorage.setItem("latitude", lat);
                sessionStorage.setItem("longitude", lon);
                window.location.assign("local.html");
            }
        }
    )
}


var location_input = document.getElementById("selector");
var location_form = document.getElementById("searchForm");

location_form.onsubmit = function (e) {
    e.preventDefault();
    doSearch();
}

function doSearch() {
    var postcode = location_input.value;
    location_search(postcode);
    location_form.reset();
}