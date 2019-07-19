import m from './map-functions';

// initialize a map of the world in the background
var map = L.map('map', {
    center: [37.0902, -95.7129],
    zoom: 3
});

var street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
}).addTo(map);

// // create layer control
var baseLayers = {
    "street": street
}

var layerControl = new L.control.layers(baseLayers).addTo(map);
var allShares = L.layerGroup();
var allStations = L.layerGroup();
var searchResult = L.layerGroup();

// ====================================================================================
// global functions
// ====================================================================================

// create a sweet bicycle icon 
var bikeIcon = L.divIcon({
    html: "<i class=\"fas fa-bicycle\"></i>",
    iconSize: [16, 16]
});

// ====================================================================================
// page building code 
// ====================================================================================

function buildResultModal(response) {
    var ul = $("<ul class='list-group'>");
    response.forEach(element => {
        var li = $("<li class='list-group-item-action city-result'>");
        li.attr("id", element.id);
        li.attr("data-latlng", JSON.stringify(element.latlng));
        li.text(element.name);
        ul.append(li);
    });
    return ul;
}

// ====================================================================================
// event listeners
// ====================================================================================

$("#explore").on("click", function () {
    map.setView([37.0902, -95.7129], 3);
    // this loads all bikeshares using an api call
    $.ajax("/api/explore", {
        method: "GET"
    }).then(function (response) {
        // make markers and put them on the map
        buildLayerGroup(response, "share");
    }).catch(function (error) {
        console.log(error);
    });
});

$("body").on("click", ".popup-button", function () {
    // zooms to this location 
    // loads bike shares of this network id
    var id = $(this).attr("data-id");
    var latlng = [parseFloat($(this).attr("data-latitude")), parseFloat($(this).attr("data-longitude"))];
    map.flyTo(latlng, 13).closePopup(); // fly to the city where this share is and close the popup
    // start the timer
    refreshShares(id);
    $.ajax(`/api/${id}`, {
        method: "GET"
    }).then(function (response) {
        buildLayerGroup(response, "station", allShares);
    }).catch(function (error) {
        console.log(error);
    });
});

$("#search").on("click", function () {
    $(".search-modal").css("display", "block");
});

$("#city-search").on("click", function (e) {
    e.preventDefault();

    var input = $("#city-input").val().trim();
    $("#city-input").val("");
    $.ajax(`api/search/${input}`, {
        method: "GET"
    })
        .then(function (response) {
            console.log(response);
            if (response.length > 0) {
                $("#warning").css("display", "none");
                // close this modal and open the next
                $(".search-modal").css("display", "none");
                $(".search-results-modal").css("display", "block");
                var resultDiv = $("#result-list");
                var ul = buildResultModal(response);
                resultDiv.append(ul);
            } else {
                // show error message that no results were returned
                $("#warning").css("display", "block");
            }

        })
        .catch(function (error) {
            console.log(error);
        });
});

$("body").on("click", ".city-result", function () {
    $(".search-results-modal").css("display", "none");
    var latlng = JSON.parse($(this).attr("data-latlng"));
    var resultLatLng = L.latLng(latlng);
    // fly to and add a marker on the map
    map.flyTo(latlng, 10);
    // get bike shares and find the closest share OR any shares within x miles
    $.ajax("api/explore", {
        method: "GET"
    })
        .then(function (response) {
            // add distance to each element in the response
            response.forEach(element => {
                var latLng = L.latLng(element.latlng);
                var distance = latLng.distanceTo(resultLatLng);
                element.distance = distance;
            });
            var sortedResponse = insertionSort(response);
            var closestSharesArray = [];
            closestSharesArray.push(sortedResponse[0]);
            buildLayerGroup(closestSharesArray, "share");
        })
        .catch(function (error) {
            console.log(error);
        });

});

$("#locate").on("click", function () {
    $(".location-modal").css("display", "block");
});