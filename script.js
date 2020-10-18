document.body.onload = function() {
    let geo = navigator.geolocation;
    let latitude;
    let longitude;

    geo.getCurrentPosition(position => {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
    }, positionError => {
        // ITMO Kronverksky 49
        latitude = 59.9571;
        longitude = 30.3084;
    })


    setTimeout(function () {
        document.getElementById("main-city-wrapper").style.display = "flex";
        document.getElementById("main-city-loader").style.display = "none";
    }, 200)
}
