var map, featureLayers = [], featureLayersName = [];

//WMS Base URL
var owsurl = "https://maps.gcc.tas.gov.au/geoserver/GCC_cc/ows"

$(document).on("click", ".feature-row", function(e) {
  sidebarClick(parseInt($(this).attr('id')),layerControl);
});

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  return false;
});

$("#full-extent-btn").click(function() {
  var locArr = L.latLng(-42.8232,147.2555);
  map.setView(locArr, 12);
  return false;
});

$("#legend-btn").click(function() {
  $("#legendModal").modal("show");
  return false;
});

$("#list-btn").click(function() {
  $('#sidebar').toggle();
  map.invalidateSize();
  return false;
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

$("#sidebar-toggle-btn").click(function() {
  $("#sidebar").toggle();
  map.invalidateSize();
  return false;
});

$("#sidebar-hide-btn").click(function() {
  $('#sidebar').hide();
  map.invalidateSize();
});

//this is where I add the layer.
//TODO: Check if this layer is added yet.
function sidebarClick(id, lc) {
  var index = $.inArray(featureLayers[id], intLayers);//intLayers.indexOf(layer);
  //only add the layer if it's not added already...
  if(index == -1) {
    var newLayer = new L.TileLayer.WMS(owsurl + "?SERVICE=WMS&", {
          layers: featureLayers[id],
          format: 'image/png',
          transparent: true,
          maxZoom: 20,
          attribution: gccAtt
    });
    lOverlays[featureLayersName[id]] = newLayer;
    map.addLayer(newLayer);
    map.removeControl(layerControl);
    updateInteractiveLayers(featureLayers[id]);
    layerControl = L.control.layers(baseLayers, lOverlays, {
      collapsed: isCollapsed
    }).addTo(map);
    /* Hide sidebar and go to the map on small screens */
    if (document.body.clientWidth <= 767) {
      $("#sidebar").hide();
      map.invalidateSize();
    }
  }
}

//GeoServer Layers
var gccAtt = 'Data &copy <a href=http://maps.gcc.tas.gov.au>GCC</a>, <a href="https://maps.gcc.tas.gov.au/licensing.html">CC-BY</a>';
var lOverlays = {};

var intLayers = [];
var intLayersString = "";
function updateInteractiveLayers(layer) {
    var index = $.inArray(layer, intLayers);//intLayers.indexOf(layer);
    if(index > -1) {
        intLayers.splice(index,1);
    } else {
        intLayers.push(layer);
    }
    intLayersString = intLayers.join();
};

function handleJson(data) {
    selectedFeature = L.geoJson(data, {
        style: function (feature) {
            return {color: 'yellow'};
        },
        onEachFeature: function (feature, layer) {
            var content = "";
            content = content + "<b><u>" + feature.id.split('.')[0] + "</b></u><br>";
            delete feature.properties.bbox;
            for (var name in feature.properties) {content = content + "<b>" + name + ":</b> " + feature.properties[name] + "<br>"};
            var popup = L.popup()
                .setLatLng(queryCoordinates)
                .setContent(content)
                .openOn(map);
            layer.bindPopup(content);
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight
            });
        },                
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                radius: 5,
                fillColor: "yellow",
                color: "#000",
                weight: 5,
                opacity: 0.6,
                fillOpacity: 0.2
            });
        }
    });
    selectedFeature.addTo(map);
}

//Query layer functionality.
var selectedFeature;
var queryCoordinates;
var src = new Proj4js.Proj('EPSG:4326');
var dst = new Proj4js.Proj('EPSG:28355');

function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
        fillColor: "yellow",
        color: "yellow",
        weight: 5,
        opacity: 1
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
}

function resetHighlight(e) {
    var layer = e.target;
    layer.setStyle({
        radius: 5,
        fillColor: "yellow",
        color: "yellow",
        weight: 5,
        opacity: 0.6,
        fillOpacity: 0.2
    });
}

//Define layers
var LISTTopographic = new L.tileLayer("https://services.thelist.tas.gov.au/arcgis/rest/services/Basemaps/Topographic/ImageServer/tile/{z}/{y}/{x}", {
    attribution: "Basemap &copy The LIST",
    maxZoom: 20,
    maxNativeZoom: 18
});

var LISTAerial = new L.tileLayer("https://services.thelist.tas.gov.au/arcgis/rest/services/Basemaps/Orthophoto/ImageServer/tile/{z}/{y}/{x}", {
    attribution: "Basemap &copy The LIST",
    maxZoom: 20,
    maxNativeZoom: 19
});

var center = new L.LatLng(-42.8232,147.2555);
map = L.map("map", {
  zoom: 14,
  center: center,
  layers: [LISTTopographic],
  zoomControl: false,
  attributionControl: false
});

//Set up trigger functions for adding layers to interactivity.
map.on('overlayadd', function(e) {
    updateInteractiveLayers(e.layer.options.layers);
}); 
map.on('overlayremove', function(e) {
    updateInteractiveLayers(e.layer.options.layers);
}); 
//TODO: check if there are any interactive layers, don't fire if there aren't.
map.on('click', function(e) {
    
    if(intLayers.length === 0) {
      return;
    }
    if (selectedFeature) {
        map.removeLayer(selectedFeature);
    };
    
    var p = new Proj4js.Point(e.latlng.lng,e.latlng.lat);
    Proj4js.transform(src, dst, p);
    queryCoordinates = e.latlng;
    
    var defaultParameters = {
        service : 'WFS',
        version : '1.1.1',
        request : 'GetFeature',
        typeName : intLayersString,
        maxFeatures : 100,
        outputFormat : 'text/javascript',
        format_options : 'callback:getJson',
        SrsName : 'EPSG:4326'
    };

    var customParams = {
        //bbox : map.getBounds().toBBoxString(),
        cql_filter:'DWithin(geom, POINT(' + p.x + ' ' + p.y + '), 10, meters)'
    };

    var parameters = L.Util.extend(defaultParameters, customParams);


    var url = owsurl + L.Util.getParamString(parameters)
    //console.log(url);

    $.ajax({
        url : owsurl + L.Util.getParamString(parameters),
        dataType : 'jsonp',
        jsonpCallback : 'getJson',
        success : handleJson
    });
});

/* Attribution control */
function updateAttribution(e) {
  $.each(map._layers, function(index, layer) {
    if (layer.getAttribution) {
      $("#attribution").html((layer.getAttribution()));
    }
  });
}
map.on("layeradd", updateAttribution);
map.on("layerremove", updateAttribution);

var attributionControl = L.control({
  position: "bottomright"
});
attributionControl.onAdd = function (map) {
  var div = L.DomUtil.create("div", "leaflet-control-attribution");
  div.innerHTML = "<span class='hidden-xs'>Developed by <a href='http://bryanmcbride.com'>bryanmcbride.com</a> | </span><a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Attribution</a>";
  return div;
};
map.addControl(attributionControl);

var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  },
  circleStyle: {
    weight: 1,
    clickable: false
  },
  icon: "icon-direction",
  metric: false,
  strings: {
    title: "My location",
    popup: "You are within {distance} {unit} from this point",
    outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
  },
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
}).addTo(map);

$.ajax({
    type: "GET",
    url: owsurl + "?SERVICE=WMS&request=getcapabilities",
    dataType: "xml",
    success: parseXml
  });

function parseXml(xml)
{
  var layerIndex = 0

  //find every Tutorial and print the author
  $(xml).find("Layer").find("Layer").each(function()
  {
    var title = $(this).find("Title").first().text();
    var name = $(this).find("Name").first().text();

    //Check for layer groups
    var patt = new RegExp("Group");
    var res = patt.test(title);
    if(!res) {
    featureLayers.push(name)
      featureLayersName.push(title)
      $("#feature-list tbody").append('<tr class="feature-row" id="'+layerIndex+'"><td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/museum.png"></td><td class="feature-name">'+title+'</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      layerIndex = layerIndex + 1;
    }
  });

  // Output:
  // The Reddest
  // The Hairiest
  // The Tallest
  // The Fattest
}
/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

var baseLayers = {
  "LIST Basemap": LISTTopographic,
  "LIST Imagery": LISTAerial
};

var layerControl = L.control.layers(baseLayers, lOverlays, {
  collapsed: isCollapsed
}).addTo(map);

/* Highlight search box text on click */
$("#searchbox").click(function () {
  $(this).select();
});
$("#loading").hide();

