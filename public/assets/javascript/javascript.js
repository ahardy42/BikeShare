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

    function makeBikeStationIcon(station) {
        var color = styleMarker(station);
        var locationIcon = L.divIcon({
            html: `<i class='fas fa-bicycle' style='color: ${color}'></i>`,
            iconSize: [16, 16]
        });
        return locationIcon;
    }

    function shareMarker(share) {
        var marker = L.marker([share.location.latitude, share.location.longitude], {
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
            location.textContent = `City: ${network.location.city}, Country: ${network.location.country}`;
            getBikes.setAttribute("data-id", network.id);
            getBikes.setAttribute("data-latitude", network.location.latitude);
            getBikes.setAttribute("data-longitude", network.location.longitude);
            getBikes.textContent = "Click To See Bikes";
            div.appendChild(title);
            div.appendChild(location);
            div.appendChild(getBikes);
        } else if (type === "station") {
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
            response.networks.forEach(network => {
                var marker = shareMarker(network);
                var popup = sharePopup(network, "share");
                marker.bindPopup(popup);
                allShares.addLayer(marker);
            });
            allShares.addTo(map);
            layerControl.addOverlay(allShares, "All Shares");
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
        console.log(map.hasLayer(allShares));
        $.ajax(`/api/${id}`, {
            method: "GET"
        }).then(function(response) {
            response.forEach(station => {
                var marker = stationMarker(station);
                var popup = sharePopup(station, "station");
                marker.bindPopup(popup);
                allStations.addLayer(marker);
            })
            allStations.addTo(map);
            allShares.removeFrom(map);
            layerControl.addOverlay(allStations, "Stations");
        }).catch(function(error) {
            console.log(error);
        });
    })
});