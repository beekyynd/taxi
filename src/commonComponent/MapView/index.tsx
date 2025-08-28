import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import firestore from '@react-native-firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { appColors } from '@src/themes';
import darkMapStyle from '@src/screens/darkMapStyle';
import { useValues } from '@App';

export function Map({ userLocation, driverId, markerImage }) {
  // --- State Management ---
  const [driverLocation, setDriverLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [rotation, setRotation] = useState(0);
  const [markerIconDataUri, setMarkerIconDataUri] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const webviewRef = useRef(null);
  const lastPosition = useRef(null);
  const { isDark, Google_Map_Key } = useValues();

  const parseCoordinate = (coordinate) => ({
    latitude: parseFloat(coordinate.lat),
    longitude: parseFloat(coordinate.lng),
  });

  // --- Preload SVG Icon ---
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      setIsMapReady(false);
      setDriverLocation(null);
      setRouteCoordinates([]);
      setMarkerIconDataUri(null);
      lastPosition.current = null;
      let isActive = true;

      // Fetch vehicle image
      if (markerImage) {
        fetch(markerImage)
          .then(res => res.text())
          .then(svgContent => {
            if (isActive) {
              const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
              setMarkerIconDataUri(dataUri);
            }
          })
          .catch(error => console.error("Error fetching vehicle image:", error));
      }

      // Firestore listener for driver location
      let firestoreUnsubscribe = null;
      if (driverId) {
        firestoreUnsubscribe = firestore()
          .collection('driverTrack')
          .doc(driverId.toString())
          .onSnapshot(
            (doc) => {
              if (doc.exists && isActive) {
                const { lat, lng } = doc.data();
                const newLocation = { latitude: parseFloat(lat), longitude: parseFloat(lng) };

                if (lastPosition.current && routeCoordinates.length > 1) {
                  const distance = getDistance(lastPosition.current, newLocation);
                  if (distance < 3) return; // Ignore small movements
                  const angle = calculateRoadBearing(newLocation, routeCoordinates);
                  if (!isNaN(angle)) {
                    setRotation(angle);
                  }
                } else if (lastPosition.current && userLocation) {
                  // Fallback to bearing from driver to user if no route
                  const angle = getBearing(lastPosition.current, parseCoordinate(userLocation));
                  if (!isNaN(angle)) {
                    setRotation(angle);
                  }
                }

                lastPosition.current = newLocation;
                setDriverLocation(newLocation);
              }
            },
            (error) => console.error('Firestore snapshot error:', error)
          );
      }

      return () => {
        isActive = false;
        if (firestoreUnsubscribe) firestoreUnsubscribe();
      };
    }, [driverId, markerImage])
  );

  // --- Fetch Route from Google Directions API ---
  useEffect(() => {
    if (!driverLocation || !userLocation) {
      setRouteCoordinates([]);
      return;
    }
    const now = Date.now();
    if (now - (lastPosition.current?.timestamp || 0) < 10000) return; // Throttle API calls
    lastPosition.current = { ...lastPosition.current, timestamp: now };

    const origin = driverLocation;
    const destination = parseCoordinate(userLocation);
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin?.latitude},${origin?.longitude}&destination=${destination?.latitude},${destination?.longitude}&key=${Google_Map_Key}`;

    fetch(directionsUrl)
      .then(res => res.json())
      .then(json => {
        if (json.status === 'OK' && json.routes.length > 0) {
          const points = decodePolyline(json.routes[0].overview_polyline.points);
          const validPoints = points.every(p => typeof p.latitude === 'number' && typeof p.longitude === 'number' && !isNaN(p.latitude) && !isNaN(p.longitude));
          if (validPoints) {
            setRouteCoordinates(points);
          } else {
            console.error('Invalid coordinates in route:', points);
            setRouteCoordinates([]);
          }
        } else {
          console.error('Directions API error:', json.status, json.error_message || 'No routes found');
          setRouteCoordinates([]);
        }
      })
      .catch(error => {
        console.error('Error fetching route:', error);
        setRouteCoordinates([]);
      });
  }, [driverLocation, userLocation, Google_Map_Key]);

  // --- New Function to Calculate Bearing Based on Road Direction ---
  const calculateRoadBearing = (currentLocation, routeCoords) => {
    if (!routeCoords || routeCoords.length < 2) return NaN;

    // Find the closest point on the route to the current location
    let closestPoint = null;
    let minDistance = Infinity;
    let nextPoint = null;

    for (let i = 0; i < routeCoords.length - 1; i++) {
      const point = routeCoords[i];
      const distance = getDistance(currentLocation, point);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
        nextPoint = routeCoords[i + 1]; // Get the next point for direction
      }
    }

    if (!closestPoint || !nextPoint) return NaN;

    // Calculate bearing from closest point to next point
    const toRad = deg => deg * Math.PI / 180;
    const toDeg = rad => rad * 180 / Math.PI;
    const lat1 = toRad(closestPoint.latitude);
    const lon1 = toRad(closestPoint.longitude);
    const lat2 = toRad(nextPoint.latitude);
    const lon2 = toRad(nextPoint.longitude);
    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
    return bearing;
  };

  // --- JavaScript Injection Effects ---
  useEffect(() => {
    if (isMapReady && driverLocation && webviewRef.current) {
      const script = `updateDriverLocation(${driverLocation.latitude}, ${driverLocation.longitude}, ${rotation});`;
      webviewRef.current.injectJavaScript(script);
    }
  }, [isMapReady, driverLocation, rotation]);

  useEffect(() => {
    if (isMapReady && markerIconDataUri && webviewRef.current) {
      const script = `updateDriverIcon('${markerIconDataUri}');`;
      webviewRef.current.injectJavaScript(script);
    }
  }, [isMapReady, markerIconDataUri]);

  useEffect(() => {
    if (isMapReady && userLocation && webviewRef.current) {
      const { latitude, longitude } = parseCoordinate(userLocation);
      const script = `updateUserLocation(${latitude}, ${longitude});`;
      webviewRef.current.injectJavaScript(script);
    }
  }, [isMapReady, userLocation]);

  useEffect(() => {
    if (isMapReady && driverLocation && userLocation && webviewRef.current) {
      const hasDetailedRoute = routeCoordinates.length > 0;
      const coords = hasDetailedRoute ? routeCoordinates : [driverLocation, parseCoordinate(userLocation)];
      const script = `
        if (typeof google !== 'undefined' && google.maps && google.maps.Polyline) {
          updateRoute(${JSON.stringify(coords)}, ${!hasDetailedRoute});
        } else {
          console.warn('Google Maps API not ready, retrying polyline update...');
          setTimeout(() => {
            if (typeof google !== 'undefined' && google.maps && google.maps.Polyline) {
              updateRoute(${JSON.stringify(coords)}, ${!hasDetailedRoute});
            } else {
              console.error('Google Maps API still not ready for polyline');
            }
          }, 500);
        }
      `;
      webviewRef.current.injectJavaScript(script);
    }
  }, [isMapReady, driverLocation, userLocation, routeCoordinates]);

  useEffect(() => {
    if (isMapReady && markerIconDataUri !== null) {
      setIsLoading(false);
    }
  }, [isMapReady, markerIconDataUri]);

  // --- Helper Functions ---
  const decodePolyline = (t) => {
    let p = [], i = 0, a = 0, n = 0;
    while (i < t.length) {
      let e, h = 0, r = 0;
      do { e = t.charCodeAt(i++) - 63, r |= (31 & e) << h, h += 5 } while (e >= 32);
      let o = 1 & r ? ~(r >> 1) : r >> 1;
      a += o, h = 0, r = 0;
      do { e = t.charCodeAt(i++) - 63, r |= (31 & e) << h, h += 5 } while (e >= 32);
      let u = 1 & r ? ~(r >> 1) : r >> 1;
      n += u, p.push({ latitude: a / 1e5, longitude: n / 1e5 });
    }
    return p;
  };

  const getBearing = (t, e) => {
    const o = t => t * Math.PI / 180, a = t => 180 * t / Math.PI;
    const n = o(t.latitude), r = o(t.longitude), i = o(e.latitude), s = o(e.longitude);
    const c = s - r, h = Math.sin(c) * Math.cos(i);
    const l = Math.cos(n) * Math.sin(i) - Math.sin(n) * Math.cos(i) * Math.cos(c);
    return (a(Math.atan2(h, l)) + 360) % 360;
  };

  const getDistance = (t, e) => {
    const o = 6371e3, a = (e.latitude - t.latitude) * Math.PI / 180, n = (e.longitude - t.longitude) * Math.PI / 180;
    const r = t.latitude * Math.PI / 180, i = e.latitude * Math.PI / 180;
    const s = Math.sin(a / 2) * Math.sin(a / 2) + Math.sin(n / 2) * Math.sin(n / 2) * Math.cos(r) * Math.cos(i);
    const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    return o * c;
  };

  // --- Memoized mapHtml ---
  const mapHtml = useMemo(() => {
    const initialLat = userLocation ? parseCoordinate(userLocation).latitude : 37.78825;
    const initialLng = userLocation ? parseCoordinate(userLocation).longitude : -122.4324;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Map</title>
          <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
          <style>
            html, body, #map { height: 100%; margin: 0; padding: 0; background-color: #000; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            let map, driverMarker, userMarker, routePath;
            let driverMarkerIconUrl = null;
            const provisionalDash = [{ icon: { path: 'M 0,-1 l 0,1' }, strokeOpacity: 1, scale: 4 }];

            function initMap() {
              map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: ${initialLat}, lng: ${initialLng} },
                zoom: 16,
                styles: ${isDark ? JSON.stringify(darkMapStyle) : '[]'},
                disableDefaultUI: true
              });
              window.ReactNativeWebView.postMessage("map_loaded");
            }

            function updateDriverIcon(iconUrl) {
              driverMarkerIconUrl = iconUrl;
              if (driverMarker) {
                driverMarker.setIcon({
                  url: driverMarkerIconUrl,
                  anchor: new google.maps.Point(25, 25),
                  scaledSize: new google.maps.Size(50, 50),
                  rotation: driverMarker.getIcon()?.rotation || 0
                });
              }
            }

            function updateDriverLocation(lat, lng, rot) {
              const pos = new google.maps.LatLng(lat, lng);
              if (driverMarker) {
                driverMarker.setPosition(pos);
                if (driverMarkerIconUrl) {
                  driverMarker.setIcon({
                    url: driverMarkerIconUrl,
                    anchor: new google.maps.Point(25, 25),
                    scaledSize: new google.maps.Size(50, 50),
                    rotation: rot
                  });
                }
              } else {
                driverMarker = new google.maps.Marker({
                  position: pos,
                  map: map,
                  icon: driverMarkerIconUrl ? {
                    url: driverMarkerIconUrl,
                    anchor: new google.maps.Point(25, 25),
                    scaledSize: new google.maps.Size(50, 50),
                    rotation: rot
                  } : null
                });
              }
              map.panTo(pos);
            }

            function updateUserLocation(lat, lng) {
              const pos = new google.maps.LatLng(lat, lng);
              if (!userMarker) {
                userMarker = new google.maps.Marker({
                  position: pos,
                  map: map,
                  title: 'Destination'
                });
              } else {
                userMarker.setPosition(pos);
              }
            }

            function updateRoute(coords, isProvisional) {
              if (!coords || coords.length < 2) {
                console.error('Invalid coordinates for polyline:', coords);
                if (routePath) {
                  routePath.setMap(null);
                  routePath = null;
                }
                return;
              }
              const path = coords.map(c => {
                if (c.latitude == null || c.longitude == null || isNaN(c.latitude) || isNaN(c.longitude)) {
                  console.error('Invalid coordinate:', c);
                  return null;
                }
                return { lat: c.latitude, lng: c.longitude };
              }).filter(c => c != null);
              if (path.length < 2) {
                console.error('Not enough valid points for polyline:', path);
                if (routePath) {
                  routePath.setMap(null);
                  routePath = null;
                }
                return;
              }
              const tryUpdatePolyline = () => {
                if (typeof google !== 'undefined' && google.maps && google.maps.Polyline) {
                  if (routePath) {
                    routePath.setPath(path);
                    routePath.setOptions({
                      strokeOpacity: isProvisional ? 0 : 0.8,
                      icons: isProvisional ? provisionalDash : null
                    });
                  } else {
                    routePath = new google.maps.Polyline({
                      path: path,
                      geodesic: true,
                      strokeColor: '#199675', // Hardcoded for visibility
                      strokeOpacity: isProvisional ? 0 : 0.8,
                      strokeWeight: 4,
                      icons: isProvisional ? provisionalDash : null,
                      map: map
                    });
                  }
                } else {
                  console.warn('Google Maps API not ready, retrying polyline update...');
                  setTimeout(tryUpdatePolyline, 500);
                }
              };
              tryUpdatePolyline();
            }
          </script>
          <script async defer src="https://maps.googleapis.com/maps/api/js?key=${Google_Map_Key}&callback=initMap"></script>
        </body>
      </html>
    `;
  }, [isDark, Google_Map_Key, userLocation]);

  const onMessage = (event) => {
    if (event.nativeEvent.data === "map_loaded") {
      setIsMapReady(true);
      // Delay initial injections to ensure map stability
      setTimeout(() => {
        if (userLocation && webviewRef.current) {
          const { latitude, longitude } = parseCoordinate(userLocation);
          const script = `
            updateUserLocation(${latitude}, ${longitude});
          `;
          webviewRef.current.injectJavaScript(script);
        }
        if (driverLocation && webviewRef.current) {
          const { latitude, longitude } = driverLocation;
          const script = `
            updateDriverLocation(${latitude}, ${longitude}, ${rotation});
          `;
          webviewRef.current.injectJavaScript(script);
        }
        if (driverLocation && userLocation && webviewRef.current) {
          const coords = routeCoordinates.length > 0 ? routeCoordinates : [driverLocation, parseCoordinate(userLocation)];
          const script = `
            if (typeof google !== 'undefined' && google.maps && google.maps.Polyline) {
              updateRoute(${JSON.stringify(coords)}, ${routeCoordinates.length === 0});
            }
          `;
          webviewRef.current.injectJavaScript(script);
        }
      }, 2000); // 2-second delay for map stability
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        javaScriptEnabled={true}
        onMessage={onMessage}
        startInLoadingState={true}
        renderLoading={() => <ActivityIndicator style={styles.loadingIndicator} size="large" color={appColors.primary} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loadingIndicator: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});