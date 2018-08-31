/*global google,$ */

// @see /static/fusion-table-map-*.html

window.init = function() {
  if(window.jQuery) {
    $(function() {
      var parameters = (function parseQueryString() {
          var nvpair = {};
          var qs = window.location.search.replace('?', '');
          var pairs = qs.split('&');
          $.each(pairs, function(i, v) {
            var pair = v.split('=');
            nvpair[pair[0]] = pair[1];
          });
          return nvpair;
        })(),
        $input = $('#googft-pac-input'),
        $legend = $('#googft-legend'),
        $legendCloseButton = $('#googft-legend-close'),
        $legendOpenButton = $('#googft-legend-open'),
        $mapDiv = $('#googft-mapCanvas'),
        $resetBtn = $('#reset-btn'),
        $searchContainer = $('#search-container'),
        $iframe = window.parent.$('#map-frame[src*="' + window.location.search + '"]'),
        autocomplete,
        layer,
        map,
        where = '',
        isFullscreen = false,
        currCenter,
        // Check if the page is English or French
        language = location.pathname.match(/(\/fr\/|-fr\b)/i) ? 'fr' : 'en',
        tableId = parameters.tableId,
        styleId = parameters.styleId,
        templateId = parameters.templateId,
        mapCanvasHeight = parameters.mapCanvasHeight ? parameters.mapCanvasHeight - 0 : 500,
        hasSearchBar = parameters.searchBar ? parameters.searchBar - 0 : 0,
        hasFullscreenBtn = parameters.fullscreenBtn ? parameters.fullscreenBtn - 0 : 0,
        hasResetBtn = parameters.resetBtn ? parameters.resetBtn - 0 : 0,
        hasGeolocation = parameters.geolocation ? parameters.geolocation - 0 : 0,
        theme = parameters.theme ? parameters.theme : '',
        colName = parameters.colName ? parameters.colName : 'col1',
        defaultLatLng = new google.maps.LatLng(parameters.lat ? parameters.lat : 46.70582692699628,
          parameters.lng ? parameters.lng : -83.91486403124996),
        defaultZoom = parameters.zoom ? parameters.zoom - 0 : 5,
        eventAction = parameters.eventAction ? decodeURIComponent(parameters.eventAction) : '',
        clickEventLabel = parameters.clickEventLabel ? decodeURIComponent(parameters.clickEventLabel) : '',
        special = parameters.special ? parameters.special : '',
        fullscreen = {
          en: 'Full screen',
          fr: 'Plein écran',
        },
        exitFullscreen = {
          en: 'Exit full screen',
          fr: 'Quitter le mode plein écran',
        },
        isDev = location.hostname.match(/^localhost$|ontariogovernment\.ca$/i) ? true : false,
        uaCode = isDev ? 'UA-21003310-7' : 'UA-21003310-6',
        uaDomainsList;

      if(isDev) {
        uaDomainsList = JSON.stringify([]);
      } else {
        uaDomainsList = JSON.stringify([
          'serviceontario.ca',
          'services.gov.on.ca',
          'appmybizaccount.gov.on.ca',
          'appointments.gov.on.ca',
          'personalproperty.gov.on.ca',
          'orgforms.gov.on.ca',
          'services1.gov.on.ca',
        ]);
      }

      /**
       * @param string strThemeName
       * @param object[] arrObjExtend styled map configuration options see https://mapstyle.withgoogle.com/
       * @return object[]
       */
      function getTheme(strThemeName, arrObjExtend) {
        arrObjExtend = arrObjExtend || [];
        var defaultTheme = [
          {
            "featureType": "administrative",
            "elementType": "geometry",
            "stylers": [
              {
                "visibility": "off"
              }
            ]
          },
          {
            "featureType": "poi",
            "stylers": [
              {
                "visibility": "off"
              }
            ]
          },
          {
            "featureType": "road",
            "elementType": "labels.icon",
            "stylers": [
              {
                "visibility": "off"
              }
            ]
          },
          {
            "featureType": "transit",
            "stylers": [
              {
                "visibility": "off"
              }
            ]
          }
        ];
        var grayscaleTheme = [
          {
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#f5f5f5"
              }
            ]
          },
          {
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#616161"
              }
            ]
          },
          {
            "elementType": "labels.text.stroke",
            "stylers": [
              {
                "color": "#f5f5f5"
              }
            ]
          },
          {
            "featureType": "administrative.land_parcel",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#bdbdbd"
              }
            ]
          },
          {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#eeeeee"
              }
            ]
          },
          {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#757575"
              }
            ]
          },
          {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#e5e5e5"
              }
            ]
          },
          {
            "featureType": "poi.park",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#9e9e9e"
              }
            ]
          },
          {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#ffffff"
              }
            ]
          },
          {
            "featureType": "road.arterial",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#757575"
              }
            ]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#dadada"
              }
            ]
          },
          {
            "featureType": "road.highway",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#616161"
              }
            ]
          },
          {
            "featureType": "road.local",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#9e9e9e"
              }
            ]
          },
          {
            "featureType": "transit.line",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#e5e5e5"
              }
            ]
          },
          {
            "featureType": "transit.station",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#eeeeee"
              }
            ]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [
              {
                "color": "#c4dbf8"
              }
            ]
          },
          {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [
              {
                "color": "#9e9e9e"
              }
            ]
          },
        ];
        var theme = [];

        if(strThemeName) {
          strThemeName = strThemeName.toLowerCase();
        }

        console.log('theme', strThemeName);

        switch(strThemeName) {
          case 'grayscale':
            theme = [].concat(grayscaleTheme, arrObjExtend);
            break;
          default:
            theme = [].concat(defaultTheme, arrObjExtend);
            break;
        }
        return theme;
      }

      /**
       * @param theme
       */
      function initStyledMap(theme) {
        var styledMapType = new google.maps.StyledMapType(theme);

        map.mapTypes.set('styled_map', styledMapType);
        map.setMapTypeId('styled_map');
      }

      function initGoogleAnalytics() {
        (function(i, s, o, g, r, a, m) {
          i.GoogleAnalyticsObject = r;
          i[r] = i[r] || function() {
            (i[r].q = i[r].q || []).push(arguments);
          };
          i[r].l = 1 * new Date();
          a = s.createElement(o);
          m = s.getElementsByTagName(o)[0];
          a.async = 1;
          a.src = g;
          m.parentNode.insertBefore(a, m);
        })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

        ga('create', uaCode, {
          'cookieDomain': 'auto',
          'allowLinker': true
        });
        ga('require', 'linker');
        ga('linker:autoLink', uaDomainsList);
      }

      function sendGAEvent(eventLabel, eventValue) {
        if(eventAction) {
          ga('send', 'event', 'feature', eventAction, eventLabel, eventValue);
        }
      }

      function removeGeolocationToast(toast) {
        toast.remove();
        map.controls[google.maps.ControlPosition.TOP_CENTER].clear();
      }

      function initGeolocation() {
        var toast = document.getElementById('googft-geolocation-toast');
        // Centres and zooms in to user's current location on init.
        if(navigator.geolocation) {
          // Put the toast to the map if browser supports geolocation.
          map.controls[google.maps.ControlPosition.TOP_CENTER].push(toast);
          navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            map.setZoom(15);
            map.setCenter(pos);
            // Removes the toast after successfully fetched location.
            removeGeolocationToast(toast);
            // Google Analytics.
            sendGAEvent('location-geolocation');
          }, function() {
            // If fails to get geolocation, removes the toast when map has loaded.
            removeGeolocationToast(toast);
          });
        } else {
          // Remove the toast if browser does not support geolocation.
          removeGeolocationToast(toast);
        }
      }

      function searchByAddress() {
        var place = autocomplete.getPlace();

        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();

        // Exit if search returned no results.
        if(!place.geometry) {
          return;
        }

        if(place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }

        map.fitBounds(bounds);

        // Set a not-too-close zoom level if user enters a complete address or postal code.
        if(place.types[0] === 'street_address' || place.types[0] === 'postal_code') {
          map.setZoom(15);
        }

        // Google Analytics
        var eventLabel = [
          'location-autocomplete-click',
          place.name,
        ].join('||');
        sendGAEvent(eventLabel);
      }

      /* Code generated by Google Fusion Table map publish.*/
      google.maps.visualRefresh = true;
      var isMobile = (navigator.userAgent.toLowerCase().indexOf('android') > -1) ||
        (navigator.userAgent.match(
          /(iPod|iPhone|iPad|BlackBerry|Windows Phone|iemobile)/));
      if(isMobile) {
        var viewport = document.querySelector("meta[name=viewport]");
        viewport.setAttribute('content', 'initial-scale=1.0, user-scalable=no');
      }

      map = new google.maps.Map($mapDiv.get(0), {
        center: defaultLatLng,
        zoom: defaultZoom,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      });

      function processSpecial() {
        if(special === 'on150') {
          // Generate where clause to hide past events
          var today = new Date();
          var year = today.getFullYear();
          var month = today.getMonth() + 1;
          var day = today.getDate();
          var todayFormatted = (year + '-') +
            (month < 10 ? '0' : '') + month + '-' +
            (day < 10 ? '0' : '') + day;
          where = 'EndDate >= \'' + todayFormatted + '\'';
        }
      }

      function initMap() {
        function toggleFullscreen(event) {
          // Prevent non-related map instances from going into fullscreen.
          if(event) {
            event.stopPropagation();
          }

          if(isFullscreen) {
            $iframe.removeAttr('style');
            fullscreenTxt.innerHTML = fullscreen[language];
          } else {
            // Adjust the iframe to fill the whole page
            $iframe.css({
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: 10000,
              height: '100%',
            });
            fullscreenTxt.innerHTML = exitFullscreen[language];
          }
          $('#googft-mapCanvas').toggleClass('fullscreen');
          $('.map-container').toggleClass('fullscreen');

          // Recentres the map after toggling fullscreen.
          currCenter = map.getCenter();
          google.maps.event.trigger(map, 'resize');
          map.setCenter(currCenter);

          isFullscreen = !isFullscreen;
        }

        // Hide the search bar if disabled in query string.
        if(!hasSearchBar) {
          $('#search-bar').hide();
        }

        // Hide the reset button if disabled in query string.
        if(!hasResetBtn) {
          $resetBtn.hide();
          $searchContainer.removeClass('medium-10');
        }

        if(hasFullscreenBtn) {
          // Create a div to hold the control.
          var fullscreenBtn = document.createElement('div');
          fullscreenBtn.className += " map-btn";
          var fullscreenTxt = document.createElement('div');
          fullscreenTxt.innerHTML = fullscreen[language];
          fullscreenBtn.appendChild(fullscreenTxt);

          fullscreenBtn.addEventListener('click', toggleFullscreen);
          map.controls[google.maps.ControlPosition.TOP_RIGHT].push(fullscreenBtn);

          // Exit fullscreen on pressing the esc key.
          $(document).keydown(function(e) {
            if(e.which === 27 && isFullscreen) {  // esc key maps to keycode 27
              toggleFullscreen();
            }
          });
        }

        autocomplete = new google.maps.places.Autocomplete($input.get(0), {
          types: ['geocode'],
          componentRestrictions: {country: 'ca'},
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(41.38, -95.13),
            new google.maps.LatLng(56.93, -74.16)
          ),
          strictBounds: true,
        });

        var searchElem = $input.get(0),
          _addEventListener = searchElem.addEventListener ? searchElem.addEventListener : searchElem.attachEvent,
          addEventListenerWrapper = function(type, listener) {
            if(type === "keydown") {
              var origListener = listener;
              listener = function(event) {
                var suggested = $(".pac-item-selected").length;
                if(event.which === 13 && !suggested) {
                  // user hit enter without selecting an option from the auto-suggest list.
                  // Fake down arrow key press so that we can pick the first item for them.
                  var downArrowPress = $.Event("keydown", {
                    keyCode: 40,
                    which: 40
                  });
                  origListener.call(searchElem, downArrowPress);
                }
                origListener.call(searchElem, event);
              };
            }
            _addEventListener.apply(searchElem, [type, listener]);
          };

        if(searchElem.addEventListener) {
          searchElem.addEventListener = addEventListenerWrapper;
        } else {
          searchElem.attachEvent = addEventListenerWrapper;
        }

        // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.
        autocomplete.addListener('place_changed', searchByAddress);

        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($legendOpenButton.get(0));
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($legend.get(0));

        // Create a layer displaying all markers on the map.
        layer = new google.maps.FusionTablesLayer({
          map: map,
          heatmap: {
            enabled: false
          },
          query: {
            select: colName,
            from: tableId,
            where: where
          },
          options: {
            // Adjust the Fusion table according to language.
            styleId: styleId,
            templateId: templateId
          }
        });

        // Mobile adaptation.
        if(isMobile) {
          $legend.hide();
          $legendOpenButton.show().click(function() {
            $legend.show();
            $legendOpenButton.hide();
          });
          $legendCloseButton.show().click(function() {
            $legend.hide();
            $legendOpenButton.show();
          });
        }

        // Set the height of map canvas.
        var height = $.isNumeric(mapCanvasHeight) ? mapCanvasHeight + 'px' : mapCanvasHeight;
        $('#googft-mapCanvas, .map-container').css({
          'height': height,
        });

        // Google Analytics.
        google.maps.event.addListener(layer, 'click', function(e) {
          var eventLabels = ['marker-click'];
          // Get event labels from query string.
          clickEventLabel.split('||').forEach(function(nextLabel) {
            // Use curly braces to reference data in fusion table.
            if(nextLabel[0] === '{' && nextLabel.slice(-1) === '}') {
              eventLabels.push(e.row[nextLabel.slice(1, -1)].value);
            } else {
              eventLabels.push(nextLabel);
            }
          });
          var eventLabel = eventLabels.join('||');
          var zoomLevel = map.getZoom();
          sendGAEvent(eventLabel, zoomLevel);
        });

        // Reset map and markers layer when user clicks the reset button.
        $resetBtn.click(function() {
          $input.val('').focus();
          layer.setOptions({
            query: {
              select: colName,
              from: tableId
            }
          });
          map.setCenter(defaultLatLng);
          map.setZoom(defaultZoom);
        });
      }

      // Init styled map skin.
      initStyledMap(getTheme(theme));

      // Import Google Analytics library.
      initGoogleAnalytics();

      // Process special cases for certain maps.
      processSpecial();

      // Initialize the map.
      initMap();

      // Initialize geolocation if enabled in query string.
      if(hasGeolocation) {
        initGeolocation();
      }
    });
  }
};
