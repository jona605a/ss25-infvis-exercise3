from flask import Flask, render_template, jsonify
import pandas as pd
import os
import json


app = Flask(__name__)

# ensure that we can reload when we change the HTML / JS for debugging
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True


@app.route('/')
def index():
    return render_template("index.html")


@app.route('/pokemon-data')
def pokemon_data():
    path = os.path.join(app.root_path, 'data', 'pokemon.csv')
    df = pd.read_csv(path)
    df.columns = df.columns.str.strip()
    df = df.fillna("")
    return jsonify(df.to_dict(orient='records'))

@app.route('/pokemon-api-data')
def merged_pokemon_data():
    with open("static/kanto_pokemon_data.json") as f:
        return jsonify(json.load(f))

@app.route('/pokemon-types')
def pokemon_types():
    # Read the pokemon.csv file, count the occurrences of each type, and return the counts as JSON
    path = os.path.join(app.root_path, 'data', 'pokemon.csv')
    df = pd.read_csv(path)
    df.columns = df.columns.str.strip()
    type_counts = df['type1'].value_counts().to_dict()
    for type, count in df['type2'].value_counts().to_dict().items():
        if type in type_counts:
            type_counts[type] += count
        else:
            type_counts[type] = count
    type_counts = {k.capitalize(): v for k, v in type_counts.items()}
    return jsonify(type_counts)

@app.route("/api/pokemon/<int:pokemon_id>")
def pokemon(pokemon_id, merged=True):
    # read json file
    with open("static/kanto_pokemon_data.json") as f:
        data = json.load(f)
    
    # get pokemon that matches id ; if no match return empty
    pokemon = next((p for p in data if p["id"] == pokemon_id), None)
    return jsonify(pokemon or {})
       

# returns a json file with landmark areas merged to their respective city or route areas
@app.route('/merged-kanto-locations')
def merged_locations():
    landmark_mapping = {
        "cerulean-cave": "cerulean-city",
        "pokemon-tower": "lavender-town",
        "safari-zone": "fuchsia-city",
        "pokemon-mansion": "cinnabar-island",
        "silph-co": "saffron-city",
        "power-plant": "kanto-route-10",
        "digletts-cave": "kanto-route-2",
        "mt-moon": "kanto-route-3",
        "rock-tunnel": "kanto-route-9",
        "victory-road": "kanto-route-23",
        "seafoam-islands": "kanto-sea-route-19",
        "ss-anne": "vermilion-city"
    }
    
    # load location data
    with open("static/kanto_location_data.json") as f:
        locations = json.load(f)
        
    # build dictionary
    location_dict = {loc["name"]: loc for loc in locations}
    
    # merge landmark areas to parent
    for landmark_name, parent_name in landmark_mapping.items():
        if landmark_name in location_dict and parent_name in location_dict:
            landmark_areas = location_dict[landmark_name].get('areas', [])
            parent_areas = location_dict[parent_name].get('areas', [])
            
            parent_areas.extend(landmark_areas)
            location_dict[parent_name]['areas'] = parent_areas
            
    merged_data = list(location_dict.values())
    
    return jsonify(merged_data)


if __name__ == '__main__':
    app.run()
