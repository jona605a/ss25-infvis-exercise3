from flask import Flask, render_template
import pandas as pd
import os
import json
from flask import jsonify

app = Flask(__name__)

# ensure that we can reload when we change the HTML / JS for debugging
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True


@app.route('/')
def data():
    # read csv file
    path = os.path.join(app.root_path, 'data', 'data.csv')
    df = pd.read_csv(path)

    # convert to JSON
    data_json = json.dumps(df.to_dict(orient='records'))
    return render_template("index.html", data=data_json)


if __name__ == '__main__':
    app.run()
