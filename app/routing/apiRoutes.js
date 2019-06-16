var axios = require("axios");
var moment = require("moment");
// ===============================================================================
// ROUTING
// ===============================================================================

module.exports = function (app) {
    // API GET Requests
    // Below code handles when users "visit" a page.
    // In each of the below cases when a user visits a link
    // (ex: localhost:PORT/api/admin... they are shown a JSON of the data in the table)
    // ---------------------------------------------------------------------------

    app.get("/api/explore", function(req, res) {
        // grab all shares and send to the front-end to use to create a layer group
        var url = "https://api.citybik.es/v2/networks/";
        axios.get(url)
        .then(function (response) {
            var shares = [];
            var responseShares = response.data.networks;
            responseShares.forEach(element => {
                shares.push({
                    city: element.location.city,
                    country: element.location.country,
                    latlng: [element.location.latitude, element.location.longitude],
                    id: element.id,
                    name: element.name
                });
            });
            res.json(shares); // send an array of networks to the front-end
        })
        .catch(function(error) {
            console.log(error);
        });
    });

    app.get("/api/:id", function(req, res) {
        var id = req.params.id;
        var url = `https://api.citybik.es/v2/networks/${id}`;
        axios.get(url)
        .then(function (response) {
            console.log(response);
            var shares = [];
            var responseShares = response.data.network.stations;
            responseShares.forEach(element => {
                shares.push(
                    {
                        slots: element.empty_slots,
                        bikes: element.free_bikes,
                        latlng: [element.latitude, element.longitude],
                        ratio: element.free_bikes / (element.free_bikes + element.empty_slots),
                        name: element.name,
                        updated: moment(element.extra.last_updated, "X").format('MMMM Do YYYY, h:mm:ss a')
                    }
                );
            });
            res.json(shares);
        })
        .catch(function(error) {
            console.log(error);
        });
    });

    app.get("/api/search/:input", function(req, res) {
        var input = req.params.input;
        var url = `https://nominatim.openstreetmap.org/?q=${input}&format=json`;
        axios.get(url)
        .then(function(response) {
            var responseArray = response.data;
            var filteredArray = [];
            responseArray.forEach(element => {
                if (element.type === "city") {
                    var filteredElement = {
                        id: element.place_id,
                        name: element.display_name,
                        latlng: [parseFloat(element.lat), parseFloat(element.lon)],
                        bbox: element.boundingbox
                    }
                    filteredArray.push(filteredElement);
                }
            });
            res.json(filteredArray); // array of elements from response.data that are of type = city
        })
        .catch(function(error) {
            console.log(error);
        });
    })

}