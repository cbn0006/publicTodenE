# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import toden_e
import csv
import io

app = Flask(__name__)
CORS(app)

@app.route('/predict', methods=['POST'])
def predict():
    # Get values from form data
    file_selection = request.form.get('file')
    file_upload = request.files.get('fileUpload')
    alpha = request.form.get('alpha')
    clusters = request.form.get('clusters')
    
    if file_selection:
        file_data = file_selection + ".txt"
    elif file_upload:
        file_data = file_upload
    else:
        return jsonify({'error': 'No file provided'}), 400

    try:
        print("Starting Prediction")
        result = toden_e.toden_e_predict(
            pags_txt_path=file_data,
            alpha=float(alpha),
            num_clusters=int(clusters),
        )
        print("Finished Prediction")
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'result': result})

@app.route('/visualize', methods=['POST'])
def visualize():
    file_selection = request.form.get('file')
    file_upload = request.files.get('fileUpload')
    if file_selection:
        # Use the file selection as a file path and append ".csv"
        file_path = file_selection + ".csv"
        try:
            with open(file_path, "r") as f:
                file_content = f.read()
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    elif file_upload:
        file_content = file_upload.read().decode("utf-8")
    else:
        return jsonify({'error': 'No file provided for visualization.'}), 400

    try:
        csv_reader = csv.reader(io.StringIO(file_content))
        rows = list(csv_reader)
        if len(rows) < 2:
            return jsonify({"error": "CSV file does not have the required rows"}), 400

        header = rows[0]
        data = rows[1]
        result = {
            "header": header,
            "algorithm": data[0],
            "clusters": data[1:],
        }
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'result': result})

@app.route('/summarize', methods=['POST'])
def summarize():
    file_selection = request.form.get('file')
    file_upload = request.files.get('fileUpload')
    if file_selection:
        # Use the file selection as a file path and append ".csv"
        file_data = file_selection + ".csv"
    elif file_upload:
        file_data = file_upload  # FileStorage object
    else:
        return jsonify({'error': 'No file provided for summarization.'}), 400

    try:
        print("Summarize Begin")
        result = toden_e.summarize_cluster_results(clustering_results_path=file_data)
        print("Summarize Complete")
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'result': result})

if __name__ == '__main__':
    app.run(debug=True)
