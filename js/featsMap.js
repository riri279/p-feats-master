/* global google, $ */


window.initMap = function() {
  if(window.jQuery) {
    $(function() {
      var $input = $('#googft-pac-input'),
        $legend = $('#googft-legend'),
        $legendCloseButton = $('#googft-legend-close'),
        $legendOpenButton = $('#googft-legend-open'),
        $mapDiv = $('#googft-mapCanvas'),
        $accessibility = $('#accessibility'),
        autocomplete,
        defaultLatLng = new google.maps.LatLng(46.70582692699628, -83.91486403124996),
        defaultZoom = 5,
        filterColours = {
          'PR003': 'e6194b',
          'PR013': '3cb44b',
          'PR015': 'ffe119',
          'PR023': '0082c8',
          'PR030': 'f58231',
          'PR031': '911eb4',
          'PR032': '46f0f0',
          'PR035': 'f032e6',
          'PR036': 'd2f53c',
          'PR040': 'fabebe',
          'PR041': '008080',
        },
        categoryNames = {
          'PR003': 'Adult High School Credit Programs',
          'PR013': 'Literacy and Basic Skills',
          'PR015': 'Ontario Employment Assistance Services',
          'PR023': 'Ontario Youth Apprenticeship Program',
          'PR030': 'Apprenticeship Office',
          'PR031': 'Co-op Diploma Apprenticeship',
          'PR032': 'Employment Service Sites',
          'PR035': 'Canada Ontario Job Grant',
          'PR036': 'Youth Job Connection',
          'PR040': 'Youth Job Connection Summer',
          'PR041': 'Youth Job Link',
        },
        map,
        $iframe = window.parent.$('#map-frame[src*=' + processAnchor() + ']'),
        isFullscreen = false,
        openedInfoWindow,
        isDev = location.hostname.match(/^localhost$|ontariogovernment\.ca$/i) ? true : false,
        // Check if the page is English or French
        language = location.pathname.match(/(\/fr\/|-fr\b)/i) ? 'fr' : 'en',
        uaCode = isDev ? 'UA-21003310-7' : 'UA-21003310-6',
        uaDomainsList,
        fullscreen = {
          en: 'Full screen',
          fr: 'Plein écran',
        },
        exitFullscreen = {
          en: 'Exit full screen',
          fr: 'Quitter le mode plein écran',
        },
        locations = {},
        currentLocationMarker,
        apiServiceCrossDomain = isDev ? 'https://stage.api.ontariogovernment.ca'
                                      : 'https://api.ontario.ca',
        apiService = '/api/locations' + (language === 'fr' ? '/fr' : '') + '/feats',
        pageLimit = 50,
        numSynchronousRequests = 10,
        maxRetry = 20,
        numRetry = 0,
        infoWindowTemplate = '<h3 class="h6"><a target="_blank" rel="noopener noreferrer" ' +
                             'href="' + (language === 'fr' ? '/fr' : '') +
                             '/locations/' + (language === 'fr' ? 'emploi-formation' : 'employment-training') +
                             '/details?fid={field_fid}&lang=' + language + '">{field_orgname}</a></h3>' +
                             '<p>{field_address}</p><p>{field_phone}<br>{field_free_phone}</p>' +
                             '<p class="no-bottom-margin"><a href="mailto:{field_email}">' +
                             '{field_email}</a></p>',
        popUpWindowFields = [
          'field_fid',
          'field_orgname',
          'field_address',
          'field_phone',
          'field_free_phone',
          'field_email',
        ];

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

      function initMarkers(map) {
        function processApiResponse(map, offset, data) {
          // Add all markers using data returned by the API.
          function addMarkers(data) {
            if (data) {
              data.data.forEach(function(nextData) {
                addMarker(map, nextData);
              });
            }
          }

          // Blast the next bunch of synchronous requests to fetch the next chunk.
          function nextChunk(data) {
            processApiResponse(map, offset + pageLimit * numSynchronousRequests, data);
          }

          // Load the last page of this chunk, and start loading the next chunk.
          function loadLastPage(i) {
            if (numRetry < maxRetry) {
              return $.getJSON({
                url: url + (offset + pageLimit * i),
                success: nextChunk,
              })
              // Try again if failed to load.
              .fail(function() {
                numRetry++;
                loadLastPage(i);
              });
            }
          }

          // Load a page that is not the last page of this chunk.
          function loadPage(i) {
            if (numRetry < maxRetry) {
              return $.getJSON({
                url: url + (offset + pageLimit * i),
                success: addMarkers,
              })
              // Try again if failed to load.
              .fail(function() {
                numRetry++;
                loadPage(i);
              });
            }
          }

          var url = apiServiceCrossDomain + apiService + '?filter[langcode][value]=' + language +
                    '&filter[field_category_id][value]=' + processAnchor() + '&page[offset]=';

          // If data is valid, add the markers to the map.
          addMarkers(data);

          // Synchronously fetch data from the API. Super fast!
          if (!data || data.links.next) {
            // It is faster not to load backwards for embedded maps since they usually have only 1 chunk.
            for (var i = 0; i < numSynchronousRequests; i++) {
              if (i === numSynchronousRequests - 1) {
                loadLastPage(i);
              } else {
                loadPage(i);
              }
            }
          } else {
            $(document).ajaxStop(function() {
              // Populate accessible version of data.
              initAccessibility();
            });
          }
        }

        // Fetch data from the API.
        processApiResponse(map, 0);
      }

      function addMarker(map, data) {
        // Get basic pinpoint information from the API response.
        var lat = data.attributes.field_latitude;
        var lng = data.attributes.field_longitude;
        var fid = data.attributes.field_fid;
        var orgname = data.attributes.field_orgname;
        var category = processAnchor();
        if (filterColours[category]) {
          var pinColour = filterColours[category];
          var pinImage = new google.maps.MarkerImage('https://chart.apis.google.com/' +
                                                     'chart?chst=d_map_pin_letter&chld=%E2%80%A2|' +
                                                     pinColour,
                                                     new google.maps.Size(21, 34),
                                                     new google.maps.Point(0,0),
                                                     new google.maps.Point(10, 34)
                                                    );
          var marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, lng),
            map: map,
            icon: pinImage,
            title: [
              fid,
              orgname,
            ].join('||'),
          });
          markers.push(marker);
          console.log(marker);

          // Assign info window to the pinpoint.
          var content = infoWindowTemplate;
          popUpWindowFields.forEach(function(nextField) {
            content = content.replace(new RegExp('{' + nextField + '}', 'g'),
                                      data.attributes[nextField] || '');
          });
          var infoWindow = new google.maps.InfoWindow({
            content: content,
          });
          marker.addListener('click', function() {
            // Close existing info window.
            if (openedInfoWindow) {
              openedInfoWindow.close();
            }

            // Open the info window for clicked marker and store it.
            infoWindow.open(map, marker);
            openedInfoWindow = infoWindow;

            // Google Analytics.
            sendGAEvent([
              'marker-click',
              this.title,
            ].join('||'), map.getZoom());
          });

          // Store locations for populating accessible content.
          if (data.attributes.field_address) {
            var city = data.attributes.field_location;
            // Sort locations by street name, excluding street number.
            var sortingFactor = data.attributes.field_address;
            if ($.isNumeric(data.attributes.field_address[0])) {
              sortingFactor = sortingFactor.substring(sortingFactor.indexOf(' ') + 1);
            }
            if (!locations[city]) {
              locations[city] = {};
            }
            locations[city][sortingFactor] = data;
          }
        }

        if (window.markerCount) {
          window.markerCount++;
        } else {
          window.markerCount = 1;
        }
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
        ga('linker:autoLink', uaDomainsList );
      }

      function sendGAEvent(eventLabel, eventValue) {
        ga('send',
           'event',
           'feature',
           'FEATS map: ' + categoryNames[processAnchor()],
           eventLabel,
           eventValue
        );
      }

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
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
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
        ]
      });

      var markerCluster = new MarkerClusterer(map, markers,
            {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

      // Create a div to hold the control.
      var fullscreenBtn = document.createElement('div');
      fullscreenBtn.className += ' map-btn';
      var fullscreenTxt = document.createElement('div');
      fullscreenTxt.innerHTML = fullscreen[language];
      fullscreenBtn.appendChild(fullscreenTxt);

      function toggleFullscreen(event) {
        // Prevent non-related map instances from going into fullscreen.
        if (event) {
          event.stopPropagation();
        }

        if (isFullscreen) {
          $iframe.removeAttr('style');
          fullscreenTxt.innerHTML = fullscreen[language];
          sendGAEvent('full-screen||exit');
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
          sendGAEvent('full-screen||enter');
        }
        $('#googft-mapCanvas').toggleClass('fullscreen');
        $('.map-container').toggleClass('fullscreen');

        // Recentres the map after toggling fullscreen.
        var currCenter = map.getCenter();
        google.maps.event.trigger(map, 'resize');
        map.setCenter(currCenter);

        isFullscreen = !isFullscreen;
      }

      $(fullscreenBtn).click(toggleFullscreen);
      map.controls[google.maps.ControlPosition.TOP_RIGHT].push(fullscreenBtn);

      // Exit fullscreen on pressing the esc key.
      $(document).keydown(function(e) {
        if (e.which === 27 && isFullscreen) {  // esc key maps to keycode 27
          toggleFullscreen();
        }
      });

      autocomplete = new google.maps.places.Autocomplete(
        $input.get(0), {
          // Restrict autocomplete search results to only Canadian addresses.
          componentRestrictions: {
            'country': 'ca'
          }
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

      // Bias the SearchBox results towards current map's viewport.
      map.addListener('bounds_changed', function() {
        autocomplete.setBounds(map.getBounds());
      });

      // Listen for the event fired when the user selects a prediction and retrieve
      // more details for that place.
      autocomplete.addListener('place_changed', searchByAddress);

      function searchByAddress() {
        var place = autocomplete.getPlace();

        // Exit if search returned no results.
        if(!place.geometry) {
          return;
        }

        // Remove the marker if one already exists.
        if (currentLocationMarker) {
          currentLocationMarker.setMap(null);
        }

        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();

        // Set up marker icon for the search result.
        var icon = {
          url: place.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25),
        };

        // Create a marker for searched address.
        currentLocationMarker = new google.maps.Marker({
          map: map,
          icon: icon,
          title: place.name,
          position: place.geometry.location,
        });

        if(place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }

        map.fitBounds(bounds);

        // Set a not-too-close zoom level if user enters a complete address or postal code.
        if (map.getZoom() > 13) {
          map.setZoom(13);
        }

        // Google Analytics
        var eventLabel = [
          'location-autocomplete-click',
          place.name,
        ].join('||');
        sendGAEvent(eventLabel);
      }

      map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($legendOpenButton.get(0));
      map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($legend.get(0));

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

      function processAnchor() {
        var hash = window.location.hash;
        // Format should be #!PR013
        if (hash && hash.substring(1, 2) === '!') {
          var category = hash.substring(2);
          if (filterColours[category]) {
            return category;
          }
        }
      }

      function removeGeolocationToast(toast) {
        toast.remove();
        map.controls[google.maps.ControlPosition.TOP_CENTER].clear();
      }

      function initGeolocation(map) {
        var toast = document.getElementById('googft-geolocation-toast');
        // Centres and zooms in to user's current location on init.
        if (navigator.geolocation) {
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

      function initAccessibility() {
        var innerHTML = '';
        Object.keys(locations).sort().forEach(function(nextCity) {
          innerHTML += '<h3>' + nextCity + '</h3><ol>';
          Object.keys(locations[nextCity]).sort().forEach(function(nextLocation) {
            var nextData = locations[nextCity][nextLocation];
            innerHTML += '<li><a href="/locations/employment-training?fid=' +
                                  nextData.attributes.field_fid + '">' +
                                  nextData.attributes.field_address + ' - ' +
                                  nextData.attributes.field_orgname + '</a></li>';
          });
          innerHTML += '</ol>';
        });
        $accessibility.append(innerHTML);
      }

      // Load Google Analytics library.
      initGoogleAnalytics();

      // Get users geolocation and zoom in the map.
      initGeolocation(map);

      // Show pins on map.
      //initMarkers(map);
      var markerCluster = new MarkerClusterer(map, markers);
    });
  }
};
