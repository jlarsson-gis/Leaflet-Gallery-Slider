import os
import geojson
from PIL import Image
from PIL.ExifTags import TAGS
from geojson import Point, Feature, FeatureCollection, dump, dumps
import calendar

#
# Script to extract locations of photos from directory recursively and create a GeoJSON file from the output
# Input: Directory of photos
#
# Output: Two files: photos.geojson, and photos_geojson.js
#         The latter .js file can be dropped directly into a web directory/server and called with a <script> tag to import the photos geojson as a variable named "photopoints", and an array of the months as [index, month, year, human-readable], used by leafletSlider.js
# Author: jlarsson-gis (Github)
#

# Before running this script, change your working directory to the parent folder containing all images you wish to index in GeoJSON
# Otherwise, change directory_path to the **full disk location** of your images directory **with a trailing slash**. The default is './', which represents the current working directory.
# THIS SCRIPT WILL NOT INCLUDE FILES WITH EXTENSIONS OTHER THAN JPEG, JPG, or PNG!!





directory_path = './'
#directory_path = 'srv/http/images/'





# Function to list JPEG and PNG files in directory and all subdirectories. Path defaults to current directory.
def list_files_recursive(path='.'):
    files = [] # List of files which have been found. Initialize empty.

    # List directory at path
    for entry in os.listdir(path):
        full_path = os.path.join(path, entry) # Create full path for entry from directory and the entry name
        # If the entry is itself a directory, this function will recurse
        if os.path.isdir(full_path):
            subfolderfiles = list_files_recursive(full_path) # Run this function again in the subdirectory
            # For each entry in the subdirectory, append the item to the files array.
            for i in subfolderfiles:
                files.append(i)
        # If the entry is not a directory, detect if it is the desired format, and append it to the files list if it is.
        else:
            # If file is jpeg, jpg, or png, append it to the files list
            if(entry.split('.')[-1] in ("JPEG","JPG","jpg","jpeg","PNG","png")):
                files.append(full_path)
    return files # Return files list

# Function to convert from DMS (Used in EXIF data) to decimal degrees (Used for GeoJSON)
def decimal_coords(coords, ref):
    decimal_degrees = float(coords[0]) + float(coords[1]) / 60 + float(coords[2]) / 3600 # Equation to convert to decimal degrees
    if ref == "S" or ref =='W' : decimal_degrees = -1 * decimal_degrees # If S or W, make decimal degrees negative
    return decimal_degrees

# Function to reuse previous coordinate for gallery item i, or prompt for new coordinate
# Parameter "kind" can be either "g" for GPS tag or "m" for Month from DateTime tag
def use_existing_or_prompt(existing_features, i, kind="g"):

    #Filter full list of existing features by the path of file i
    def filter_features_by_name(x):
        return x["properties"]["name"] == i

    try:
        match = list(filter(filter_features_by_name, existing_features["features"]))
    except (NameError, KeyError):
        match = []
    if kind == "g":
        try:
            prevCoords = match[0]["geometry"]["coordinates"]
        except (KeyError, IndexError):
            match = []
        if len(match) == 1 and prevCoords != [0,0]:
            prevCoords = match[0]["geometry"]["coordinates"]
            point = Point((prevCoords[0], prevCoords[1]))
        else:
            try:
                coords = str(input("Enter latitude,longitude:"))
                latitude = float(coords.split(',')[1])
                longitude = float(coords.split(',')[0])
                point = Point((latitude, longitude))
            except (IndexError,ValueError):
                point = Point((0, 0))
        return point
    if kind == "m":
        try:
            prevMonth = match[0]["properties"]["month"]
        except (KeyError, IndexError):
            match = []
        if len(match) == 1 and prevMonth != [1,1900]:
            month = [prevMonth[0], prevMonth[1]]
        else:
            try:
                coords = str(input("Enter month in format month/year: (default: 1/1900 representing Jan 1900) "))
                month = int(coords.split('/')[0])
                year = int(coords.split('/')[1])
                month = [month, year]
            except (IndexError,ValueError):
                month = [1,1900]
        return month


directory_path = directory_path.rstrip('/').rstrip('\\') + "/"
try:
    with open(directory_path + 'photos.geojson') as f:
        existing_features = geojson.load(f)
except FileNotFoundError:
    existing_features = {}
    print("Existing geojson not found")

features = []
monthsrange = [[12,2999],[1,1800]]

for i in list_files_recursive(directory_path):
    print(i)
    img = Image.open(i)
    exif_data = img.getexif()
    GPSINFO_TAG = next(tag for tag, name in TAGS.items() if name == "GPSInfo")
    DATETIME_TAG = next(tag for tag, name in TAGS.items() if name == "DateTime")
    filename = i.replace(directory_path,'')
    gpsinfo = exif_data.get_ifd(GPSINFO_TAG)
    try:
        month = [int(exif_data[DATETIME_TAG].split(':')[1]),int(exif_data[DATETIME_TAG].split(':')[0])]
    except KeyError:
        month = use_existing_or_prompt(existing_features,filename,"m")
    
    if month[1] < monthsrange[0][1] or ( month[1] == monthsrange[0][1] and month[0] < monthsrange[0][0]):
            monthsrange[0] = month
    if month[1] > monthsrange[1][1] or ( month[1] == monthsrange[1][1] and month[0] > monthsrange[1][0]):
            monthsrange[1] = month
    
    if gpsinfo == {}:
        point = use_existing_or_prompt(existing_features, filename)
    else:
        try:
            point = Point((float(decimal_coords(gpsinfo[4], gpsinfo[3])),float(decimal_coords(gpsinfo[2], gpsinfo[1]))))
        except KeyError:
            point = use_existing_or_prompt(existing_features, filename)

    features.append(Feature(geometry=point, properties={
        "name": filename,
        "month": month
    }))

feature_collection = FeatureCollection(features)

months = []
i = monthsrange[0]
num = 0
while True:
  months.append([num, i[0], i[1], "%s %s" % (calendar.month_name[i[0]], i[1])])
  if i == monthsrange[1]:
    break
  num += 1
  i[0] += 1
  if i[0] > 12:
      i[0] = 1
      i[1] += 1


with open(directory_path + 'photos.geojson', 'w') as f:
    dump(feature_collection, f)

with open(directory_path + 'photos_geojson.js', 'w') as f:
    f.write("var photomonths = " + repr(months) + ";\n\n var photopoints = [" + dumps(feature_collection) + "]")