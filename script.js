'use strict';

let latitude = 0;
let longitude = 0;
const locationElement = document.getElementById("city");
const currentTempElement = document.querySelector(".temp");
const dateElement = document.getElementById("date");
const feelsLikeElement = document.getElementById("feels");
const highTempElement = document.getElementById("high");
const lowTempElement = document.getElementById("low");
const conditionIconElement = document.getElementById("condition-icon");
const conditionTextElement = document.getElementById("condition");
const otherTime = document.querySelectorAll(".t");
const otherTemp = document.querySelectorAll(".deg");
const rainPop = document.querySelectorAll(".pop");
const otherIcon = document.querySelectorAll(".icon");
const humidityElement = document.querySelector(".humidity");
const windElement = document.querySelector(".wind");
const uvElement = document.querySelector(".uv");
const pressureElement = document.querySelector(".pressure");
const visibilityElement = document.querySelector(".visibility");
const sunriseSunsetElement = document.querySelector(".sunrise-sunset");
const daysElement = document.querySelectorAll(".day");
const rainElement = document.querySelectorAll("#daily .pop");
const dailyHighElement = document.querySelectorAll("#daily .hi");
const dailyLowElement = document.querySelectorAll("#daily .lo");
const rangeElement = document.querySelectorAll("#daily .range");
const otherIconElement = document.querySelectorAll("#daily .icon");
let weatherCode;
let city;
let mesurementUnit = "c";

const weatherConditions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",

    45: "Fog",
    48: "Rime fog",

    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",

    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",

    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",

    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",

    85: "Slight snow showers",
    86: "Heavy snow showers",

    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    97: "Heavy thunderstorm",
    99: "Heavy thunderstorm with hail"
};

const weatherIcons = {
    0: "☀️",   // Clear sky
    1: "🌤️",   // Mainly clear
    2: "⛅",   // Partly cloudy
    3: "☁️",   // Overcast

    45: "🌫️",  // Fog
    48: "🌫️",  // Rime fog

    51: "🌦️",  // Light drizzle
    53: "🌦️",  // Moderate drizzle
    55: "🌧️",  // Dense drizzle
    56: "🌧️❄️", // Light freezing drizzle
    57: "🌧️❄️", // Dense freezing drizzle

    61: "🌦️",  // Slight rain
    63: "🌧️",  // Moderate rain
    65: "⛈️",  // Heavy rain
    66: "🌧️❄️", // Light freezing rain
    67: "🌧️❄️", // Heavy freezing rain

    71: "🌨️",  // Slight snow
    73: "❄️",   // Moderate snow
    75: "❄️🌨️", // Heavy snow
    77: "❄️",   // Snow grains

    80: "🌦️",  // Slight rain showers
    81: "🌧️",  // Moderate rain showers
    82: "⛈️",  // Violent rain showers

    85: "🌨️",  // Slight snow showers
    86: "❄️🌨️", // Heavy snow showers

    95: "⛈️",  // Thunderstorm
    96: "⛈️🧊", // Thunderstorm with hail
    97: "🌩️",  // Heavy thunderstorm
    99: "🌩️🧊" // Heavy thunderstorm with hail
};

const radios = document.querySelectorAll('input[name="unit"]');

radios.forEach(radio => {
    radio.addEventListener("change", () => {
        mesurementUnit = document.querySelector('input[name="unit"]:checked').value;
    });
});

const form = document.querySelector("#search-form");
const input = document.querySelector("#city-input");

const suggestions = document.getElementById("suggestions");
const statusElement = document.getElementById("status");

let typingTimer;
let searchId = 0;

// ---------- helpers ----------

async function searchCities(name) {
    const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5`
    );
    if (!res.ok) throw new Error("Geocoding failed");
    const data = await res.json();
    return data.results || [];
}

function hideSuggestions() {
    suggestions.hidden = true;
    suggestions.textContent = "";
}

function showSuggestions(places) {
    suggestions.textContent = "";
    places.forEach(place => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = [place.name, place.admin1, place.country].filter(Boolean).join(", ");
        btn.addEventListener("click", () => chooseCity(place));
        li.appendChild(btn);
        suggestions.appendChild(li);
    });
    suggestions.hidden = false;
}

function chooseCity(place) {
    clearTimeout(typingTimer);
    searchId++;                        // cancel any search still in flight
    latitude = place.latitude;
    longitude = place.longitude;
    locationElement.textContent = place.name + ", " + place.country_code;
    statusElement.textContent = "";
    input.value = "";
    hideSuggestions();
    getWeather(latitude, longitude);
}

// ---------- listeners ----------

// live suggestions while typing
input.addEventListener("input", () => {
    clearTimeout(typingTimer);
    const name = input.value.trim();

    if (name.length < 2) {
        searchId++;
        hideSuggestions();
        return;
    }

    typingTimer = setTimeout(async () => {
        const id = ++searchId;
        try {
            const places = await searchCities(name);
            if (id !== searchId) return;       // a newer search has started
            if (places.length === 0) hideSuggestions();
            else showSuggestions(places);
        } catch (error) {
            hideSuggestions();
        }
    }, 300);
});

// Enter / Search button
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearTimeout(typingTimer);
    const id = ++searchId;
    const name = input.value.trim();
    if (!name) return;

    try {
        const places = await searchCities(name);
        if (id !== searchId) return;
        if (places.length === 0) {
            statusElement.textContent = `No city found for "${name}".`;
            hideSuggestions();
        } else if (places.length === 1) {
            chooseCity(places[0]);
        } else {
            statusElement.textContent = "";
            showSuggestions(places);
        }
    } catch (error) {
        statusElement.textContent = "Couldn't reach the weather service. Try again.";
    }
});

// ArrowDown moves from the input into the list
input.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown") return;
    const first = suggestions.querySelector("button");
    if (first) {
        e.preventDefault();
        first.focus();
    }
});

// close the list on outside click or Escape
document.addEventListener("click", (e) => {
    if (!form.contains(e.target)) hideSuggestions();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideSuggestions();
});

window.addEventListener("load", () => {
    document.getElementById("unit-c").checked = true;
    mesurementUnit = "c";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
});

function showPosition(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    gettingDate();
    getWeather(latitude, longitude);
    getCityName(latitude, longitude)
        .then(name => {
            locationElement.textContent = name;
        })
        .catch(error => {
            console.error("Error fetching city name:", error);
        });
}

function getLatLon(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                latitude = data.results[0].latitude;
                longitude = data.results[0].longitude;
                locationElement.textContent = data.results[0].name + ", " + data.results[0].principalSubdivisionCode.slice(-2) || "" + data.results[0].country_code;
                return true; // City found
            } else {
                return false; // City not found
            }
        });
}

function getWeather(latitude, longitude) {
    const unit = mesurementUnit === "f" ? "fahrenheit" : "celsius";
    const imperial = mesurementUnit === "f";
    const apiKey =
        "https://api.open-meteo.com/v1/forecast?latitude=" +
        latitude +
        "&longitude=" +
        longitude +
        "&current=temperature_2m,pressure_msl,visibility,uv_index,wind_speed_10m,relative_humidity_2m,apparent_temperature,weather_code" +
        "&hourly=temperature_2m,precipitation_probability" +
        "&daily=temperature_2m_max,temperature_2m_min,sunrise,precipitation_probability_max,sunset,temperature_2m_min" +
        "&temperature_unit=" + unit +
        "&wind_speed_unit=" + (imperial ? "mph" : "kmh") +
        "&visibility_unit=" + (imperial ? "mi" : "km") +
        "&forecast_days=7" +
        "&timezone=auto";
    fetch(apiKey)
        .then(response => response.json())
        .then(data => {
            const d = new Date(data.current.time);
            const nextHours = Array.from({ length: 10 }, (_, i) => {
                const hour = (d.getHours() + i) % 24;
                return hour + ":00";
            });
            const startIndex = d.getHours();
            const temperatures = data.hourly.temperature_2m.slice(startIndex, startIndex + 10);
            const rainChance = data.hourly.precipitation_probability.slice(startIndex, startIndex + 10);

            currentTempElement.textContent = Math.round(data.current.temperature_2m) + "°";
            feelsLikeElement.textContent = Math.round(data.current.apparent_temperature) + "°";
            lowTempElement.textContent = Math.round(data.daily.temperature_2m_min[0]) + "°";
            highTempElement.textContent = Math.round(data.daily.temperature_2m_max[0]) + "°";

            pressureElement.textContent = imperial
                ? Math.round(data.current.pressure_msl * 0.02953) + " inHg"   // e.g. 30.01 inHg
                : Math.round(data.current.pressure_msl) + " hPa";
            humidityElement.textContent = data.current.relative_humidity_2m + "%";
            windElement.textContent = Math.round(data.current.wind_speed_10m) + (imperial ? " mph NW" : " km/h NW");
            if (data.current.uv_index <= 2) {
                uvElement.textContent = Math.round(data.current.uv_index) + " · Low";
            } else if (data.current.uv_index <= 5) {
                uvElement.textContent = Math.round(data.current.uv_index) + " · Moderate";
            } else if (data.current.uv_index <= 7) {
                uvElement.textContent = Math.round(data.current.uv_index) + " · High";
            } else if (data.current.uv_index <= 10) {
                uvElement.textContent = Math.round(data.current.uv_index) + " · Very High";
            } else {
                uvElement.textContent = Math.round(data.current.uv_index) + " · Extreme";
            }
            visibilityElement.textContent = imperial
                ? Math.round(data.current.visibility / 1609.34) + " mi"
                : Math.round(data.current.visibility / 1000) + " km";
            sunriseSunsetElement.textContent = data.daily.sunrise[0].slice(11, 16) + " / " + data.daily.sunset[0].slice(11, 16);
            weatherCode = data.current.weather_code;
            conditionTextElement.textContent = weatherConditions[weatherCode];
            conditionIconElement.textContent = weatherIcons[weatherCode];
            for (let i = 0; i < nextHours.length; i++) {
                if (i === 0) {
                    otherTime[i].textContent = "Now";

                } else {
                    otherTime[i].textContent = nextHours[i];
                }
                otherTemp[i].textContent = Math.round(temperatures[i]) + "°";
                rainPop[i].textContent = rainChance[i] + "%";
                otherIcon[i].textContent = weatherIcons[weatherCode];
            }
            const days = data.daily.time.map((dateStr, i) => {
                if (i === 0) return "Today";
                return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });
            });
            const rain = data.daily.precipitation_probability_max;
            for (let i = 0; i < days.length; i++) {
                daysElement[i].textContent = days[i];
            }
            for (let i = 0; i < rain.length; i++) {
                rainElement[i].textContent = rain[i] + "%";
            }
            const highs = data.daily.temperature_2m_max;
            const lows = data.daily.temperature_2m_min;
            for (let i = 0; i < highs.length; i++) {
                dailyHighElement[i].textContent = Math.round(highs[i]) + "°";
                dailyLowElement[i].textContent = Math.round(lows[i]) + "°";
            }
            const weekMin = Math.min(...lows);
            const weekMax = Math.max(...highs);
            const span = weekMax - weekMin;

            for (let i = 0; i < rangeElement.length; i++) {
                const lo = ((lows[i] - weekMin) / span) * 100;
                const hi = ((highs[i] - weekMin) / span) * 100;

                rangeElement[i].style.setProperty("--lo", lo + "%");
                rangeElement[i].style.setProperty("--hi", hi + "%");
            }
            for (let i = 0; i < otherIconElement.length; i++) {
                otherIconElement[i].textContent = weatherIcons[weatherCode];
            }
        })
        .catch(error => {
            console.error("Error fetching weather data:", error);
        })
        .finally(() => {
            fetchDone();
        });
}

radios.forEach(radio => {
    radio.addEventListener("change", () => {
        mesurementUnit = radio.value;
        if (latitude === 0 && longitude === 0) return;   // no location loaded yet
        getWeather(latitude, longitude);
    });
});

// Getting my location name based on the coordinates
function getCityName(latitude, longitude) {
    const apiKey = "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" + latitude + "&longitude=" + longitude + "&localityLanguage=en";
    return fetch(apiKey)
        .then(response => response.json())
        .then(data => {
            const city = data.city || data.locality || data.principalSubdivision || "Unknown Location";
            const code = data.countryCode || "Unknown Country";
            const region = data.principalSubdivisionCode.slice(-2) || "";
            return city + ", " + region;
        });
}

function gettingDate() {
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const formattedDate = now.toLocaleDateString('en-US', options);
    dateElement.textContent = formattedDate;
}

const skeletonElement = document.querySelector(".skeleton");
let firstLoad = true;

const pageElement = document.querySelector(".page");

function fetchDone() {
    skeletonElement.style.display = "none";
    pageElement.style.display = "flex";
}

function startUp() {
    document.getElementById("unit-c").checked = true;
    mesurementUnit = "c";

    const fail = (message) => {
        if (pageElement.style.display === "flex") return;   // already showing
        fetchDone();
        statusElement.textContent = message;
    };

    if (!navigator.geolocation) {
        fail("Location isn't supported. Search for a city to see the forecast.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        showPosition,
        () => fail("Location unavailable. Search for a city to see the forecast."),
        { timeout: 8000, maximumAge: 600000 }
    );

    // safety net: some browsers don't count the time spent on the permission prompt
    setTimeout(() => fail("Still waiting for your location. Search for a city to see the forecast."), 12000);
}