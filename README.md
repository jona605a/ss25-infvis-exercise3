# InfoVis UE - Exercise 3: Exploratory Analysis

Scaffold for building multiple coordinated views using d3 with a Python backend using Flask.

## Project setup using PyCharm:


1. Create new PyCharm project from this folder
2. Creating Virtual Environment:
Ctrl+Alt+S to open Settings
--> Project
--> Project Interpreter
--> select the gear symbol next to "Project Interpreter"
--> Add...
--> "Virtualenv Environment
--> New environment
--> OK
3. Install required packages:
open requirements.txt
--> click on "Install requirements" from bar on the top
Alternatively, you can install the requirements individually from the Project Interpreter menu (select "+")
4. Set Working Directory:
in order to load data on the server, you might need to set your Working Directory on PyCharm, otherwise you might get
the error "No such file or directory" when attemping to load data.
To do that, open Run
--> Edit Configurations...
set your Working Directory to the root directory (i.e. where "app.py" and the "static" folder are located)


## Files:

* app.py: Flask server
* templates/index.html: our single HTML page, including the main JavaScript code
* static/js/: folder where your JavaScript files should go
* static/data/: folder where your data should go
* static/styles/style.css: CSS styles

You may modify all files. You may (and actually should) add JavaScript files to static/js.



# Kanto Encounter Data: Access Guide

The `kanto_location_data.json` file contains Pokémon encounter data structured as:

```json
{
  "location-name": {
    "id": 1,
    "name": "location-name",
    "areas": [ ... ]
  },
  ...
}
```

## Top-Level Keys

| Key            | Type   | Description                                  |
|----------------|--------|----------------------------------------------|
| `id`           | int    | Location ID from the PokéAPI                 |
| `name`         | string | Name of the location                         |
| `areas`        | list   | All areas within this location               |

## Area Object Structure

Each `area` object inside `areas` has:

| Key                  | Type   | Description |
|----------------------|--------|-------------|
| `id`                 | int    | Area ID     |
| `name`               | string | Area name   |
| `encounter_methods`  | object | Encounter methods grouped by type: `walk`, `surf`, `fish` |
| `pokemon_encounters` | list   | List of encounterable Pokémon in this area |
| `available_conditions` | list | Encounter conditions (e.g. `time-night`, `rain`) |

## Encounter Method Format

```json
{
  "walk": [{ "version": "red", "rate": 60 }, ...],
  "surf": [{ "version": "blue", "rate": 30 }, ...],
  "fish": [
    {
      "rod": "old-rod",
      "versions": [{ "version": "red", "rate": 10 }]
    }
  ]
}
```

## Pokémon Encounter Format

```json
{
  "pokemon_id": 19,
  "pokemon_name": "rattata",
  "version": "red",
  "method": "walk",
  "chance": 45,
  "min_level": 2,
  "max_level": 4,
  "conditions": ["time-day"]
}
```

## Tips for Frontend Integration

- Use area names to highlight and query regions on the map.
- Filter Pokémon by encounter method, version, or condition.
- Link `pokemon_id` to stats from the Pokémon database.