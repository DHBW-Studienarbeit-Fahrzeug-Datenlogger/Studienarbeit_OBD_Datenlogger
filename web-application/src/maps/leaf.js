//All Markers map
var map0 = L.map( 'map0', {
    center: [20.0, 5.0],
    minZoom: 2,
    zoom: 2
});

var printAllMarkers = async function() {
    map0.remove()

    map0 = L.map( 'map0', {
        center: [20.0, 5.0],
        minZoom: 2,
        zoom: 2
    });

    var customIcon = L.icon({
        iconUrl: '../img/dot.png',

        iconSize:     [4, 4], // size of the icon
        shadowSize:   [0, 0], // size of the shadow
        iconAnchor:   [2, 2], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor:  [2, 2] // point from which the popup should open relative to the iconAnchor
    });

    var allMarkers = [];
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map0);

    var vin = document.getElementById('VIN').value;
    vin = (vin === "") ? "none" : vin; 
    console.log(vin)

    let response = await fetch("/getAllGPS/" + vin, {
        credentials: 'same-origin'
    });
    let markers = await response.json();

    var allMarkers = []

    //averageLength needed for calCar.js
    averageTripLength = markers[markers.length-1].averageTripLength;
    longestTrip = markers[markers.length-1].longestTrip;
    vConsumption = markers[markers.length-1].vConsumption;
    numberOfTrips = 0;

    for(var i = 0; i < (markers.length-1); i++) {
        //console.log(markers[i].GPS_Long.length)
        for (let g = 0; g < markers[i].GPS_Long.length; g++) {
            if(!(markers[i].GPS_Long[g] === null || markers[i].GPS_Lat[g] === null)) {
                //console.log("test")
                allMarkers.push({ 
                    "lat": markers[i].GPS_Lat[g],
                    "lng": markers[i].GPS_Long[g]
                });
                L.marker( [markers[i].GPS_Lat[g], markers[i].GPS_Long[g]], {icon: customIcon})
                    .addTo( map0 );
                /*
                if(g != 0) {
                    var deltaLat = Math.pow(markers[i].GPS_Lat[g] - markers[i].GPS_Lat[g-1], 2);
                    var deltaLong = Math.pow(markers[i].GPS_Long[g] - markers[i].GPS_Long[g-1], 2);
                    averageLengthTrip += Math.sqrt(deltaLat + deltaLong)
                    //console.log("averageLengthTrip: " + averageLengthTrip)
                }*/
            }
        }
        numberOfTrips++;
    }
    if(allMarkers.length != 0) {
        var bounds = L.latLngBounds(allMarkers);
        map0.fitBounds(bounds);
    }
}
printAllMarkers();


//Waiting time map

function parseTime(milliseconds){
    //Get hours from milliseconds
    var hours = milliseconds / (3600000);
    var absoluteHours = Math.floor(hours);
    var h = absoluteHours > 9 ? absoluteHours : '0' + absoluteHours;

    //Get remainder from hours and convert to minutes
    var minutes = (hours - absoluteHours) * 60;
    var absoluteMinutes = Math.floor(minutes);
    var m = absoluteMinutes > 9 ? absoluteMinutes : '0' +  absoluteMinutes;

    //Get remainder from minutes and convert to seconds
    var seconds = (minutes - absoluteMinutes) * 60;
    var absoluteSeconds = Math.floor(seconds);
    var s = absoluteSeconds > 9 ? absoluteSeconds : '0' + absoluteSeconds;


    return h + 'h' + m;
}

var map2 = L.map( 'map2', {
    center: [20.0, 5.0],
    minZoom: 2,
    zoom: 2
});

var printWaitingTime = async function() {
    map2.remove()
    
    map2 = L.map( 'map2', {
        center: [20.0, 5.0],
        minZoom: 2,
        zoom: 2
    });
    
    var LeafIcon = L.Icon.extend({
        options: {
            shadowUrl: 'leaf-shadow.png',
            iconSize:     [182/5, 219/5],
            shadowSize:   [0, 0],
            iconAnchor:   [182/10, 219/5],
            shadowAnchor: [0, 0],
            popupAnchor:  [0, -219/10]
        }
    });

    var redIcon = new LeafIcon({iconUrl: '../img/red.png'}),
        orangeIcon = new LeafIcon({iconUrl: '../img/orange.png'}),
        yellowIcon = new LeafIcon({iconUrl: '../img/yellow.png'});
        greenIcon = new LeafIcon({iconUrl: '../img/green.png'});

    var allMarkers = [];
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map2);

    
    var vin = document.getElementById('VIN').value;
    vin = (vin === "") ? "none" : vin; 
    console.log(vin)

    let response = await fetch("/getWaitingTime/" + vin, {
        credentials: 'same-origin'
    });
    let markers = await response.json();

    var allMarkers = []

    //console.log(markers)
    //console.log(markers[0].gpsLong)
    for(var i = 0; i < markers.length; i++) {
        //console.log(markers[i].gpsLong)
        //console.log(parseTime(markers[i].waitingTime))
        if(markers[i].waitingTime < 1800000) {
            customIcon = redIcon;
        } else if (markers[i].waitingTime < 2 * 1800000 && markers[i].waitingTime > 1800000) {
            customIcon = orangeIcon;
        } else if (markers[i].waitingTime < 8 * 1800000 && markers[i].waitingTime > 2 * 1800000) {
            customIcon = yellowIcon;
        } else {
            customIcon = greenIcon;
        }
        allMarkers.push({ 
            "lat": markers[i].gpsLat,
            "lng": markers[i].gpsLong
        });
        L.marker( [markers[i].gpsLat, markers[i].gpsLong], {icon: customIcon, opacity: 0.7})
            .bindPopup( '<p>Waiting-Time: ' + parseTime(markers[i].waitingTime) + '</p>' )
            .addTo( map2 );

    }
    if(allMarkers.length != 0) {
        var bounds = L.latLngBounds(allMarkers);
        map2.fitBounds(bounds);
    }
}
printWaitingTime();

// Function to determine the color of the route points in map1
var determine_color = function (data, position, radioValue) {
    var point_color = 'blue';
    // Select the color visualization depending on the radio button value
    if (radioValue == 'speed')
    {
        if (data.SPEED[position] >= 0 && data.SPEED[position] <= 30) {
            point_color = 'green';
        }
        else if (data.SPEED[position] > 30 && data.SPEED[position] <= 50) {
            point_color = 'blue';
        }
        else if (data.SPEED[position] > 50 && data.SPEED[position] <= 100) {
            point_color = 'rgb(255, 0, 255)';
        }
        else if (data.SPEED[position] > 100) {
            point_color = 'red';
        }
    }

    return point_color;
}

// Trip information map
var map = L.map( 'map1', {
    center: [20.0, 5.0],
    minZoom: 2,
    zoom: 2
});

var printMarkers = async function(filename, nof) {
    map.remove();

    map = L.map( 'map1', {
        center: [20.0, 5.0],
        minZoom: 2,
        zoom: 2
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    
    // Get value of the checked radio button
    var radioButtons = document.getElementById('route_visualization');
    var radioValue = 'none';
    for (var i = 0; i < radioButtons.length; i++) {
        if (radioButtons[i].checked == true) {
            radioValue = radioButtons[i].value;
        }
    }

    if(nof === 0) {} else {
        var allMarkers = [];
        for(var g = 0; g < nof; g++) {
            /*let response = await fetch("maps/markers.json");
            let markers = await response.json();*/
            console.log(g)
            let response = await fetch("/getGPS/" + filename[g], {
                credentials: 'same-origin'
            });
            let markers = await response.json();
            //console.log("Test " + markers.GPS_Lat[0]);

            // Get all obd data for the drive cycle
            let response2 = await fetch("/getOBD/" + filename[g], {
                credentials: 'same-origin'
            });
            let allData = await response2.json();

            markers = await removeNull(markers);
            allMarkers.push(markers)
            //console.log("Markeranzahl: " + markers.length)

            for ( var i=0; i < markers.length; i++ ) 
            {
                var tmp = 0;
                if(i === 0 || i === (markers.length - 1)) {
                    tmp = 1;
                }
                L.marker( [markers[i].lat, markers[i].lng], {opacity: tmp})
                    //TODO: show start and stop time
                    .bindPopup( '<p>Start-Time' + markers[i].route_name + '</p>' )
                    .addTo( map );

                if ((i + 1) < markers.length) {
                    var latlngs = Array();
                    latlngs.push({
                        "lat": markers[i].lat,
                        "lng": markers[i].lng
                    });
                    latlngs.push({
                        "lat": markers[i + 1].lat,
                        "lng": markers[i + 1].lng
                    });
                    var point_color = await determine_color(allData, i, radioValue)
                    var polyline = L.polyline(latlngs, { color: point_color }).addTo(map);
                }
                else {
                    // Create legend for route visualization
                    var legend = L.control({ position: 'bottomright' });
                    // Adding the labels
                    legend.onAdd = function (map) {
                        // Create division for labels
                        var div = L.DomUtil.create('div', 'route-coor-legend');
                        // Arrays to organize the values
                        labels = ['<strong>Route visualization</strong>'];
                        categories = [];
                        colors = []
                        if (radioValue == 'speed') {
                            categories.push(...['0-30 km/h', '30-50 km/h', '50-100 km/h', '>100 km/h']);
                            colors.push(...['green', 'blue', 'rgb(255, 0, 255)', 'red']);
                        }
                        // Add the labels to the division
                        for (var j = 0; j < categories.length; j++) {
                            div.innerHTML += labels.push('<i class="circle" style="background:' + colors[j] + '"></i> ' + (categories[j] ? categories[j] : '+'));
                        }
                        // Linebreaks between the labels
                        div.innerHTML = labels.join('<br>');
                        return div
                    };
                    // Add legend to the map
                    legend.addTo(map);
                }
            }
        }
        var bounds = L.latLngBounds(allMarkers);
        map.fitBounds(bounds);
    }
}

var removeNull = function(markers) {
    let markerList = new Array();
    for ( var i=0; i < markers.GPS_Lat.length; ++i ) 
    {
        //console.log((i+1) + ". marker: " + markers.GPS_Long[i] + ", " + markers.GPS_Lat[i]);
        if(markers.GPS_Long[i] === null || markers.GPS_Lat[i] === null) {
            continue;
        }
        markerList.push({ 
            "lat": markers.GPS_Lat[i],
            "lng": markers.GPS_Long[i]
        });
    }
    return markerList;
}
//var fn = getFilenames();
//printMarkers(fn, fn.length);