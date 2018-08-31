(function (config) {
  window.init = function () {
    var categoryFilterElements = document.getElementsByName('category-filter'),
      statusFilterElements = document.getElementsByName('status-filter'),
      accordionTitles = document.getElementsByClassName('accordion-title'),
      mobileFilter = document.getElementById('mobile-filter'), // 0: Search, 1: Filter
      tableId = config.table.id,
      col = config.table.col,
      categoryColumn = 'en_category', // should always be english. Don't adjust for French.
      statusColumn = 'en_status', // should always be english. Don't adjust for French.
      htmlMapID = 'styled_map',
      filterNames = {
        'Communities': 'communities',
        'Education': 'education',
        'Health care': 'health',
        'Recreation': 'recreation',
        'Roads and bridges': 'roads',
        'Transit': 'transit',
        'Child care': 'childcare',
      },
      statusDefinitions = {
        'Planning': [
          'Pre-planning',
          'Planning',
          'Pre-procurement',
          'Procurement',
          'Pre-construction',
        ],
        'Under construction': [
          'Under construction',
        ],
        'Complete': [
          'Complete',
          'Complete and open',
        ],
      },
      defaultZoom = 15;

    function initStyledMap(map, streetNameVisibilityOnOff) {
      var styledMapType = new google.maps.StyledMapType([{
          "elementType": "geometry",
          "stylers": [{
            "color": "#f5f5f5"
          }]
        },
        {
          "elementType": "labels.icon",
          "stylers": [{
            "visibility": "off"
          }]
        },
        {
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#616161"
          }]
        },
        {
          "elementType": "labels.text.stroke",
          "stylers": [{
            "color": "#f5f5f5"
          }]
        },
        {
          "featureType": "administrative.land_parcel",
          "stylers": [{
            "visibility": "off"
          }]
        },
        {
          "featureType": "administrative.land_parcel",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#bdbdbd"
          }]
        },
        {
          "featureType": "administrative.neighborhood",
          "stylers": [{
            "visibility": "off"
          }]
        },
        {
          "featureType": "poi",
          "elementType": "geometry",
          "stylers": [{
            "color": "#eeeeee"
          }]
        },
        {
          "featureType": "poi",
          "elementType": "labels.text",
          "stylers": [{
            "visibility": "off"
          }]
        },
        {
          "featureType": "poi",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#757575"
          }]
        },
        {
          "featureType": "poi.business",
          "stylers": [{
            "visibility": "off"
          }]
        },
        {
          "featureType": "poi.park",
          "elementType": "geometry",
          "stylers": [{
            "color": "#e5e5e5"
          }]
        },
        {
          "featureType": "poi.park",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#9e9e9e"
          }]
        },
        {
          "featureType": "road",
          "elementType": "geometry",
          "stylers": [{
            "color": "#ffffff"
          }]
        },
        {
          "featureType": "road",
          "elementType": "labels",
          "stylers": [{
            "visibility": streetNameVisibilityOnOff
          }]
        },
        {
          "featureType": "road",
          "elementType": "labels.icon",
          "stylers": [{
            "visibility": "off"
          }]
        },
        {
          "featureType": "road.arterial",
          "elementType": "labels",
          "stylers": [{
            "visibility": "off"
          }]
        },
        {
          "featureType": "road.arterial",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#757575"
          }]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [{
            "color": "#dadada"
          }]
        },
        {
          "featureType": "road.highway",
          "elementType": "labels",
          "stylers": [{
            "visibility": streetNameVisibilityOnOff
          }]
        },
        {
          "featureType": "road.highway",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#616161"
          }]
        },
        {
          "featureType": "road.local",
          "stylers": [{
            "visibility": streetNameVisibilityOnOff
          }]
        },
        {
          "featureType": "road.local",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#9e9e9e"
          }]
        },
        {
          "featureType": "transit",
          "stylers": [{
            "visibility": "off"
          }]
        },
        {
          "featureType": "transit.line",
          "elementType": "geometry",
          "stylers": [{
            "color": "#e5e5e5"
          }]
        },
        {
          "featureType": "transit.station",
          "elementType": "geometry",
          "stylers": [{
            "color": "#eeeeee"
          }]
        },
        {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [{
            "color": "#c4dbf8"
          }]
        },
        {
          "featureType": "water",
          "elementType": "labels.text",
          "stylers": [{
            "visibility": "off"
          }]
        },
        {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [{
            "color": "#9e9e9e"
          }]
        },
        {
          "featureType": "road.highway",
          "elementType": "labels",
          "stylers": [{
            "visibility": "on"
          }]
        },
        {
          "featureType": "road.highway",
          "elementType": "labels.text",
          "stylers": [{
            "visibility": "on"
          }]
        }
      ], {
        name: 'BuildON'
      });

      map.mapTypes.set(htmlMapID, styledMapType);
      map.setMapTypeId(htmlMapID);
    }

    function initLocationToast(map) {
      var toast = document.getElementById('googft-toast');
      // Centres and zooms in to user's current location on init.
      if (navigator.geolocation) {
        // Put the toast to the map if browser supports geolocation.
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(toast);
        navigator.geolocation.getCurrentPosition(function (position) {
          var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          map.setZoom(defaultZoom);
          map.setCenter(pos);
          // Removes the toast after successfully fetched location.
          map.controls[google.maps.ControlPosition.TOP_CENTER].clear();
        }, function () {
          // Removes the toast if fetch failed or user choosed to block geolocation.
          map.controls[google.maps.ControlPosition.TOP_CENTER].clear();
          toast.remove();
        });
      } else {
        // Remove the toast if browser does not support geolocation.
        toast.remove();
      }
    }

    function initListeners(map, layer) {
      // Show street names when zoomed in on the map
      google.maps.event.addListener(map, 'zoom_changed', function (e) {
        initStyledMap(map, map.getZoom() > 14 ? "on" : "off");
      });

      // Google Analytics
      google.maps.event.addListener(layer, 'click', function (e) {
        var eventLabel = [
          'marker-click',
          e.row.en_category.value,
          e.row.geometry_type.value,
          e.row.en_project_name.value,
        ].join('||');
        var zoomLevel = map.getZoom();
        sendGAEvent(eventLabel, zoomLevel);
      });
    }

    function sendGAEvent(eventLabel, eventValue) {
      ga('send', 'event', 'feature', 'infrastructure map', eventLabel, eventValue);
    }

    function toggleClose() {
      if (this.className.indexOf('closed') === -1) {
        this.className += ' closed';
      } else {
        this.className = this.className.replace('closed', '').trim();
      }
    }

    //this function will add the class of 'fullscreen' to both the google full screen button and the "Enter FullScreen" button above the map
    //this gets run in the IFFE timeout function at the bottom of the file
    function toggleFullscreen() {
      if (this.className.indexOf('fullscreen') === -1) {
        this.className += ' fullscreen';
      } else {
        this.className = this.className.replace('fullscreen', '').trim();
      }
    }

    function generateWhere() {
      for (var i = 0, checkbox, where = '', categoryFilters = []; checkbox = categoryFilterElements[i]; i++) {
        if (!/^\s+$/.test(checkbox.value) && checkbox.checked) {
          var categoryName = checkbox.value.replace(/'/g, '\\\'');
          // WARNING: Switching quotes breaks the filter. Must be single quotes
          categoryFilters.push("'" + categoryName + "'");
        }
      }

      for (var i = 0, checkbox, statusFilters = []; checkbox = statusFilterElements[i]; i++) {
        if (!/^\s+$/.test(checkbox.value) && checkbox.checked) {
          var statusName = checkbox.value;
          // Put all possible status definitions into the where clause.
          // e.g. Selecting the "Complete" filter leads to finding either "Complete" or "Complete and open" in the fusion table.
          for (var j = 0, nextStatus, status = []; nextStatus = statusDefinitions[statusName][j]; j++) {
            // WARNING: Switching quotes breaks the filter. Must be single quotes
            status.push("'" + nextStatus.replace(/'/g, '\\\'') + "'");
          }
          Array.prototype.push.apply(statusFilters, status);
        }
      }

      if (categoryFilters.length && statusFilters.length) {
        where += "'" + categoryColumn + "' IN (" + categoryFilters.join(',') + ')';
        where += " AND '" + statusColumn + "' IN (" + statusFilters.join(',') + ')';
      }
      return where;
    }

    function filterMap(layer, tableId, map) {
      var where = generateWhere();

      if ((where)) {
        if (!layer.getMap()) {
          layer.setMap(map);
        }
        layer.setOptions({
          query: {
            select: col,
            from: tableId,
            where: where
          }
        });
      } else {
        layer.setMap(null);
      }
    }

    function getNumberOfFiltersOn() {
      var count = 0;
      for (var i = 0, elem; elem = categoryFilterElements[i]; i++) {
        if (elem.checked) {
          count++;
        }
      }
      return count;
    }

    function processAnchor() {
      var hash = window.location.hash;
      // Format should be #!education,health,transit
      if (hash && hash.substring(1, 2) === '!') {
        activeFilters = hash.substring(2).split(',');
        for (var i = 0, elem; elem = categoryFilterElements[i]; i++) {
          // Turn off filters that are not in the anchor
          if (activeFilters.indexOf(filterNames[elem.value]) === -1) {
            elem.checked = false;
          }
        }
      }
    }

    function initLegend(layer, tableId, map, isMobile) {
      function applyFilter() {
        filterMap(layer, tableId, map);

        // Google Analytics
        var eventLabel = [
          'filter-' + (this.checked ? 'on' : 'off'),
          this.value,
        ].join('||');
        sendGAEvent(eventLabel, getNumberOfFiltersOn());
      }

      // Bind event listeners to legend filters
      for (var i = 0, elem; elem = categoryFilterElements[i]; i++) {
        google.maps.event.addDomListener(elem, 'click', applyFilter);
      }
      for (var i = 0, elem; elem = statusFilterElements[i]; i++) {
        google.maps.event.addDomListener(elem, 'click', applyFilter);
      }

      // Bind event listeners to accordion titles
      for (var i = 0, elem; elem = accordionTitles[i]; i++) {
        google.maps.event.addDomListener(elem, 'click', toggleClose);
      }

      google.maps.event.addDomListener(mobileFilter, 'click', function () {
        toggleClose.apply(accordionTitles[1]);
      });

      var legend = document.getElementById('googft-legend');
      legend.index = 1;

      map.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('googft-legend-open'));
      map.controls[google.maps.ControlPosition.LEFT_TOP].push(legend);
    }

    function initSearch(map) {
      var searchElement = document.getElementById("googft-search-element");
      var _addEventListener = searchElement.addEventListener ? searchElement.addEventListener : searchElement.attachEvent,
        addEventListenerWrapper = function (type, listener) {
          if (type === "keydown") {
            var origListener = listener;
            listener = function (event) {
              var suggested = document.getElementsByClassName("pac-item-selected").length,
                key = event.which || event.keyCode || 0;
              if (key === 13 && !suggested) {
                // user hit enter without selecting an option from the auto-suggest list.
                // Fake down arrow key press so that we can pick the first item for them.
                var downArrowPress = new Event("keydown", {
                  keyCode: 40,
                  which: 40
                });
                downArrowPress.keyCode = 40;
                downArrowPress.which = 40;
                origListener.call(searchElement, downArrowPress);
              }
              origListener.call(searchElement, event);
            };
          }
          _addEventListener.apply(searchElement, [type, listener]);
        };

      if (searchElement.addEventListener) {
        searchElement.addEventListener = addEventListenerWrapper;
      } else {
        searchElement.attachEvent = addEventListenerWrapper;
      }

      var autoComplete = new google.maps.places.Autocomplete(searchElement, {
        types: ['geocode'],
        componentRestrictions: {
          country: 'ca'
        },
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(41.38, -95.13),
          new google.maps.LatLng(56.93, -74.16)
        ),
        strictBounds: true,
      });

      google.maps.event.addListener(autoComplete, 'place_changed', function () {
        var place = autoComplete.getPlace();
        if (!place || !place.geometry) {
          return;
        }

        // Fit the selected region into the viewport.
        var bound = {
          'east': place.geometry.viewport.getNorthEast().lng(),
          'north': place.geometry.viewport.getNorthEast().lat(),
          'south': place.geometry.viewport.getSouthWest().lat(),
          'west': place.geometry.viewport.getSouthWest().lng(),
        };
        map.fitBounds(bound);
        map.setCenter(place.geometry.location);

        // If the selected region is small (e.g. street address, postal code),
        // zoom out so user can see pins.
        if (map.getZoom() > defaultZoom) {
          map.setZoom(defaultZoom);
        }

        // Google Analytics
        var eventLabel = [
          'location-autocomplete-click',
          place.name,
        ].join('||');
        sendGAEvent(eventLabel);
      });
    }

    //this function stores both the google full screen button and "Enter Full Screen" button in variables
    //it then binds the "Enter full screen" button to the google full screen button so that it opens the map
    //this runs in the setTimeOut function in the IFFE
    function enableFullScreen() {
      var googleFullscreenButton = document.querySelector(".gm-style button");
      var fullscreenButton = document.getElementById("fullscreen-button");
      fullscreenButton.onclick = function (event) {
        event.preventDefault();
        googleFullscreenButton.click();
      };
    }

    //this function measures the width of the screen and closes the legend accordian if the screen is less than 640px, by adding or removing the 'closed' class
    //the function is run in the iife below in a resize function
    function minimizeLegend(){
      if (window.matchMedia("(max-width: 640px)").matches) {
        accordionTitles[1].classList.add('closed');
      } else {
        accordionTitles[1].classList.remove('closed');
      }
    }

    (function () {
      google.maps.visualRefresh = true;

      var isMobile = (navigator.userAgent.toLowerCase().indexOf('android') > -1) ||
        (navigator.userAgent.match(/(iPod|iPhone|iPad|BlackBerry|Windows Phone|iemobile)/));

      if (isMobile) {
        var viewport = document.querySelector("meta[name=viewport]");
        viewport.setAttribute('content', 'initial-scale=1.0, user-scalable=no');
        toggleClose.apply(accordionTitles[1]);
      }

      var mapDiv = document.getElementById('googft-mapCanvas');

      var map = new google.maps.Map(mapDiv, {
        center: new google.maps.LatLng(44.4678717, -79.4438273),
        zoom: 8,
        mapTypeId: htmlMapID,
        mapTypeControlOptions: {
          mapTypeIds: []
        },
        minZoom: 4
      });

      // Create Fusion Table layer
      var layer = new google.maps.FusionTablesLayer({
        options: {
          styleId: config.table.styleId,
          templateId: config.table.templateId
        }
      });

      //First find both google full screen button and "Enter full Screen" button and add class of "googButton"
      //Get both elements, and loop over them
      //On click of either button, loop through the array of buttons and run toggleFullScreen function
      setTimeout(function () {
        googleFullscreenButton = document.querySelector(".gm-style button");
        googleFullscreenButton.className += ' googButton'

        var googleButtons = document.getElementsByClassName("googButton");
        for (var i = 0, len = googleButtons.length; i < len; i++) {
          googleButtons[i].onclick = function (event) {
            event.preventDefault();
            for (var i = 0, stuff = googleButtons.length; i < stuff; i++) {
              toggleFullscreen.apply(googleButtons[i]);
            }
          }
        };
        enableFullScreen();
      }, 1000);

      //resize function which runs the minimizeLegend function based on screen size
      window.addEventListener("resize", function() {
          minimizeLegend();
      });

      // Init greyscale map skin
      initStyledMap(map);

      // Init "determining your location" toast
      initLocationToast(map);

      // Init event listeners on map and fusion table layer objects
      initListeners(map, layer);

      // Only show desired filters in the anchor of the URL
      processAnchor();

      // Show pins on map
      filterMap(layer, tableId, map);

      // Places legend inside map and binds event listeners to category filters
      initLegend(layer, tableId, map, isMobile);

      // Adds search functionality
      initSearch(map);
    }());
  }
}(window._imGoogle || {}));
