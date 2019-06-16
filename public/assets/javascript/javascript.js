$(document).ready(function() {
    // initialize a map of the world in the background
    var map = L.map('map', {
        center: [37.0902, -95.7129],
        zoom: 2
    });

    var street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
    }).addTo(map);

    // // create layer control
    var baseLayers = {
        "street": street
    }

    var layerControl = new L.control.layers(baseLayers).addTo(map);


    // ====================================================================================
    // global functions
    // ====================================================================================

    // create a sweet bicycle icon 
    var bikeIcon = L.divIcon({
        html: "<i class=\"fas fa-bicycle\"></i>",
        iconSize: [16, 16]
    });

    function shareMarker(share) {
        var marker = L.marker([share.location.latitude, share.location.longitude], {
            icon: bikeIcon,
            title: share.name
        });
        return marker;
    }

    function sharePopup(network, marker) {
        var div = document.createElement("div");
        var title = document.createElement("h1");
        title.className = "popup-title";
        title.textContent = network.name;
        var location = document.createElement("p");
        location.className = "popup-location"
        location.textContent = `City: ${network.location.city}, Country: ${network.location.country}`;
        var getBikes = document.createElement("button");
        getBikes.setAttribute("type", "button");
        getBikes.setAttribute("data-id", network.id);
        getBikes.className = "popup-button";
        getBikes.textContent = "Click To See Bikes";
        div.appendChild(title);
        div.appendChild(location);
        div.appendChild(getBikes);
        var popup = L.popup().setContent(div);
        return popup;
    }


    // ====================================================================================
    // event listeners
    // ====================================================================================

    $("#explore").on("click", function() {
        // this loads all bikeshares using an api call
        $.ajax("/api/explore", {
            method: "GET"
        }).then(function(response) {
            var allShares = L.layerGroup();
            // make markers and put them on the map
            response.networks.forEach(network => {
                var marker = shareMarker(network);
                var popup = sharePopup(network, marker);
                marker.bindPopup(popup);
                allShares.addLayer(marker);
            });
            allShares.addTo(map);
            layerControl.addOverlay(allShares, "All Shares");
        });
    });
});