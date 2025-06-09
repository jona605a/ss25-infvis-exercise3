from flask import Flask, render_template, jsonify
import pandas as pd
import os
import json
from collections import defaultdict

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
    # Print the highest stat value for any pokemon
    df['highest_stat'] = df[['hp', 'attack', 'defense', 'sp_attack', 'sp_defense', 'speed']].max(axis=1)
    # Print highest stat
    print("Highest stat value for any pokemon:", df['highest_stat'].max())
    # Print the highest stat for generation 1 and the name of the pokemon
    gen1_df = df[df['generation'] == 1]
    highest_stat_gen1 = gen1_df['highest_stat'].max()
    highest_stat_pokemon_gen1 = gen1_df[gen1_df['highest_stat'] == highest_stat_gen1]['name'].values[0]
    print(f"Highest stat for generation 1: {highest_stat_gen1} ({highest_stat_pokemon_gen1})")
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

@app.route('/bucket-encounters/<pokemon_name>/<location_name>/<version>')
def bucket_encounters(pokemon_name, location_name, version):
    LEVEL_TIERS = [
        (2, 10, "early"),
        (11, 20, "mid"),
        (21, 30, "mid-late"),
        (31, 50, "late"),
        (51, 70, "end-post")
    ]
    
    def assign_level_tier(min_level, max_level):
        for min, max, label in LEVEL_TIERS:
            if min_level <= min and max_level <= max:
                return label
            return "other"
        
    with open("static/kanto_pokemon_data.json") as f:
        data = json.load(f)
    
    # create dict structure
    buckets = defaultdict(lambda: defaultdict(lambda: defaultdict(float)))
    
    # group & aggregate
    for pokemon in data:
        if pokemon_name and pokemon["name"] != pokemon_name:
            continue
        
        for entry in pokemon.get("encounters", []):
            if location_name and entry["location"] != location_name:
                continue
            
            if version and entry["version"] != version:
                continue
            
            tier = assign_level_tier(entry["min_level"], entry["max_level"])
            area = entry["area"]
            method = entry["method"]
            buckets[area][tier][method] += entry["chance"]
 
    # flatten
    result = []
    for area, tier_data in buckets.items():
        for tier_label, methods in tier_data.items():
            for method, chance_sum in methods.items():
                result.append({
                    "area": area,
                    "level_tier": tier_label,
                    "method": method,
                    "chance": chance_sum
                })
    
    return jsonify(result)


if __name__ == '__main__':
    app.run()

