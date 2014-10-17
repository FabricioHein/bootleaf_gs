BootLeaf_gs
========

A feeble attempt to load arbitary GeoServer layers in a pretty interface for fast viewing. It's basically working though, which is nice.

Here's what you need to do to get it working for your GeoServer:
# ensure that you have a reverse proxy and cross origin (for nginx add add_header Access-Control-Allow-Origin *; to allow everywhere)
# set up a URL using GitHub.io like this: http://alexgleith.github.io/bootleaf_gs/?https://maps.gcc.tas.gov.au/geoserver/GCC_cc/ows

That's it!

It also supports adding initial layers, like this: http://alexgleith.github.io/bootleaf_gs/?https://maps.gcc.tas.gov.au/geoserver/GCC_cc/ows&layers=Stormwaterpipes with a comma separated list.

There are a bunch of configurable components, all at the top of app.js.


TODO
----
# Refactor some of the variables to be sources from the WMS GetCapabilities request.
# Find some nice way to handle basemaps that are customisable
# Ensure that the project is easy to copy!