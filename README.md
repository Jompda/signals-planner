# signals-planner
A "research" project for my own personal curiosities.

Here how the UI look like:
![UI-example](https://github.com/Jompda/signals-planner/blob/main/UI-example.jpg?raw=true)

# Installing, running, and building
- To install `npm install`. Note that link calculation requires binaries from `https://github.com/Jompda/itm-webassembly`. To get them you have to build the `itm-webassembly` project. Linking the files via npm can be done by running `npm link` in the `itm-webassemply`-folder and then running `npm link itm-webassembly` in the `signals-planner` directory. Note that any npm package updates reset the link so it must be redone every time.
- Before running, configure API keys in `options.js`:
```js
export default {
    mapboxToken: 'MAPBOX_TOKEN',
    MMLApiKey: 'MML_API_KEY'
}
```
- To run a local development server `npm run serve`.

# Technologies used
Comprehensive list can be found in the `package.json` file but the major ones are listed below:
- Webpack: Used to pack everything into a bundle
- Leaflet: Map framework
- leaflet-topography: Leaflet layers to illustrate topography
- Geoman: Leaflet extension to allow GeoJSON editing
- MilSymbol: NATO Military Symbology
- React: UI Framework
- NTIA ITM: Link calculation
