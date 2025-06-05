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

@app.route("api/pokemon/<int:pokemon_id>")
def pokemon(pokemon_id):
    # read json file
    with open("static/kanto_pokemon_data.json") as f:
        data = json.load(f)
    
    # get pokemon that matches id ; if no match return empty
    pokemon = next((p for p in data if p["id"] == pokemon_id), None)
    return jsonify(pokemon or {})


if __name__ == '__main__':
    app.run()
