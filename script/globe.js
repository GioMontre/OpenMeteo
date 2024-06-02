/*
GLOBO
*/
function addGeoLocation(city, dict) {
    const TOKEN = "354fcfd657734f76bc87edf4fd76fc77" //"YOUR_API_KEY";
    const reverseGeocodingUrl = `https://api.geoapify.com/v1/geocode/reverse?lat=${dict.coord.lat}&lon=${dict.coord.lon}&apiKey=${TOKEN}`;

    // Restituisci una promessa per la risposta dell'API di reverse geocoding
    return fetch(reverseGeocodingUrl)
        .then(result => result.json())
        .then(featureCollection => {
            
            return featureCollection; // Restituisci il dizionario aggiornato
        });
}

function getWeather(location) {
    const TOKEN = "c66e5643579160d1a33ffce684e0b525" //"YOUR_API_KEY";
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${TOKEN}&units=metric`;
    // RENDERE PRIVATO, disabilitare questa key, crearne una nuova e farla private
    // https://blog.gitguardian.com/leaking-secrets-on-github-what-to-do/?utm_source=alerting&utm_medium=email&utm_campaign=abv10AB

    // Make a GET request
    return fetch(apiUrl)
        .then(response => {
            if (response.cod == 404) {
                //LOG ERRORE
                return null;
            }
            return response.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error('Error:', error);
            throw error; // Re-throw the error to propagate it
        });
}

async function printCities(inputString, jsonFileURL) {
    /*
    Il problema qui è che la funzione getWeather ritorna una promessa poiché 
    effettua una richiesta asincrona a un'API esterna. Le operazioni asincrone 
    restituiscono sempre una promessa. Quindi, quando fai return data all'interno 
    della tua catena .then() in printCities, stai effettivamente restituendo una promessa.
    Per risolvere questo problema, devi assicurarti di gestire le promesse correttamente e 
    attendere che venga risolta prima di continuare. Puoi farlo utilizzando 
    async/await o continuando a catenare le promesse. Ecco un esempio utilizzando 
    async/await:
    */
    var citiesBlock = document.querySelector('.cities-block');
    citiesBlock.innerHTML = '<div class="loading-spinner"></div>';
    // Dizionario per memorizzare i dati delle città
    let json_string = ""; // Definisci json_string qui
    const dict_city = {}; // Dizionario per memorizzare i dati delle città

    try {
        // Effettua una richiesta GET per ottenere il file JSON contenente i dati delle città
        const response = await fetch(jsonFileURL);
        // Estrae i dati JSON dalla risposta
        const data = await response.json();
        // Estrai lo stato dalla stringa di input
        const state = inputString.trim();
        // Controlla se lo stato è presente nei dati JSON
        if (data.states.hasOwnProperty(state)) {
            // Estrai l'elenco delle città dallo stato corrispondente
            const cities = data.states[state];
            // Genera una serie di richieste asincrone per ottenere i dettagli meteo di ciascuna città
            const promises = cities.map(city => getWeather(city));
            // Attendi che tutte le richieste asincrone siano risolte
            const results = await Promise.all(promises);
            // Per ogni città, elabora i dati e aggiungili al dizionario
            for (let index = 0; index < cities.length; index++) {
                const city = cities[index];
                const result = results[index];
                if (result !== null) {
                    const cityData = {
                        city: city,
                        weather: result,
                        location: await addGeoLocation(city, result)
                    };
                    dict_city[city] = cityData;
                }
            }
            // Converti il dizionario in una stringa JSON
            json_string = JSON.stringify(dict_city);
        } else {
            // Se lo stato non è presente nei dati JSON, stampa un messaggio di errore
            console.log(`Lo stato "${state}" non è presente nel file JSON.`);
            //throw "state not in file";
        }
    } catch (error) {
        // Gestione degli errori durante il recupero dei dati delle città
        console.error('Si è verificato un errore:', error);
    }

    // Restituisce il dizionario contenente i dati delle città
    // console.log (json_string)
    return json_string;
}


function displayCities(citiesData, countryName) {
    var citiesBlock = document.querySelector('.cities-block');
    
    // Svuota la lista delle città prima di aggiungere le nuove città
    citiesBlock.innerHTML = '';
    
    for (var city in citiesData) {
        if (citiesData.hasOwnProperty(city)) {
            var cityData = citiesData[city];
            var cityContainer = document.createElement('div');
            cityContainer.classList.add('city');

            var cityName = document.createElement('h2');
            cityName.textContent = city;
            cityContainer.appendChild(cityName);

            var cityInfoContainer = document.createElement('div');
            cityInfoContainer.classList.add('city-info');
            var cityWeatherContainer = document.createElement('div');
            cityWeatherContainer.classList.add('city-weather');

            var temperatureContainer = document.createElement('div');
            temperatureContainer.classList.add('temperature-container');
            var temperatureInfo = document.createElement('dov');
            temperatureInfo.classList.add('temperature-info');
            temperatureInfo.innerHTML = '<strong>Temperatura:</strong> ' + cityData.weather.main.temp + '°C';
            temperatureContainer.appendChild(temperatureInfo);
            var temperatureLineContainer = document.createElement('div');
            temperatureLineContainer.classList.add('temperature-line-container');
            var temperatureDot = document.createElement('div');
            temperatureDot.classList.add('temperature-dot');
            var temperature = cityData.weather.main.temp;
            var minTemp = -5; // Temperatura minima della scala
            var maxTemp = 45; // Temperatura massima della scala
            var position = ((temperature - minTemp) / (maxTemp - minTemp)) * 100; // posizione come percentuale sulla scala
            temperatureDot.style.left = position + '%';
            temperatureLineContainer.appendChild(temperatureDot);
            temperatureContainer.appendChild(temperatureLineContainer);
            cityWeatherContainer.appendChild(temperatureContainer);
            
            var descriptionInfo = document.createElement('div');
            descriptionInfo.innerHTML = '<strong>Descrizione:</strong><br> ' + cityData.weather.weather[0].description;
            cityWeatherContainer.appendChild(descriptionInfo);
            
            // var pressureInfo = document.createElement('div');
            // pressureInfo.innerHTML = '<strong>Pressione:</strong><br> ' + cityData.weather.main.pressure + ' hPa';
            // cityWeatherContainer.appendChild(pressureInfo); 
            
            var humidityInfo = document.createElement('div');
            humidityInfo.innerHTML = '<strong>Umidità:</strong><br> ' + cityData.weather.main.humidity + '%';
            cityWeatherContainer.appendChild(humidityInfo);
            
            var windInfo = document.createElement('div');
            windInfo.innerHTML = '<strong>Vento:</strong><br> ' + cityData.weather.wind.speed + ' m/s';
            cityWeatherContainer.appendChild(windInfo);

            cityInfoContainer.appendChild(cityWeatherContainer);

            var cityMapContainer = document.createElement('div');
            cityMapContainer.classList.add('city-map-container');
            cityMapContainer.innerHTML = `<iframe class="map" 20px" loading="lazy" width="100%" height="100%" src="https://maps.google.com/maps?hl=en&amp;q=${city}+${countryName}&amp;ie=UTF8&amp;t=&amp;output=embed&amp;format=jpeg" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe><br/>`;
            cityInfoContainer.appendChild(cityMapContainer);

            cityContainer.appendChild(cityInfoContainer);

            // BACKGROUND
            if (cityData.weather.weather[0].description.toLowerCase().includes("thunderstorm") ) {
                thunderstorm(cityContainer);
            }

            if (cityData.weather.weather[0].description.toLowerCase().includes("rain") || cityData.weather.weather[0].description.toLowerCase().includes("drizzle")) {
                rain(cityContainer);
            }
            
            if (cityData.weather.weather[0].description.toLowerCase().includes("clouds")) {
                clouds(cityContainer, cityData.weather.weather[0].description.toLowerCase());
            }
            
            if (cityData.weather.weather[0].description.toLowerCase() === "clear sky") {
                clearSky(cityContainer);
            }
            
            citiesBlock.appendChild(cityContainer);
        }
    }
}


function thunderstorm(container) {
    console.log ("https://codepen.io/Nvagelis/pen/yaQGrL");
}


function rain(container) {
    console.log ("https://github.com/mubaidr/rainyday.js.git");
}

function clouds(container, data) {
    var cloudDiv = document.createElement('div');
    cloudDiv.style.position = 'absolute';
    cloudDiv.style.top = '0';
    cloudDiv.style.left = '0';
    cloudDiv.style.width = '100%';
    cloudDiv.style.height = '100%';
    cloudDiv.style.backgroundImage = 'url("../img/site/cloud.png")';
    cloudDiv.style.backgroundSize = 'cover';
    if (data === "broken clouds" || data === "few clouds" || data === "scattered clouds"){
        cloudDiv.style.opacity = '15%';
    }   
    if (data === "overcast clouds"){
        cloudDiv.style.opacity = '70%';
    }
    cloudDiv.style.zIndex = '1';
    
    container.style.position = 'relative';
    container.appendChild(cloudDiv);

    var position = 0;
    function animateClouds() {
        position += 0.5;
        cloudDiv.style.backgroundPosition = position + 'px 0';
        requestAnimationFrame(animateClouds);
    }
    animateClouds();
}

function clearSky(container) {
    var cloudDiv = document.createElement('div');
    cloudDiv.style.position = 'absolute';
    cloudDiv.style.top = '0';
    cloudDiv.style.left = '0';
    cloudDiv.style.width = '100%';
    cloudDiv.style.height = '100%';
    cloudDiv.style.backgroundImage = 'url("../img/site/clearSky.png")';
    cloudDiv.style.backgroundSize = 'cover';
    cloudDiv.style.opacity = '15%';
    cloudDiv.style.zIndex = '1';
    
    container.style.position = 'relative';
    container.appendChild(cloudDiv);

    var position = 0;
    function animateClouds() {
        position += 0.5;
        cloudDiv.style.backgroundPosition = position + 'px 0';
        requestAnimationFrame(animateClouds);
    }
    animateClouds();
}

document.addEventListener("DOMContentLoaded", function() {

    am5.ready(function() {

        // Create root element
        var root = am5.Root.new("chartdiv");

        // Set themes
        root.setThemes([
            am5themes_Animated.new(root)
        ]);

        // Create the map chart
        var chart = root.container.children.push(am5map.MapChart.new(root, {
            panX: "rotateX",
            panY: "rotateY",
            projection: am5map.geoOrthographic(),
            paddingBottom: 20,
            paddingTop: 20,
            paddingLeft: 20,
            paddingRight: 20
        }));

        // Create main polygon series for countries
        var polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
            geoJSON: am5geodata_worldLow,
            fill: "#396fa1"
        }));

        polygonSeries.mapPolygons.template.setAll({
            tooltipText: "{name}",
            toggleKey: "active",
            interactive: true
        });
        polygonSeries.mapPolygons.template.states.create("hover", {
            fill: "#abce7b"
            // fill: root.interfaceColors.get("primaryButtonHover")
        });
        polygonSeries.mapPolygons.template.states.create("active", {
            // fill: root.interfaceColors.get("primaryButtonHover")
            fill: "#abce7b"

        });

        // Create series for background fill
        var backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
        backgroundSeries.mapPolygons.template.setAll({
            fill: "#0780c110",
            // fill: root.interfaceColors.get("alternativeBackground"),
            fillOpacity: 0.1,
            strokeOpacity: 0
        });
        backgroundSeries.data.push({
            geometry: am5map.getGeoRectangle(90, 180, -90, -180)
        });

        var graticuleSeries = chart.series.unshift(
            am5map.GraticuleSeries.new(root, {
            step: 10
            })
        );

        graticuleSeries.mapLines.template.set("strokeOpacity", 0)

        // Set up events
        var previousPolygon;
        polygonSeries.mapPolygons.template.on("active", function(active, target) {
            if (previousPolygon && previousPolygon != target) {
                previousPolygon.set("active", false);
            }
            if (target.get("active")) {
                selectCountry(target.dataItem.get("id"));
            }
            previousPolygon = target;
        });

        async function selectCountry(id) {
            var dataItem = polygonSeries.getDataItemById(id);
            var countryName = dataItem.dataContext.name;
            // Chiamata alla funzione printCities
            var dict_city_string = await printCities(countryName, "../data/json/basic.json");
            var dict_city_json =  JSON.parse(dict_city_string);
            // Aggiungi l'output alla div city-block
            displayCities(dict_city_json, countryName);
            var target = dataItem.get("mapPolygon");
            if (target) {
                var centroid = target.geoCentroid();
                if (centroid) {
                    chart.animate({ key: "rotationX", to: -centroid.longitude, duration: 1500, easing: am5.ease.inOut(am5.ease.cubic) });
                    chart.animate({ key: "rotationY", to: -centroid.latitude, duration: 1500, easing: am5.ease.inOut(am5.ease.cubic) });
                }
            }
        }
        polygonSeries.events.on("datavalidated", function() {
            selectCountry("IT");
        });
        // Make stuff animate on load
        chart.appear(1000, 100);
    });})