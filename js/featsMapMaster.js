/* global google */

var markerCluster;
var programs = [[0,2,3,""]];
var doIt = true;
var dataB;

(function($) {
  window.initMap = function() {
    var categoryFilterElements = document.getElementsByName('category-filter'),
      statusFilterElements = document.getElementsByName('status-filter'),
      accordionTitles = document.getElementsByClassName('accordion-title'),
      mobileFilter = document.getElementById('mobile-filter'), // 0: Search, 1: Filter
      language = location.pathname.match(/(\/fr\/|\-fr\b)/i) ? 'fr' : 'en',
      isDev = location.hostname.match(/^localhost$|ontariogovernment\.ca$/i) ? true : false,
      filterColours = {
        'PR003': '9933FF',
        'PR013': '9933FF',
        'PR015': '9933FF',
        'PR023': '9933FF',
        'PR030': '9933FF',
        'PR031': '9933FF',
        'PR032': '9933FF',
        'PR035': '9933FF',
        'PR036': '9933FF',
        'PR040': '9933FF',
        'PR041': '9933FF',
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
      peopleTypes = {
        'CL001': ['YH-6000.3280', 'YZ-3380'],
        'CL002': ['YL-3500.6400', 'YB-8000', 'YZ-6100'],
        'CL003': ['YZ-1000', 'TB-0900.1000'],
        'CL004': ['YH-6000.2100'],
        'CL005': ['YE-3300', 'YE-7000', 'YE-6500', 'YE-2000.2150', 'YG-8000.3300',
                  'YL-3500.3300', 'YE-3500', 'YE-6970'],
        'CL006': ['YC-1700', 'YF-1500', 'YF-1800', 'YF-2200', 'YF-3000.1300', 'YF-3200',
                  'YF-4500', 'YF-5000', 'YF-5500', 'YF-6500', 'YF-9000', 'YG-8000.8000',
                  'YJ-8750', 'YZ-1700', 'YZ-5000'],
        'CL007': ['YC'],
        'CL008': ['YG-8000', 'ND-6500.9800'],
        'CL009': ['YS-2000.9500'],
        'CL010': ['YB-9000', 'YB-9500.0500', 'YJ-0500.0500', 'YJ-8750.1500', 'YV-3000.8000', 'ND-6500.9800'],
      },
      map,
      defaultZoom = 15,
      markers = {},
      typesToMarkers = {},
      currentLocationMarker,
      openedInfoWindow,
      preSelectedFilter,
      hasFinishedLoading = false,
      apiServiceCrossDomain = isDev ? 'https://stage.api.ontariogovernment.ca'
                                    : 'https://api.ontario.ca',
      apiService = '/api/locations' + (language === 'fr' ? '/fr' : '') + '/feats',
      pageLimit = 50,
      numSynchronousRequests = 10,
      maxRetry = 20,
      numRetry = 0,
      infoWindowTemplate = '<h3 class="h6"><a target="_blank" rel="noopener noreferrer" ' +
                           'href="{field_web}"</a>{field_orgname}</h3>' +
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
        'field_web',
      ];

    function initStyledMap(map) {
      markerCluster = new MarkerClusterer(map, [], {imagePath: "../img/markerCluster", minimumClusterSize: '100000'});
      var mapSkin = [
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

      var styledMapType = new google.maps.StyledMapType(mapSkin);

      map.mapTypes.set('styled_map', styledMapType);
      map.setMapTypeId('styled_map');
    }

    function toggleClose() {
      if (this.className.indexOf('closed') === -1) {
        this.className += ' closed';
        $('.top-bar-toggle').attr("src","/img/Hide2.png");
      } else {
        this.className = this.className.replace('closed', '').trim();
        $('.top-bar-toggle').attr("src","/img/Hide.png");
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
          map.setZoom(defaultZoom);
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

    function initMarkers(map) {
      function processApiResponce(map, offset, data) {
        // Add all markers using data returned by the API.
        function addMarkers(data) {
          if (data) {
            data.data.forEach(function(nextData) {
              addMarker(map, nextData);
            });
            sortIt();
          }
        }

        // Blast the next bunch of synchronous requests to fetch the next chunk.
        function nextChunk(data) {
          processApiResponce(map, offset + pageLimit * numSynchronousRequests, data);
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

        var url = apiServiceCrossDomain + apiService + '?filter[langcode][value]=' + language + '&page[offset]=';

        // If data is valid, add the markers to the map.
        addMarkers(data);

        // Synchronously fetch data from the API. Super fast!
        if (!data || data.links.next) {
          // Load the chunk backwards so it knows if next chunk exists earlier. Optimization wins!
          for (var i = numSynchronousRequests - 1; i > -1; i--) {
            if (i === numSynchronousRequests - 1) {
              loadLastPage(i);
            } else {
              loadPage(i);
            }
          }
        } else {
          $(document).ajaxStop(function() {
            hasFinishedLoading = true;
            // Remove the loading toast when there are no more entries to load.
            toast.remove();
            // Enable all filters.
            categoryFilterElements.forEach(function(nextElement) {
              nextElement.disabled = false;
            });
            statusFilterElements.forEach(function(nextElement) {
              nextElement.disabled = false;
            });
            // Enable the filter that is clicked before loading is finished.
            if (preSelectedFilter) {
              applyFilter.apply(preSelectedFilter, [map]);
            }
          });
        }
      }

      // Put the loading toast to the map.
      var toast = document.getElementById('googft-loading-toast');
      $(toast).hide();
      map.controls[google.maps.ControlPosition.CENTER].push(toast);

      // Fetch data from the API.
      processApiResponce(map, 0);
    }

    function applyFilter() {
      if (hasFinishedLoading) {
        // If the filter toggled is a status filter, refresh all shown markers
        if (this.name === 'status-filter') {
          refreshMarkers();
        } else {
          // Toggle show/hide filters of the category clicked.
          if (this.checked) {
            showMarkers(this.value);
          } else {
            hideMarkers(this.value);
          }
        }
      } else {
        // Show the loading toast.
        $('#googft-loading-toast').show();
        // Disable all filters.
        categoryFilterElements.forEach(function(nextElement) {
          nextElement.disabled = true;
        });
        statusFilterElements.forEach(function(nextElement) {
          nextElement.disabled = true;
        });
        // Store the clicked filter so it can be enabled after loading is finished.
        preSelectedFilter = this;
      }

      // Google Analytics.
      sendGAEvent([
        'category-' + (this.checked ? 'on' : 'off'),
        categoryNames[this.value],
      ].join('||'));

      updateList();
    }

    function checkAll() {
      $("input[name='category-filter']").each(function(){
        $(this).prop('checked', true);
      });

      refreshMarkers();
    }

    function clearAll() {
      $("input[name='category-filter']").each(function(){
        $(this).prop('checked', false);
      });

      refreshMarkers();
    }

    function initLegend(map, isMobile) {
      var legend = document.getElementById('googft-legend');
      var i;

      $('#checkAll').bind('click', checkAll);
      $('#clearAll').bind('click', clearAll);

      // Bind event listeners to legend filters.
      for (i = 0; i < categoryFilterElements.length; i++) {
        google.maps.event.addDomListener(categoryFilterElements[i], 'click', applyFilter);
      }

      // Bind event listeners to status filters.
      for (i = 0; i < statusFilterElements.length; i++) {
        google.maps.event.addDomListener(statusFilterElements[i], 'click', applyFilter);
      }

      // Bind event listeners to accordion titles.
      for (i = 0; i < accordionTitles.length; i++) {
        google.maps.event.addDomListener(accordionTitles[i], 'click', toggleClose);
      }

      /*google.maps.event.addDomListener(mobileFilter, 'click', function() {
        toggleClose.apply(accordionTitles[1]);
      });*/

      // Hide the filters by default if user is on mobile.
      if (isMobile) {
        toggleClose.apply(accordionTitles[1]);
      }

      //legend.index = 1;

      map.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('googft-legend-open'));
      map.controls[google.maps.ControlPosition.LEFT_TOP].push(legend);
    }

    function initSearch(map) {
      var searchElement = document.getElementById("googft-search-element");
      var _addEventListener = searchElement.addEventListener ? searchElement.addEventListener :
                              searchElement.attachEvent,
        addEventListenerWrapper = function(type, listener) {
          if (type === "keydown") {
            var origListener = listener;
            listener = function(event) {
              var suggested = document.getElementsByClassName("pac-item-selected").length,
                key = event.which || event.keyCode || 0;
              if (key === 13 && !suggested) {
                // User hit enter without selecting an option from the auto-suggest list.
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
        componentRestrictions: {country: 'ca'},
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(41.38, -95.13),
          new google.maps.LatLng(56.93, -74.16)
        ),
        strictBounds: true,
      });

      google.maps.event.addListener(autoComplete, 'place_changed', function() {
        var place = autoComplete.getPlace();
        newDistances(place.geometry.location.lat(), place.geometry.location.lng());
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

        // Remove the marker if one already exists.
        if (currentLocationMarker) {
          currentLocationMarker.setMap(null);
        }

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

        // Google Analytics.
        var eventLabel = [
          'location-autocomplete-click',
          place.name,
        ].join('||');
        sendGAEvent(eventLabel);
      });
    }

    function addMarker(map, data) {
      //console.log(data);
      // Get basic pinpoint information from the API response.
      var lat = data.attributes.field_latitude;
      var lng = data.attributes.field_longitude;
      var fid = data.attributes.field_fid;
      var orgname = data.attributes.field_orgname;
      var categories = data.attributes.field_category_id;
      var audiences = data.attributes.audience;
      var types = data.attributes.field_category_id;
      var address = data.attributes.field_address;
      var phone = data.attributes.field_phone;
      var email = data.attributes.field_email;

      var website = data.attributes.field_web;

      // Loop through all categories this location belongs to.
      categories.forEach(function(nextCategory) {
        if (filterColours[nextCategory]) {
          var pinColour = filterColours[nextCategory];
          dataB = data;
          var pinImage = new google.maps.MarkerImage('https://chart.apis.google.com/' +
                                                     'chart?chst=d_map_pin_letter&chld=%E2%80%A2|' +
                                                     pinColour,
                                                     new google.maps.Size(21, 34),
                                                     new google.maps.Point(0,0),
                                                     new google.maps.Point(10, 34)
                                                    );
          var marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, lng),
            icon: pinImage,
            title: [
              nextCategory,
              fid,
              orgname,
            ].join('||'),
          });

          // Assign info window to the pinpoint.
          var content = infoWindowTemplate;
          popUpWindowFields.forEach(function(nextField) {
            content = content.replace(new RegExp('{' + nextField + '}', 'g'),
                                      data.attributes[nextField] || '');
          });
          var infoWindow = new google.maps.InfoWindow({
            content: content,
          });


          //make distance calculation to WATERLOO becuase we need to do more work
          var originLatitude = 43.4642578;
          var originLongitude = -80.5204096;
          var distance = 0;

          distance = Math.round(getDistance(originLatitude, originLongitude, lat, lng) * 10) / 10;

          // create html for list entry
          var listHTML = "";
          listHTML += '<div id="' + fid + '" class="list-item list-hide"><div class="list-item-inner">';
          listHTML += '<a class="list-title" target="_blank" href="//' + website + '">' + orgname + '</a><br>';
          listHTML += '<span class="list-category">';

          var i = 0;

          for (i = 0; i < types.length; i ++){
            listHTML += "<span class='category-card'>" + categoryNames[types[i]] + "</span>";
          }

          listHTML += '</span><br>';

          if(address != null){
            listHTML += '<span class="list-address">' + address + '</span><br>'; 
            listHTML += '<a class="dir-link" target= "_blank" href="https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng + '"> Get Directions</a><br>';
          }
          if(phone != null){
            listHTML += '<span class="list-phone">' + phone + '</span><br>'
          }
          if(email != null){
            listHTML += '<span class="list-email">' + email + '</span><br>'
          }
          if(website != null){
            listHTML += '<a target="_blank" class="list-website" href="//' + website + '">' + website + '</a><br>'
          }

          listHTML += '</div><div class="distance">' + distance + ' km</div></div>';

          programs.push([distance,lat,lng, listHTML, fid, marker]);


          // add listener to list entry to open info panel
          $('#' + fid).bind('click', function() {
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

          // Store pinpoint objects for toggling.
          if (markers[nextCategory]) {
            markers[nextCategory].push(marker);
          } else {
            markers[nextCategory] = [marker];
          }

          // Populate the typesToMarkers object.
          if (audiences) {
            audiences.forEach(function (nextAudience) {
              Object.keys(peopleTypes).forEach(function (nextType) {
                peopleTypes[nextType].forEach(function (nextTypeDetail) {
                  if (nextAudience.tid.indexOf(nextTypeDetail) === 0) {
                    if (typesToMarkers[nextType]) {
                      typesToMarkers[nextType].push(marker);
                    } else {
                      typesToMarkers[nextType] = [marker];
                    }
                  }
                });
              });
            });
          }
        }
      });

      if (window.markerCount) {
        window.markerCount++;
      } else {
        window.markerCount = 1;
      }
    }

    function getDistance(lat1,lon1,lat2,lon2) {
      var R = 6371; // Radius of the earth in km
      var dLat = deg2rad(lat2-lat1);  // deg2rad below
      var dLon = deg2rad(lon2-lon1); 
      var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c; // Distance in km
      return d;
    }

    function deg2rad(deg) {
      return deg * (Math.PI/180)
    }

    function newDistances(newLat, newLng){
      programs.forEach(function(program){
        var distance = Math.round(getDistance(newLat, newLng, program[1], program[2]) * 10) / 10;
        program[0] = distance;
      });
      doIt = true;
      sortIt();
    }

    function sortIt(){
      if (doIt){
        programs = mergeSort(programs);
        doit = false;
        addIt();
      }
    }

    function addIt(){
        $("#program-list-items").html("");
      programs.forEach(function(dataItem){
        $("#program-list-items").append(dataItem[3]);
        $('#' + dataItem[4] + ' > .distance').html(dataItem[0] +  " km");
        var content = infoWindowTemplate;
          popUpWindowFields.forEach(function(nextField) {
            content = content.replace(new RegExp('{' + nextField + '}', 'g'),
                                      dataB.attributes[nextField] || '');
          });
          var infoWindow = new google.maps.InfoWindow({
            content: content,
          });

        // add listener to list entry to open info panel
        $('#' + dataItem[4]).bind('click', function() {
          // Close existing info window.
          if (openedInfoWindow) {
            openedInfoWindow.close();
          }

          // Open the info window for clicked marker and store it.
          infoWindow.open(map, dataItem[5]);
          openedInfoWindow = infoWindow;

          // Google Analytics.
          sendGAEvent([
            'marker-click',
            this.title,
          ].join('||'), map.getZoom());
        });
      });

      updateList();
    }



    // Split the array into halves and merge them recursively 
function mergeSort (arr) {
  if (arr.length === 1) {
    // return once we hit an array with a single item
    return arr
  }

  const middle = Math.floor(arr.length / 2) // get the middle item of the array rounded down
  const left = arr.slice(0, middle) // items on the left side
  const right = arr.slice(middle) // items on the right side

  return merge(
    mergeSort(left),
    mergeSort(right)
  )
}

// compare the arrays item by item and return the concatenated result
function merge (left, right) {
  let result = []
  let indexLeft = 0
  let indexRight = 0

  while (indexLeft < left.length && indexRight < right.length) {
    if (left[indexLeft][0] < right[indexRight][0]) {
      result.push(left[indexLeft])
      indexLeft++
    } else {
      result.push(right[indexRight])
      indexRight++
    }
  }
  return result.concat(left.slice(indexLeft)).concat(right.slice(indexRight))
}





    function checkInPeopleTypeFilter(marker) {
      var checked = 0;
      var checkedCategories = [];
      var allFilters = $("input[name=status-filter]");

      // Get all checked filters.
      allFilters.each(function (i) {
        var nextFilter = allFilters[i];
        if (nextFilter.checked) {
          checked++;
          checkedCategories.push(nextFilter.value);
        }
      });

      // Show all markers if all or no filters are selected.
      if (checked === 0 || checked === allFilters.length) {
        return true;
      }

      // Find if the marker is in any checked people type categories.
      var found = false;
      checkedCategories.forEach(function (nextCategory) {
        if (typesToMarkers[nextCategory].indexOf(marker) !== -1) {
          found = true;
          return;
        }
      });

      return found;
    }

    function hideMarkers(category) {
      markers[category].forEach(function(nextMarker) {
        nextMarker.setMap(null);
        markerCluster.removeMarker(nextMarker);
      });
   
    }

    function showMarkers(category) {
      markers[category].forEach(function(nextMarker) {
        // Only show the marker if it's in checked people type filters.
        if (checkInPeopleTypeFilter(nextMarker)) {
          nextMarker.setMap(map);
          markerCluster.addMarker(nextMarker);
        }
      });

    }

    function updateList(category){

      cluster = markerCluster.getMarkers();
      if (cluster.length == 0){
        $('#googft-mapCanvas').addClass('extend-map');
        $('#program-list').addClass('hide');
      } else {
        $('#googft-mapCanvas').removeClass('extend-map');
        $('#program-list').removeClass('hide');
      }

      // hide all markers
      Object.keys(markers).forEach(function(nextCategory) {
        markers[nextCategory].forEach(function(nextMarker) {
          var split = nextMarker.title.split("||");
          $('#' + split[1]).addClass("list-hide");
        });
      });

      //var distance = $('input[name=distance]:checked', '#radio-form').val();
      //console.log($('#' + split[1] + ' > .distance').html());

      // show current markers
      cluster = markerCluster.getMarkers();
      cluster.forEach(function(nextMarker){
        var split = nextMarker.title.split("||");
        //if(distance != null && )
        $('#' + split[1]).removeClass("list-hide");
      });

      document.getElementById('results-count').innerHTML = cluster.length;
    }

    function refreshMarkers() {
      var checkedCategories = [];
      var allFilters = $("input[name=category-filter]");

      // Get all checked categories.
      allFilters.each(function (i) {
        var nextFilter = allFilters[i];
        if (nextFilter.checked) {
          checkedCategories.push(nextFilter.value);
        }
      });

      // Hide all markers, then show only the ones that are in checked people type categories.
      Object.keys(markers).forEach(function(nextCategory) {
        hideMarkers(nextCategory);
        if (checkedCategories.indexOf(nextCategory) !== -1) {
          showMarkers(nextCategory);
        }
      });

      updateList();
       
    }

    function sendGAEvent(eventLabel, eventValue) {
      ga('send', 'event', 'feature', 'FEATS map: all', eventLabel, eventValue);
    }

    (function() {
      google.maps.visualRefresh = true;

      var isMobile = (navigator.userAgent.toLowerCase().indexOf('android') > -1) ||
        (navigator.userAgent.match(/(iPod|iPhone|iPad|BlackBerry|Windows Phone|iemobile)/));

      if (isMobile) {
        var viewport = document.querySelector("meta[name=viewport]");
        viewport.setAttribute('content', 'initial-scale=1.0, user-scalable=no');
      }

      var mapDiv = document.getElementById('googft-mapCanvas');

      map = new google.maps.Map(mapDiv, {
        center: new google.maps.LatLng(44.4678717, -79.4438273),
        zoom: 8,
        mapTypeControlOptions: {
          mapTypeIds: []
        },
        minZoom: 4,
      });

      
      // Init styled map skin.
      initStyledMap(map);

      // Get users geolocation and zoom in the map.
      initGeolocation(map);

      // Places legend inside map and binds event listeners to category filters.
      initLegend(map, isMobile);

      // Adds search functionality.
      initSearch(map);

      // Show pins on map.
      initMarkers(map);
    
    }());
  };
}(jQuery));
