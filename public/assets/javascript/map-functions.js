
const m = {
    makeBikeStationIcon: function(station) {
        let color = this.styleMarker(station);
        let locationIcon = L.divIcon({
            html: `<i class='fas fa-bicycle' style='color: ${color}'></i>`,
            iconSize: [16, 16]
        });
        return locationIcon;
    },
    styleMarker: function(station) {
        let currLayer = station;
        return  currLayer.ratio > 0.4 ? "#40ff00":
                currLayer.ratio > 0.1 ? "#ffbf00":
                                        "#ff0000";
    },
    shareMarker: function(share) {
        let marker = L.marker(share.latlng, {
            icon: bikeIcon,
            title: share.name
        });
        return marker;
    },
    stationMarker: function(station) {
        let marker = L.marker(station.latlng, {
            icon: this.makeBikeStationIcon(station),
            title: station.name
        });
        return marker;
    },
    sharePopup: function(network, type) {
        let div = document.createElement("div");
        let title = document.createElement("h2");
        title.className = "popup-title";
        let location = document.createElement("p");
        location.className = "popup-location";
        let getBikes = document.createElement("button");
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
            let bikesInfoP = document.createElement("p");
            bikesInfoP.className = "popup-bikes";
            bikesInfoP.innerHTML = `Available Bikes: ${network.bikes}<br>Available Slots: ${network.slots}`;
            div.appendChild(title);
            div.appendChild(location);
            div.appendChild(bikesInfoP);
        }
        let popup = L.popup().setContent(div);
        // getBikes.setAttribute("data-popupId", popup._leaflet_id);
        return popup;
    },
    buildLayerGroup: function(response, type, removeLayer) {
        allStations.clearLayers();
        response.forEach(element => {
            if (type === "station" || type === "refresh") {
                var marker = this.stationMarker(element);
            } else {
                var marker = this.shareMarker(element);
            }
            var popup = this.sharePopup(element, type);
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
    },
    refreshShares: function(id) {
        setInterval(function() {
            $.ajax(`/api/${id}`)
            .then(function(response) {
                console.log("refresh ran");
                buildLayerGroup(response, "refresh");
            })
            .catch(function(error) {
                console.log(error);
            });
        }, 5 * 60 * 1000);
    },
    stopRefresh: function() {
        clearInterval(this.refreshShares);
    },
    insertionSort: function(objectArray) {
        let len = objectArray.length;
        for (i = 1; i < len; i++) {
            let key = objectArray[i];
            let j = i - 1;
            while (j >= 0 && objectArray[j].distance > key.distance) {
                objectArray[j + 1] = objectArray[j];
                j = j - 1;
            }
            objectArray[j + 1] = key;
        }
        return objectArray;
    }
}