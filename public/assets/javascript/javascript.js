$(document).ready(function() {
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

    var searchIcon = L.divIcon({
        html: "<i class=\"fas fa-map-pin\"></i>",
        iconSize: [50, 50]
    });

    // create chloropleth colored icons for stations
    function makeBikeStationIcon(station) {
        var color = styleMarker(station);
        var locationIcon = L.divIcon({
            html: `<i class='fas fa-bicycle' style='color: ${color}'></i>`,
            iconSize: [16, 16]
        });
        return locationIcon;
    }

    function shareMarker(share) {
        var marker = L.marker(share.latlng, {
            icon: bikeIcon,
            title: share.name
        });
        return marker;
    }

    function searchMarker(latlng) {
        var marker = L.marker(latlng, {
            icon: searchIcon
        });
        return marker;
    }

    var styleMarker = function(station) { // returns a color value, need to apply this to the inline styling of each icon at layer.options.icon.html
        var currLayer = station;
        return currLayer.ratio > 0.4 ? "#40ff00":
                     currLayer.ratio > 0.1 ? "#ffbf00":
                                              "#ff0000";
    }

    function stationMarker(station) {
        var marker = L.marker(station.latlng, {
            icon: makeBikeStationIcon(station),
            title: station.name
        })
        return marker;
    }

    function sharePopup(network, type) {
        var div = document.createElement("div");
        var title = document.createElement("h2");
        title.className = "popup-title";
        var location = document.createElement("p");
        location.className = "popup-location"
        var getBikes = document.createElement("button");
        getBikes.setAttribute("type", "button");
        getBikes.className = "popup-button";
        if (type === "share") {
            // for a share this is the content for the popup
            title.textContent = network.name;
            location.textContent = `City: ${network.city}, Country: ${network.country}`;
            getBikes.setAttribute("data-id", network.id);
            getBikes.setAttribute("data-latitude", network.latlng[0]);
            getBikes.setAttribute("data-longitude", network.latlng[1]);
            getBikes.textContent = "Click To See Bikes";
            div.appendChild(title);
            div.appendChild(location);
            div.appendChild(getBikes);
        } else if (type === "station" || type === "refresh") {
            // for each station, this is the content
            title.textContent = network.name;
            location.textContent = `Last Updated: ${network.updated}`; 
            var bikesInfoP = document.createElement("p");
            bikesInfoP.className = "popup-bikes";
            bikesInfoP.innerHTML = `Available Bikes: ${network.bikes}<br>Available Slots: ${network.slots}`;
            div.appendChild(title);
            div.appendChild(location);
            div.appendChild(bikesInfoP);
        }
        var popup = L.popup().setContent(div);
        // getBikes.setAttribute("data-popupId", popup._leaflet_id);
        return popup;
    }

    // function to build the layergroup from an api call for either all shares, or a specific share
    // type either equals "share", "station" or "refresh"
    // removeLayer is optional and is used when removing all shares from the map (station button click)
    function buildLayerGroup(response, type, removeLayer) {
        allStations.clearLayers();
        response.forEach(element => {
            if (type === "station" || type === "refresh") {
                var marker = stationMarker(element);
            } else {
                var marker = shareMarker(element);
            }
            var popup = sharePopup(element, type);
            marker.bindPopup(popup);
            if (type === "share") {
                allShares.addLayer(marker);
            } else if (type === "station") {
                allStations.addLayer(marker);
            } else { // case of "refresh"
                allStations.addLayer(marker);
            }
        });
        if (type === "share") {
            allShares.addTo(map);
            layerControl.addOverlay(allShares, "All Shares");
        } else if (type === "station") {
            allStations.addTo(map);
            layerControl.addOverlay(allStations, "Stations");
        }
        if (removeLayer) {
            removeLayer.removeFrom(map);
        }
    }

    // timer for calling API to update shares every 5 minutes
    function refreshShares(id) {
        var refresh = setInterval(function() {
            $.ajax(`/api/${id}`)
            .then(function(response) {
                console.log("refresh ran");
                buildLayerGroup(response, "refresh");
            })
            .catch(function(error) {
                console.log(error);
            });
        }, 5 * 60 * 1000);
    }

    // this function sorts the array of objects based on the value of object.distance
    function insertionSort(objectArray) {
        var len = objectArray.length;
        for (i = 1; i < len; i++) {
            var key = objectArray[i];
            var j = i - 1;
            while (j >= 0 && objectArray[j].distance > key.distance) {
                objectArray[j + 1] = objectArray[j];
                j = j - 1;
            }
            objectArray[j + 1] = key;
        }
        return objectArray;
    }

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

    $("#explore").on("click", function() {
        map.setView([37.0902, -95.7129],3);
        // this loads all bikeshares using an api call
        $.ajax("/api/explore", {
            method: "GET"
        }).then(function(response) {
            // make markers and put them on the map
            buildLayerGroup(response, "share");
        }).catch(function(error) {
            console.log(error);
        });
    });

    $("body").on("click", ".popup-button", function() {
        // zooms to this location 
        // loads bike shares of this network id
        var id = $(this).attr("data-id");
        var latlng = [parseFloat($(this).attr("data-latitude")), parseFloat($(this).attr("data-longitude"))];
        map.flyTo(latlng, 13).closePopup(); // fly to the city where this share is and close the popup
        // start the timer
        refreshShares(id);
        $.ajax(`/api/${id}`, {
            method: "GET"
        }).then(function(response) {
            buildLayerGroup(response, "station", allShares);
        }).catch(function(error) {
            console.log(error);
        });
    });

    $("#search").on("click", function() {
        $(".search-modal").css("display", "block");
    });

    $("#city-search").on("click", function(e) {
        e.preventDefault();

        var input = $("#city-input").val().trim();
        $("#city-input").val("");
        $.ajax(`api/search/${input}`, {
            method: "GET"
        })
        .then(function(response) {
            console.log(response);
            // close this modal and open the next
            $(".search-modal").css("display", "none");
            $(".search-results-modal").css("display", "block");
            var resultDiv = $("#result-list");
            var ul = buildResultModal(response);
            resultDiv.append(ul);
        })
        .catch(function(error) {
            console.log(error);
        });
    });

    $("body").on("click", ".city-result", function() {
        $(".search-results-modal").css("display", "none");
        var latlng = JSON.parse($(this).attr("data-latlng"));
        var resultLatLng = L.latLng(latlng);
        // fly to and add a marker on the map
        map.flyTo(latlng, 10);
        var marker = searchMarker(latlng).addTo(map);
        searchResult.addLayer(marker);
        // get bike shares and find the closest three shares OR any shares within 20 miles
        $.ajax("api/explore", {
            method: "GET"
        })
        .then(function(response) {
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
        .catch(function(error) {
            console.log(error);
        });

    });

    $("#locate").on("click", function() {
        $(".location-modal").css("display", "block");
    });
});