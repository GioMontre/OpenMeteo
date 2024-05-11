/*
GLOBO
chiama lo switchCountry
*/
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

    function selectCountry(id) {
        console.log (id);
        var dataItem = polygonSeries.getDataItemById(id);
        var countryName = dataItem.dataContext.name;
        console.log (countryName);
        // Call function
        printCities(countryName, "../data/json/basic.json" );
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



function getWeather(location) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=c66e5643579160d1a33ffce684e0b525&units=metric`;
    console.log (apiUrl)

    // Make a GET request
    return fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
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


function printCities(inputString, jsonFileURL) {
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
    var dict_city = {};
    fetch(jsonFileURL)
        .then(response => response.json())
        .then(async data => {
            const state = inputString.trim();
            if (data.states.hasOwnProperty(state)) {
                const cities = data.states[state];
                const promises = cities.map(city => getWeather(city));
                const results = await Promise.all(promises);
                cities.forEach((city, index) => {
                    // Verifica se il risultato della funzione getWeather è null
                    if (results[index] !== null) {
                        dict_city[city] = results[index];
                    }
                });
                document.querySelector('.cities-block').innerHTML = '';
                cities.forEach(city => {
                    // Aggiungi la città alla lista solo se il risultato non è null
                    if (dict_city.hasOwnProperty(city)) {
                        const cityDiv = document.createElement("div");
                        cityDiv.textContent = `${city}: ${JSON.stringify(dict_city[city])}`;
                        document.querySelector('.cities-block').appendChild(cityDiv);
                    }
                });
            } else {
                document.querySelector('.cities-block').innerHTML = '';
                console.log(`Lo stato "${state}" non è presente nel file JSON.`);
            }
        })
        .catch(error => console.error('Si è verificato un errore:', error));
}
