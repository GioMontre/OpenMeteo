document.addEventListener("DOMContentLoaded", async function() {
    const city = localStorage.getItem("city");
    if (city) {
        try {
            const value = await getValueApi(city);
            if (value) {
                displayCityData(value);
            } else {
                displayCityNotFound(city);
            }
        } catch (error) {
            console.error("Error in getValueApi:", error);
            displayCityNotFound(city);
        }
    } else {
        console.log("No city found in localStorage.");
    }
});

async function getValueApi(city) {
    try {
        const result = await getWeather(city);
        if (result !== null) {
            try {
                const locationData = await addGeoLocation(city, result);
                const cityData = {
                    city: city,
                    weather: result,
                    location: locationData
                };
                return cityData;
            } catch (error) {
                console.error("Error in addGeoLocation:", error);
                return null;
            }
        } else {
            console.log(`No weather data available for ${city}`);
            return null;
        }
    } catch (error) {
        console.error('Error in getValueApi:', error);
        throw error;
    }
}

async function addGeoLocation(city, dict) {
    const reverseGeocodingUrl = `https://api.geoapify.com/v1/geocode/reverse?lat=${dict.coord.lat}&lon=${dict.coord.lon}&apiKey=354fcfd657734f76bc87edf4fd76fc77`;

    try {
        const result = await fetch(reverseGeocodingUrl);
        if (!result.ok) {
            throw new Error(`Error fetching geo location: ${result.statusText}`);
        }
        const featureCollection = await result.json();
        return featureCollection;
    } catch (error) {
        console.error('Error fetching geo location:', error);
        throw error;
    }
}

async function getWeather(location) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=c66e5643579160d1a33ffce684e0b525&units=metric`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            if (response.status === 404) {
                console.error("City not found:", location);
                return null;
            }
            throw new Error(`Error fetching weather data: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

function displayCityNotFound(cityName) {
        const mainFrameDiv = document.getElementById('city-data');
        mainFrameDiv.innerHTML = `
            <div class="not-found-message">
                <div class="message main-message">${cityName} not found</div>
                <div class="message">We're working on that. <br>If you think it's our mistake, please contact us to help us.</div>
            </div>
        `;
        // Style the not-found-message div
        const notFoundMessageDiv = document.querySelector('.not-found-message');
        notFoundMessageDiv.style.display = 'flex';
        notFoundMessageDiv.style.flexDirection = 'column'; // Stack i messaggi verticalmente
        notFoundMessageDiv.style.justifyContent = 'center';
        notFoundMessageDiv.style.alignItems = 'center';
        notFoundMessageDiv.style.height = '50vh'; // Altezza desiderata
        notFoundMessageDiv.style.margin = 'auto'; // Per centrare il div
        notFoundMessageDiv.style.marginTop = '50px'; // Aggiungi spazio sopra
        notFoundMessageDiv.style.marginBottom = '50px'; // Aggiungi spazio sotto
        // Style the message divs
        const messageDivs = document.querySelectorAll('.message');
        messageDivs.forEach(div => {
            div.style.fontSize = '20px';
            div.style.textAlign = 'center';
            div.style.maxWidth = '80%';
            div.style.padding = '20px';
            div.style.margin = '30px 0'; // Aggiungi spazio tra i messaggi
        });
        // Style the main-message div
        const mainMessageDiv = document.querySelector('.main-message');
        mainMessageDiv.style.fontSize = '40px'; // Aumenta la dimensione del testo
        mainMessageDiv.style.color = 'black'; // Cambia il colore del testo
        mainMessageDiv.style.fontWeight = 'bold'; // Rendi il testo in grassetto
    }

    function displayCityData(data) {
        const cityDataDiv = document.getElementById('city-data');
    
        const weather = data.weather;
        const location = data.location.features[0].properties;
        const city = location.city;
        const countryName = location.country;
    
        cityDataDiv.innerHTML = `
            <div class="section">
                <h2>${city}, ${location.state} (${countryName})</h2>
                <p><strong>Address:</strong> ${location.formatted}</p>
            </div>
            <div class="section">
                <h3>Weather</h3>
                <p><strong>Temperature:</strong> ${weather.main.temp}°C</p>
                <p><strong>Feels Like:</strong> ${weather.main.feels_like}°C</p>
                <p><strong>Conditions:</strong> ${weather.weather[0].description}</p>
                <p><strong>Humidity:</strong> ${weather.main.humidity}%</p>
                <p><strong>Pressure:</strong> ${weather.main.pressure} hPa</p>
                <p><strong>Wind Speed:</strong> ${weather.wind.speed} m/s</p>
            </div>
            <div id="map" class="section">
                <iframe loading="lazy" width="100%" height="400" src="https://maps.google.com/maps?hl=en&amp;q=${city}+${countryName}&amp;ie=UTF8&amp;t=&amp;output=embed&amp;format=jpeg" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe>
            </div>
            <div id="temp-chart" class="section chart"></div>
            <div id="other-chart" class="section chart"></div>
        `;
    
        // Temperature Chart
        const tempData = [
            {label: 'Measured Temp', value: weather.main.temp},
            {label: 'Feels Like Temp', value: weather.main.feels_like}
        ];
    
        createBarChart('#temp-chart', tempData, 'Temperature (°C)');
    
        // Other Weather Data Chart
        const otherData = [
            {label: 'Humidity', value: weather.main.humidity},
            {label: 'Pressure', value: weather.main.pressure}
        ];
    
        createBarChart('#other-chart', otherData, 'Other Metrics');
    
        function createBarChart(selector, data, title) {
            const svg = d3.select(selector).append('svg')
                .attr('width', '100%')
                .attr('height', 300);
    
            const margin = {top: 20, right: 30, bottom: 50, left: 60},
                  width = +svg.node().getBoundingClientRect().width - margin.left - margin.right,
                  height = +svg.attr('height') - margin.top - margin.bottom;
    
            const g = svg.append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);
    
            const x = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.value)])
                .range([0, width]);
    
            const y = d3.scaleBand()
                .domain(data.map(d => d.label))
                .range([0, height])
                .padding(0.1);
    
            g.append('g')
                .selectAll('.bar')
                .data(data)
                .enter().append('rect')
                .attr('class', 'bar')
                .attr('y', d => y(d.label))
                .attr('width', d => x(d.value))
                .attr('height', y.bandwidth())
                .on('mouseover', function(event, d) {
                    d3.select(this).attr('fill', 'orange');
                })
                .on('mouseout', function(event, d) {
                    d3.select(this).attr('fill', 'steelblue');
                });
    
            g.append('g')
                .attr('class', 'x-axis')
                .attr('transform', `translate(0,${height})`)
                .call(d3.axisBottom(x).ticks(5))
                .append('text')
                .attr('class', 'axis-label')
                .attr('x', width / 2)
                .attr('y', 40)
                .attr('fill', '#000')
                .text(title);
    
            g.append('g')
                .attr('class', 'y-axis')
                .call(d3.axisLeft(y));
        }
    }