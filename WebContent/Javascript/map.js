﻿var map;
var drawingManager;
var shapes = [];
var centroid;
var editPoly = false;
var editPolycoordinates = "";
var href = "";
var drawnPolygon;
var vertices;
var polygons = [];
var allflagmarkers =[];
var markerofFlag = new Set();
var mySetofmarkers = new Set();
var arrmarkerofFlag = [];
var arrmySetofmarkers = [];
var recordId;
function initMap() {
    href = window.top.location.href;
    urlVars = getUrlVars(href);
    var editPolycoordinates = urlVars["coordinates"];
    var editPolyCentroid = urlVars["centroid"];
    var flagtype = urlVars["flagType"];
    recordId= urlVars["recordId"];
    var myLatlng = new google.maps.LatLng(30.658354982307571, -96.396270512761134);
    var mapOptions = {
        zoom: 14,
        center: myLatlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false
    }
    var infoWindow = new google.maps.InfoWindow({ map: map });
   
    var mapElement = document.getElementById('map_canvas');

    map = new google.maps.Map(map_canvas, mapOptions);
    
    if (editPolycoordinates != "" && editPolycoordinates != null) {
        var customControlDiv = document.createElement('div');
        var customControl = new CustomControl(customControlDiv, map);

        customControlDiv.index = 1;
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(customControlDiv);
        var coodichange = editPolycoordinates;
        var coordinates = coodichange.split(";");
        var arr = new Array();
        
        var bounds = new google.maps.LatLngBounds();
        for (var j = 0; j < coordinates.length ; j++) {
            if (coordinates[j] != "") {
                var coordi = coordinates[j].split(",");
                arr.push(new google.maps.LatLng(
                      parseFloat(coordi[0]),
                      parseFloat(coordi[1])
                ));
                bounds.extend(arr[arr.length - 1]);
            }
        }
        polygons.push(new google.maps.Polygon({
            paths: arr,
            editable: true,
            draggable: true,
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#f1c40f',
            fillOpacity: 0.35
        }));
        polygons[polygons.length - 1].setMap(map);
        drawnPolygon = polygons[0];
        map.setCenter(bounds.getCenter());
        var listener = google.maps.event.addListener(map, "idle", function () {
            if (map.getZoom() < 15) map.setZoom(15);
            google.maps.event.removeListener(listener);
        });
        if (flagtype != "undefined") {
            var flags = flagtype.split(",");
            var posForFlag=editPolyCentroid.split(",");
            var centerForflag = new google.maps.LatLng(
                      parseFloat(posForFlag[0]),
                      parseFloat(posForFlag[1])
                );
            for (var i = 0; i < flags.length; i++) {
                if (flags[i] != null && flags[i] != "") {
                    var value = new CustomFlagMarker();
                    value.type = flags[i];
                    value.position = new google.maps.LatLng(centerForflag.lat() + (i) * 0.002, centerForflag.lng() + (i) * 0.002);
                    var marker = addMarkerOnPolygon(value);
                    var ifExists = markerofFlag.has(marker);
                    if (!ifExists) {
                        markerofFlag.add(marker);
                        arrmarkerofFlag.push(marker);
                    }
                }
            }
        }
        vertices = polygons[0].getPath().getArray();
        google.maps.event.addListener(polygons[0].getPath(), 'set_at', function (event) {
            vertices = polygons[0].getPath().getArray();
            placeFlagatCorrectLocation(polygons[0]);
        });
        google.maps.event.addListener(polygons[0].getPath(), 'insert_at', function (event) {
            vertices = polygons[0].getPath().getArray();
            placeFlagatCorrectLocation(polygons[0]);
        });
        google.maps.event.addListener(polygons[0], 'dragend', function (event) {
            vertices = polygons[0].getPath().getArray();
            placeFlagatCorrectLocation(polygons[0]);

        });
        function placeFlagatCorrectLocation(polygon) {
            calcCentroid(polygon);
            for (var i = 0; i < arrmarkerofFlag.length; i++) {
                arrmarkerofFlag[i].setPosition(new google.maps.LatLng(centroid.lat() + (i) * 0.002, centroid.lng() + (i) * 0.002));
            }
            drawnPolygon = polygon;
        }
        var drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: ['marker']
            },
            markerOptions: {
                //icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png',
                //draggable: true,
                animation: google.maps.Animation.DROP
              }
        });
        drawingManager.setMap(map);
        google.maps.event.addListener(drawingManager, "overlaycomplete", function (event) {
            if (drawingManager.getDrawingMode() != null && drawingManager.getDrawingMode() == 'marker') {
                //event.overlay.setMap(null);
                var posOfMarker = event.overlay.position;
                markerId = posOfMarker.lat() + '_' + posOfMarker.lng();
                var marker = event.overlay;
                var ifExists = mySetofmarkers.has(posOfMarker);
                if (!ifExists) {
                    mySetofmarkers.add(posOfMarker);
                    arrmySetofmarkers[markerId] = marker; // cache marker in markers object
                    bindMarkerEvents(marker);
                    //arrmySetofmarkers.push(posOfMarker);
                }
            }
        });
        
        

        
        }
    
    else {
        loadProducerAreas();
            drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: google.maps.drawing.OverlayType.POLYGON,
                drawingControl: true,
                drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: ['marker', 'polygon']
                },
                polygonOptions: {
                    editable: false,
                    draggable: false,
                    strokecolor: '#E9967A'
                },
                markerOptions: {
                    //icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png',
                    draggable: true,
                    animation: google.maps.Animation.DROP
                }
            });
        drawingManager.setMap(map);

        // Add a listener for creating new shape event.
        google.maps.event.addListener(drawingManager, "overlaycomplete", function (event) {
            var newShape = event.overlay;
            newShape.type = event.type;
            shapes.push(newShape);
            if (drawingManager.getDrawingMode()) {
                drawingManager.setDrawingMode(null);
            }

        });

        // add a listener for the drawing mode change event, delete any existing polygons
        google.maps.event.addListener(drawingManager, "drawingmode_changed", function () {
            /*if (drawingManager.getDrawingMode() != null && drawingManager.getDrawingMode() != 'marker') {
                for (var i = 0; i < shapes.length; i++) {
                    shapes[i].setMap(null);
                }
                shapes = [];
            }*/
        });


        google.maps.event.addListener(drawingManager, 'drawingmode_changed', function (event) {
            if (drawingManager.getDrawingMode() == null ) {
                
            }
        });
        
        // Add a listener for the "drag" event.
        google.maps.event.addListener(drawingManager, "overlaycomplete", function (event) {
            if (event.type != 'marker') {
                overlayDragListener(event.overlay);
                drawnPolygon = event.overlay;
                $('#vertices').val(event.overlay.getPath().getArray());
                fillModalValues(event.overlay,false);
            }
            else {
                var posOfMarker = event.overlay.position;
                var ifExists = mySetofmarkers.has(posOfMarker);
                if (!ifExists) {
                    mySetofmarkers.add(posOfMarker);
                    arrmySetofmarkers.push(posOfMarker);
                }
            }
        });
        // Create the search box and link it to the UI element.
        var input = document.getElementById('pac-input');
        var searchBox = new google.maps.places.SearchBox(input);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

        // Bias the SearchBox results towards current map's viewport.
        map.addListener('bounds_changed', function () {
            searchBox.setBounds(map.getBounds());
        });
        var markers = [];
        searchBox.addListener('places_changed', function () {
            var places = searchBox.getPlaces();

            if (places.length == 0) {
                return;
            }

            // Clear out the old markers.
            markers.forEach(function (marker) {
                marker.setMap(null);
            });
            markers = [];

            // For each place, get the icon, name and location.
            var bounds = new google.maps.LatLngBounds();
            places.forEach(function (place) {
                if (!place.geometry) {
                    console.log("Returned place contains no geometry");
                    return;
                }
                var icon = {
                    url: place.icon,
                    size: new google.maps.Size(71, 71),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17, 34),
                    scaledSize: new google.maps.Size(25, 25)
                };

                // Create a marker for each place.
                markers.push(new google.maps.Marker({
                    map: map,
                    icon: icon,
                    title: place.name,
                    position: place.geometry.location
                }));

                if (place.geometry.viewport) {
                    // Only geocodes have viewport.
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }
            });
            map.fitBounds(bounds);
        });
    }
    
}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function overlayDragListener(overlay) {
    google.maps.event.addListener(overlay.getPath(), 'set_at', function (event) {
        $('#vertices').val(overlay.getPath().getArray());
    });
    google.maps.event.addListener(overlay.getPath(), 'insert_at', function (event) {
        $('#vertices').val(overlay.getPath().getArray());
    });
}


function Location() {
    this.usremail = "";
    this.id = "";
    this.planttype = "";
    this.croptype = "";
    this.cropyear = "";
    this.comment = "";
    this.county = "";
    this.coordinates = "";
    this.loccentroid = "";
    this.acres = "";
    this.organiccrops = 0;
    this.certifier = "";
    this.flagType = "";
    this.shareCropInfo = "";
    this.markerPos = "";
}
function CustomFlagMarker() {
    var position = new google.maps.LatLng(0, 0);
    var type = "";
}
function ConfirmDialog(message) {
    $('<div></div>').appendTo('body')
                    .html('<div><h6>' + message + '?</h6></div>')
                    .dialog({
                        modal: true, title: 'Delete message', zIndex: 10000, autoOpen: true,
                        width: 'auto', resizable: false,
                        buttons: {
                            Yes: function () {
                                alert("Yay");
                                $(this).dialog("close");
                            },
                            No: function () {
                                $(this).dialog("close");
                            }
                        },
                        close: function (event, ui) {
                            $(this).remove();
                        }
                    });
}

function SubmitNewLocation(event) {
    
    var sharecropInfo = false;
    //ConfirmDialog("Do you want the information of this crop to be visible to other producers..!!");
    if (confirm("Do you want the information of this crop to be visible to other producers..!!")) {
        sharecropInfo = true;
    } else {
        sharecropInfo = false;
    }
    var flagvalues = $('#flagoptions').text();
    var flagop = flagvalues.split("Flag");
    var firstval = flagop[0].substring(2, flagop[0].length);
    var valuefirst = new CustomFlagMarker();
    var valueForFlags = "";
    if (firstval != "") {
        for (var j = 0; j < arrmarkerofFlag.length; j++) {
            arrmarkerofFlag[j].setMap(null);
        }
        
        valuefirst.type = firstval + 'Flag';
        valuefirst.position = centroid;
        addMarkerOnPolygon(valuefirst);
        valueForFlags += valuefirst.type;
        for (var i = 1; i < flagop.length; i++) {
            if (flagop[i] != null && flagop[i] != "") {
                var value = new CustomFlagMarker();
                value.type = flagop[i] + 'Flag';
                valueForFlags += "," + value.type;
                value.position = new google.maps.LatLng(centroid.lat() + (i) * 0.002, centroid.lng() + (i) * 0.002);
                addMarkerOnPolygon(value);
            }
        }
    }
    if (arrmarkerofFlag != null && arrmarkerofFlag.length != 0 && document.getElementById('flagoptions').checked) {
        for (var j = 0; j < arrmarkerofFlag.length-1; j++) {
            valueForFlags+= arrmarkerofFlag[j].title+",";
        }
        valueForFlags += arrmarkerofFlag[arrmarkerofFlag.length - 1].title;
    }
    var croploc = new Location();
    if (recordId != null)
        croploc.id = recordId;
    else
        croploc.id = "-1";
    croploc.usremail = "mtchakerian@tamu.edu";
    croploc.planttype = document.getElementById('plant').value;
    croploc.croptype = document.getElementById('crop').value;
    croploc.cropyear = document.getElementById('cropYear').value;
    if (document.getElementById('form_message') != null)
        croploc.comment = document.getElementById('form_message').value;
    croploc.comment = croploc.comment.replace(/'/g, "''");
    croploc.county = document.getElementById('countyselected').value;
    var coordinatesforpolygon = document.getElementById('polygonpath').value;
    croploc.coordinates = coordinatesforpolygon;
    var lat = centroid.lat();
    var lng = centroid.lng();
    croploc.loccentroid = lat + "," + lng;
    croploc.acres = document.getElementById('areaPolygon').value;
    var isitorganic = document.getElementById('someSwitchOptionSuccess').checked;
    croploc.flagType = valueForFlags;
    if (isitorganic == true) {
        croploc.organiccrops = "1";
    }
    else {
        croploc.organiccrops = "0";
    }
    var posofAllMarkers = "";
    for (var i=0; i < arrmySetofmarkers.length;i++) {
        posofAllMarkers += arrmySetofmarkers[i].lat() + "," + arrmySetofmarkers[i].lng() + "\n";
    }
    croploc.markerPos = posofAllMarkers;
    croploc.certifier = "";
    croploc.shareCropInfo = sharecropInfo;
    var str = JSON.stringify(croploc);
    PageMethods.AddNewCropLocation(str, AddNewLocation_Success, Fail);
    setTimeout(fade_out, 2000);
    function fade_out() {
        $("#errormessage").fadeOut().empty();
        $("#successmessage").fadeOut().empty();
    }
    function AddNewLocation_Success(val) {
        if (val[0] == 1) {
            $("#successmessage").show();
            $("#successmessage").empty();
            $("#errormessage").empty();
            $("#successmessage").append('<strong>Success! </strong>' + val[1]);
            $("#form1 :input").prop("disabled", true);
            setcolorforPolygon(drawnPolygon, valuefirst);
            $('#registerCropForm').trigger("reset");
        }
        if (val[0] == 0) {

            $("#errormessage").show();
            $("#errormessage").empty();
            $("#errormessage").append('<strong>Error! Some values are incorrect. </strong>' + val[1]);
        }
    }
    function Fail(val) {
    }
}

function editPolygon(coordinates,centroid,flagType,recordId) {
    window.location.href = 'Producer.aspx?coordinates=' + coordinates + "&centroid=" + centroid + "&flagType=" + flagType + "&recordId=" + recordId;
    editPolycoordinates = coordinates;
}
function closeevent() {
            $('#registerCropForm').trigger("reset");
            //$('#flagtechModal').trigger("reset");
}
function getUrlVars(hrefString) {
    var vars = [], hash;
    var hashes = hrefString.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}
function addMarkerOnPolygon(positionOfMarker) {
    var iconBase = '/WebContent/Images/Flags/';
    var iconBlackFlag = {
        url: iconBase + "BlackFlag.PNG", // url
        scaledSize: new google.maps.Size(35, 40), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
    };
    var iconGreenFlag = {
        url: iconBase + "GreenFlag.PNG", // url
        scaledSize: new google.maps.Size(35, 40), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
    };
    var iconRedFlag = {
        url: iconBase + "RedFlag.PNG", // url
        scaledSize: new google.maps.Size(35, 40), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
    };
    var iconTealFlag = {
        url: iconBase + "TealFlag.PNG", // url
        scaledSize: new google.maps.Size(35, 40), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
    };
    var iconWhiteFlag = {
        url: iconBase + "WhiteFlag.PNG", // url
        scaledSize: new google.maps.Size(35, 40), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
    };
    var iconYellowFlag = {
        url: iconBase + "YellowFlag.PNG", // url
        scaledSize: new google.maps.Size(35, 40), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
    };
    var icons = {
        "BlackFlag": {
            icon: iconBlackFlag,
            color: "#000000"
        },
        "GreenFlag": {
            icon: iconGreenFlag,
            color: "#008000"
        },
        "RedFlag": {
            icon: iconRedFlag,
            color: "#FF0000"
        },
        "TealFlag": {
            icon: iconTealFlag,
            color: "#008080"
        },
        "WhiteFlag": {
            icon: iconWhiteFlag,
            color: "#FFFFFF"
        },
        "YellowFlag": {
            icon: iconYellowFlag,
            color: "#FFFF00"
        }
    };
    
    var addedMarker=addMarker(positionOfMarker);
    bindMarkerEvents(addedMarker);
    function addMarker(custom) {
        var markerId = getMarkerUniqueId(custom.position.lat(), custom.position.lng());
        var marker = new google.maps.Marker({
            position: custom.position,
            icon: icons[custom.type].icon,
            title: custom.type,
            id: markerId,
            map: map
        });
        return marker;
    }
    return addedMarker;
}

function setcolorforPolygon(drawnPolygon, valuefirst) {
    var iconBase = '/WebContent/Images/Flags/';
    var iconBlackFlag = {
        url: iconBase + "BlackFlag.PNG", // url
        scaledSize: new google.maps.Size(35, 40), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
    };
    var iconGreenFlag = {
        url: iconBase + "GreenFlag.PNG", // url
        scaledSize: new google.maps.Size(35, 40), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
    };
    var iconRedFlag = {
        url: iconBase + "RedFlag.PNG", // url
        scaledSize: new google.maps.Size(35, 40), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
    };
    var iconTealFlag = {
        url: iconBase + "TealFlag.PNG", // url
        scaledSize: new google.maps.Size(35, 40), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
    };
    var iconWhiteFlag = {
        url: iconBase + "WhiteFlag.PNG", // url
        scaledSize: new google.maps.Size(35, 40), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
    };
    var iconYellowFlag = {
        url: iconBase + "YellowFlag.PNG", // url
        scaledSize: new google.maps.Size(35, 40), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
    };
    var icons = {
        "BlackFlag": {
            icon: iconBlackFlag,
            color: "#000000"
        },
        "GreenFlag": {
            icon: iconGreenFlag,
            color: "#008000"
        },
        "RedFlag": {
            icon: iconRedFlag,
            color: "#FF0000"
        },
        "TealFlag": {
            icon: iconTealFlag,
            color: "#008080"
        },
        "WhiteFlag": {
            icon: iconWhiteFlag,
            color: "#FFFFFF"
        },
        "YellowFlag": {
            icon: iconYellowFlag,
            color: "#FFFF00"
        }
    };
    drawnPolygon.setOptions({ strokeWeight: 2.0, fillColor: icons[valuefirst.type].color, draggable: true });
}
function loadProducerAreas() {
    var useremail = "mtchakerian@tamu.edu";
    $.ajax({
        type: 'POST',
        url: 'Dashboard.aspx/ListProducerPolygons',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ useremail: useremail }),
        dataType: 'json',
        success: Producer_location_Success,
        error: Fail_location
    });
    function Producer_location_Success(resultobj) {
        var val = resultobj.d;
        for (var i = 0; i < val.length; i++) {
            if (val[i].flagtype != "") {
                var flagcreator = new CustomFlagMarker();
                flagcreator.type = val[i].flagtype.split(",")[0];
                editPolyCentroid = val[i].loccentroid;
                var posForFlag = editPolyCentroid.split(",");
                var centerForflag = new google.maps.LatLng(
                          parseFloat(posForFlag[0]),
                          parseFloat(posForFlag[1])
                    );
                flagcreator.position = new google.maps.LatLng(centerForflag.lat(), centerForflag.lng());
                var markerforFlag = addMarkerOnPolygon(flagcreator);
                allflagmarkers.push(markerforFlag);
                var mapforInfoWindow = new Map();
                mapforInfoWindow.set("Crop Name:", val[i].planttype);
                mapforInfoWindow.set("Crop Type:", val[i].croptype);
                mapforInfoWindow.set("Organic Certified:", val[i].certifier);
                mapforInfoWindow.set("Crop Year:", val[i].cropyear);
                createInfoWindow(mapforInfoWindow, markerforFlag);
                
            }
            
        }
        var markerCluster = new MarkerClusterer(map, allflagmarkers, { imagePath: 'Images/Cluster/m' });
    }
        function Fail_location(resultobj) {
            var val = resultobj.d;
        }
}

function createInfoWindow(dataAsMap, marker) {
    var content = "<dl>";
    dataAsMap.forEach(function (value, key) {
        content +=
             "<dt>"+ key +"</dt>" +
             "<dd>"+ value + "</dd>";
    });
    content += "</dl>";
    var infowindow = new google.maps.InfoWindow({

    })
    
    //alert("custom.position" + custom.position + "custom.type" + custom.type + "custom.cropname" + custom.cropname);
    google.maps.event.addListener(marker, 'click', (function (marker, content, infowindow) {
        return function () {
            infowindow.setContent(content);
            infowindow.open(map, marker);
        };
    })(marker, content, infowindow));
}
function CustomControl(controlDiv, map) {

    // Set CSS for the control border
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.borderStyle = 'solid';
    controlUI.style.borderWidth = '1px';
    controlUI.style.borderColor = '#ccc';
    controlUI.style.height = '29px';
    controlUI.style.width = '30px';
    controlUI.style.marginTop = '5px';
    controlUI.style.marginLeft = '-6px';
    controlUI.style.paddingTop = '2px';
    controlUI.style.cursor = 'pointer';
    controlUI.style.textAlign = 'center';
    controlUI.style.fontWeight = '700px'
    //controlUI.style.boxShadow = '0px 1px 4px #888888';
    controlUI.style.boxSizing = 'border-box';
    controlUI.style.backgroundClip = 'padding-box';
    controlUI.style.borderBottomRightRadius = '2px';
    controlUI.style.borderTopRightRadius = '2px';
    controlUI.title = 'Click to set the map to Home';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior
    var controlText = document.createElement('div');
    controlText.style.fontFamily = 'Monotype Corsiva';
    controlText.style.fontSize = '12px';
    controlText.style.border = '2px'
    controlText.style.fontWeight = 'bold';
    controlText.style.paddingLeft = '4px';
    controlText.style.paddingRight = '4px';
    controlText.style.marginTop = '4px';
    controlText.innerHTML = 'Save';
    controlUI.appendChild(controlText);

    // Setup the click event listeners
    google.maps.event.addDomListener(controlUI, 'click', function () {
        fillModalValues(polygons[0],true);
    });

}
function fillModalValues(polygon,checkforflag) {
    $('#myModal').modal('show');
    $("#myModal").draggable({ handle: ".modal-body" });
    $('#areaPolygon').val((0.000247105 * google.maps.geometry.spherical.computeArea(polygon.getPath())).toFixed(2));
    $('#cropYear').val(new Date().getFullYear());
    var coordinates = "";
    for (var i = 0; i < polygon.getPath().getLength() - 1 ; i++) {
        coordinates += polygon.getPath().getAt(i).toUrlValue(6) + "\n";
    }
    coordinates += polygon.getPath().getAt(polygon.getPath().getLength() - 1).toUrlValue(6);
    $('#polygonpath').val(coordinates);
    $('#countyselected').val(getCountyInfo(coordinates));
    calcCentroid(polygon);
    if (checkforflag && arrmarkerofFlag!=null && arrmarkerofFlag.length!=0) {
        var checkbox = document.getElementsByName('flagoptions');
        for (var i = 0; i < checkbox.length; i++) {
            checkbox[i].checked = true;
        }
    }
}
function calcCentroid(polygon) {
    var bounds = new google.maps.LatLngBounds();
    var polygonCoords = polygon.getPath().getArray();
    for (var i = 0; i < polygonCoords.length; i++) {
        bounds.extend(polygonCoords[i]);
    }
    centroid = bounds.getCenter();
}
/**
         * Removes given marker from map.
         * @param {!google.maps.Marker} marker A google.maps.Marker instance that will be removed.
         * @param {!string} markerId Id of marker.
         */
var removeMarker = function (marker, markerId) {
    marker.setMap(null); // set markers setMap to null to remove it from map
    delete arrmySetofmarkers[markerId]; // delete marker instance from markers object
};
var getMarkerUniqueId = function (lat, lng) {
    return lat + '_' + lng;
}
function bindMarkerEvents(marker) {
    google.maps.event.addListener(marker, "rightclick", function (point) {
        var markerId = getMarkerUniqueId(point.latLng.lat(), point.latLng.lng()); // get marker id by using clicked point's coordinate
        removeMarker(marker, markerId); // remove it
    });
}
