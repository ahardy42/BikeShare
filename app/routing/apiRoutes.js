var axios = require("axios");
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
            res.json(response.data); // send an array of networks to the front-end
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
            res.json(response.data);
        })
        .catch(function(error) {
            console.log(error);
        });
    });

}