class OpenWeatherApi {
    constructor(token) {
        this.apiToken = token;
        this.baseUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&"
    }

    async getWeatherByCityName(city) {
        let response = await fetch(this.baseUrl + "q=" + city + "&appid=" + this.apiToken).catch();

        if (response.ok) {
            return await response.json();
        }

        return null;
    }

    async getWeatherByCoordinates(latitude, longitude) {
        let response = await fetch(
            this.baseUrl + "lon=" + longitude + "&lat=" + latitude + "&appid=" + this.apiToken
        ).catch();

        if (response.ok) {
            return response.json()
        }

        return null;
    }
}

api = new OpenWeatherApi("17687eb6fa5e965d701ccd333cb1d32d");

document.body.onload = function() {
    document.querySelector("#add-city-button").addEventListener("click", addCityClick);
    document.querySelector("#update-geo-button").addEventListener("click", updateMainCity);

    updateMainCity();
    loadCitiesFromLocalStorage();
}

function removeMainCityLoader() {
    document.querySelector("#main-city-wrapper").style.display = "flex";
    document.querySelector("#main-city-loader").style.display = "none";
}

function enableMainCityLoader() {
    document.querySelector("#main-city-wrapper").style.display = "none";
    document.querySelector("#main-city-loader").style.display = "flex";
}

function updateMainCity() {
    enableMainCityLoader();
    [latitude, longitude] = updateGeo();
    loadMainCity(latitude, longitude);
}

function updateGeo() {
    let geo = navigator.geolocation;
    // ITMO Kronverksky 49
    let latitude = 59.9571;
    let longitude = 30.3084;

    geo.getCurrentPosition(position => {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
    })

    return [latitude, longitude]
}

function addCityClick() {
    let cityName = document.querySelector("#add-city-input").value;
    if (!cityName || cityName.trim().length === 0) {
        alert("City name is empty");
        return;
    }

    addCityByName(cityName);
}

function addCityByName(cityName, checkLocalStorage = true) {
    let tmpl = document.querySelector("#weather-template");
    let cities = document.querySelector(".cities");
    let clone = document.importNode(tmpl.content, true);
    cities.appendChild(clone);
    let createdCity = cities.lastElementChild;

    let response = api.getWeatherByCityName(cityName);

    response.then(data => {
        if (data === null) {
            createdCity.remove();
            alert("City not found");
            return;
        }

        if (checkLocalStorage && localStorage.getItem("city_" + data["id"]) !== null) {
            createdCity.remove();
            return;
        }

        localStorage.setItem("city_" + data["id"], data["name"]);
        document.getElementById("add-city-input").textContent = "";

        createdCity.id = "city_" + data["id"];
        createdCity.querySelector(".delete-city-button").id = createdCity.id;

        fillCity(data, createdCity.querySelector(".city"));

        createdCity.querySelector(".loader-wrapper").style.display = "none";
        createdCity.querySelector(".city").style.display = "unset";
        createdCity.querySelector(".delete-city-button").addEventListener("click", deleteCity);
    });

    document.querySelector("#add-city-input").value = "";
}

function fillCity(data, root) {
    let info = root.querySelector(".info, .city-info");

    info.querySelector("h2, h3").textContent = data["name"];

    info.querySelector("span").textContent = Math.floor(data["main"]["temp"]).toString();
    info.querySelector("i").classList.add(getCloudsIconClass(data["weather"][0]["icon"]))
    let parameters = root.querySelector(".city-parameters");
    parameters.querySelector(".wind").querySelector(".content")
        .textContent = getWindDescriptionBySpeed(data["wind"]["speed"]) +
            ", " + data["wind"]["speed"] + " m/s, " +
            degToDirection(data["wind"]["deg"]);
    parameters.querySelector(".clouds").querySelector(".content")
        .textContent = data["weather"][0]["description"];
    parameters.querySelector(".pressure").querySelector(".content")
        .textContent = data["main"]["pressure"] + " hpa";
    parameters.querySelector(".humidity").querySelector(".content")
        .textContent = data["main"]["humidity"] + "%";
    parameters.querySelector(".coordinates").querySelector(".content")
        .textContent = data["coord"]["lon"] + ", " + data["coord"]["lat"];
}

function loadMainCity(latitude, longitude) {
    let response = api.getWeatherByCoordinates(latitude, longitude);

    if (response === null) {
        alert("Error");
        return;
    }

    response.then(data => {
        fillCity(data, document.getElementById("main-city-wrapper"))
        removeMainCityLoader();
    })
}

function deleteCity() {
    localStorage.removeItem(this.id);
    document.querySelector("#" + this.id).remove();
}

function loadCitiesFromLocalStorage() {
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (!key.startsWith("city_")) {
            continue;
        }
        addCityByName(localStorage.getItem(key), false);
    }
}

function degToDirection(num) {
    let directions = [
        "North", "North-northeast", "Northeast", "East-northeast", "East", "East-southeast",
        "Southeast", "South-southeast", "South", "South-southwest", "Southwest",
        "West-southwest", "West", "West-northwest", "Northwest", "North-northwest"
    ];
    return directions[(Math.floor((num / 22.5) + 0.5) % 16)];
}

function getWindDescriptionBySpeed(speed) {
    let descriptions = [
        "Calm", "Light air", "Light breeze", "Gentle breeze", "Moderate breeze", "Fresh breeze",
        "Strong breeze", "High wind", "Gale", "Strong gale", "Storm", "Violent Storm", "Hurricane"
    ];

    let speeds = [0, 2, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];

    let index = 0;
    speeds.forEach(function(el, idx) {
       if (el < speed) {
           index = idx;
       }
    });

    return descriptions[index];
}

const icons = new Map();
icons.set("01", "fa-sun");
icons.set("02", "fa-cloud");
icons.set("03", "fa-cloud");
icons.set("04", "fa-cloud");
icons.set("09", "fa-cloud-showers-heavy");
icons.set("10", "fa-cloud-rain");
icons.set("11", "fa-bolt");
icons.set("13", "fa-snowflake");
icons.set("50", "fa-smog");
icons.set("unknown", "fa-question");


function getCloudsIconClass(iconCode) {
    iconCode = iconCode.substring(0, iconCode.length - 1);

    if (icons.has(iconCode)) {
        return icons.get(iconCode);
    }

    return icons.get("unknown");
}
