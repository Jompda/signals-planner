# signals-planner
A "research" project for my own personal curiosities.

# Installing, running, and building
- To install `npm install`. Note that link calculation requires binaries from `https://github.com/Jompda/itm-webassembly`. To get them you have to build the `itm-webassembly` project. Linking the files via npm can be done by running `npm link` in the `itm-webassemply`-folder and then running `npm link itm-webassembly` in the `signals-planner` directory. Note that any npm package updates reset the link so it must be redone every time.
- To run a local development server `npm run serve`.
- To build for production `npm run build`. Currently just a placeholder script in the `package.json` file.

# Technologies used
Comprehensive list can be found in the `package.json` file but the major ones are listed below:
- Webpack: Used to pack everything into a bundle
- Leaflet: Map framework
- leaflet-topography: Leaflet layers to illustrate topography
- Geoman: Leaflet extension to allow GeoJSON editing
- MilSymbol: NATO Military Symbology
- React: UI Framework
- NTIA ITM: Link calculation
