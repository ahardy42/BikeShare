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

    // ====================================================================================
    // global functions
    // ====================================================================================

    // create a sweet bicycle icon 
    var bikeIcon = L.divIcon({
        html: "<i class=\"fas fa-bicycle\"></i>",
        iconSize: [16, 16]
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

    $("#locate").on("click", function() {
        $(".location-modal").css("display", "block");
    });
});