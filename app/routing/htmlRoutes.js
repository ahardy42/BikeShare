// Using the path package to create URI for request routes
var path = require("path");

// ===============================================================================
// ROUTING
// ===============================================================================

module.exports = function (app) {
    // HTML GET Requests
    // ---------------------------------------------------------------------------
    app.get("/", function (req, res) {
        res.sendFile(path.join(__dirname, "../../public/home.html"));
    });

    // If no matching route is found default to home
    app.get("*", function (req, res) {
        res.sendFile(path.join(__dirname, "../../public/home.html"));
    });

}