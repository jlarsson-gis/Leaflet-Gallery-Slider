# Leaflet-Gallery-Slider

Use an HTML slider to control a leaflet map containing a gallery of pictures from specific defined locations.

A live demo is available on https://jlarss.me as part of my visual resume/portfolio website.

![Screenshot_20250529_100926](https://github.com/user-attachments/assets/da821b0f-3b59-4fc9-b6bf-e022cd9c86f2)

***Very early beta, may be extremely finnicky and/or buggy.***

## How to use:

### extractLocations.py

The first step is to get ready to run extractLocations.py. You will need python dependencies "pillow" and "geojson". If you use Pip, can install these with `pip install pillow geojson`.

Next, move extractLocations.py into the same folder which contains the images you wish to index. These may be stored in any manner of nested subdirectories you like. In a terminal, change your working directory to this chosen directory. On Mac, you could type `cd` followed by a space and then drag-and-drop the folder onto the terminal window. Then type "python3 extractLocations.py". Follow any prompts it asks of you.

This has now generated photos_geojson.js, which will be used in the next step. You may wish to inspect and edit it, I found it helpful to check photos.geojson in QGIS and then copy my edits over to photos_geojson.js. All of photos_geojson.js after `var photopoints =` is just verbatim copy-and-pasted from when the script generated photos.geojson.

### HTML and leafletSlider.js

Place the folder containing photos_geojson.js and your photos onto your webserver. A barebones implementation can be found in example.html, and if you place this in the same directory after you have run extractLocations.py you can see an immediate working copy.

Necessary elements include:

**Import Leaflet:**
```
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
```

**Import leafletSlider.css:**
```
<link rel="stylesheet" href="leafletSlider.css">
```

Any additional modifications to your CSS must go AFTER this stylesheet.

**leafletSliderContainer:**
```
<div id="leafletSliderContainer">
    <h4 id="MonthDate">All Months</h4>
    <span id="Stage"><br></span>
    <br>
    <input type="range" class="slider" id="progress" oninput="chooseDate()" onchange="chooseDate()">
    <span id="years"><div>Not initialized</div></span>
    <br>
    <span id="event"></span>
    <div id="map"></div>
</div>
```

All elements must be present in this order! Just copy and paste this verbatim into your web page at the location you want to put the Leaflet map gallery+slider

**photos_geojson.js and leafletSlider.js:**
```
<script type="text/javascript" src="photos_geojson.js"></script>
<script src="leafletSlider.js"></script>
```

These must go at the end of your HTML file, immediately before </body>.

It is highly recommended to change the imageBaseHref and events variables. Examples are given in example.html.

### Final Steps

After completing all of these steps, I found that my iamges were excessively large, so I had to resize them to make them able to load more quickly over the network. I also cleared all of the EXIF metadata from my image files.

## TODO:
* Finish commenting code
* Use Javascript to set up elements inside leafletSliderContainer to make the HTML document cleaner and reduce possibility for any of the elements to be forgotten
* Improve mobile-friendliness and overall user-friendliness where needed; It works as intended on mobile platforms already, but I want to look into ways to further improve the mobile experience with the widget
