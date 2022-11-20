

/** // NOTE: EmissionLayer planning below:
 * Extend GridLayer:
 * To limit the covered area, the layer must take a bounds option.
 *   Use OSM:s slippy tiles function to get the covered tiles' coordinates at certain zoom level.
 * By default the layer draws an outline on the selected tiles.
 *   If emission data exists in the data structure then draw it.
 * Emission calculaton for the current zoom level is triggered with a function.
 *   After the calculation is finished, redraw the layer.
 * 
 * Emission calculation:
 * Create a huge raster from all covered tiles.
 * For each Link:
 *   For both endpoints (Units):
 *     Unit position can be acquired by using functions latlngToTilecoords and latlngToXYOnTile from tiledata.
 *     Get every possible ray by getting the line paths with Bresenham's line algorithm from Unit to raster edge pixel.
 *       I know it's only an approximation of the path since it doesn't take the geodesic path into account but the
 *       paths don't really differ that much at short ranges.
 *       It'd be too much for me to try to approximate the geodesic line path on a raster while covering every single pixel.
 *     If beam width is specified then filter out rays that are outside the beam.
 *       Take into account sidebeams / bad directivity?
 *       Simulate directivity by creating rays with varying strengths?
 *         Would be yet another field of science which I'm not familliar with.
 *     The ray length must be limited at max to radio horizon.
 *     Find a way to transform a tilepixel to LatLng.
 *       Maybe go create that function in the tiledata library?
 */

