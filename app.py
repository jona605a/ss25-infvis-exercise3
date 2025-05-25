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
    df.columns = df.columns.str.strip()  # ensure no leading/trailing spaces
    df = df.fillna("")
    return jsonify(df.to_dict(orient='records'))



if __name__ == '__main__':
    app.run()
