# External Navigator Support

RoadMuse supports multiple external navigators in MVP. It should never claim that external apps will preserve the exact Valhalla route shape unless the output is GPX or the external app explicitly supports the needed behavior.

## Providers

| Provider | Best Use | MVP Support |
|---|---|---|
| Google Maps | Mainstream default, limited waypoint handoff | Directions URL with destination, waypoints, travel mode, avoid tolls/highways/ferries |
| Waze | Live driving traffic and driver alerts | Deep link destination/search, avoid options, vehicle type where supported |
| Apple Maps | iOS native handoff | Destination directions with mode |
| HERE WeGo | Many waypoints | Share/guidance route links with slash-separated waypoints |
| Organic Maps | Offline/privacy multi-stop links | v2 direction/navigation URLs with waypoints |
| GPX Export | Exact route fallback | Download GPX from Valhalla route shape |

## Provider Warnings

- Waze is best for destination handoff and traffic; it may not preserve route-shaping waypoints.
- Apple Maps links are best for destination and mode, not complex Valhalla route shaping.
- Google Maps supports waypoints, but mobile waypoint limits apply.
- HERE WeGo and Organic Maps are better for multi-waypoint handoff.
- GPX export is the safest option when route shape matters.

## Provider Recommendation Rules

| Route Complexity | Recommended Provider |
|---|---|
| Simple destination | User’s preferred provider |
| Avoid tolls/highways/ferries | Google Maps or Waze |
| One to three waypoints | Google Maps |
| More than three waypoints | HERE WeGo or Organic Maps |
| Exact Valhalla geometry desired | GPX export |
| Traffic-first driving | Waze |
| Privacy/offline preference | Organic Maps or GPX |
