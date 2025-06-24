import sys
import json
import os
from vercel_blob import put

# --- Setup sys.path as before ---
current_script_dir = os.path.dirname(os.path.abspath(__file__))
if current_script_dir not in sys.path:
    sys.path.append(current_script_dir)

packages_dir = os.path.join(current_script_dir, ".packages")
if packages_dir not in sys.path:
    sys.path.insert(0, packages_dir)

try:
    import toden_e
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Failed to import toden_e: {str(e)}"}))
    sys.exit(1)

def main():
    try:
        # We now expect 4 arguments: script_name, path, alpha, clusters, result_id
        if len(sys.argv) != 5:
            raise ValueError(f"Incorrect number of arguments. Expected 4, got {len(sys.argv) - 1}.")

        pags_txt_path_arg = sys.argv[1]
        alpha_str_arg = sys.argv[2]
        clusters_str_arg = sys.argv[3]
        result_id_arg = sys.argv[4]

        alpha_float_val = float(alpha_str_arg)
        num_clusters_int_val = int(clusters_str_arg)

        # IMPORTANT: Your toden_e_predict function must now return the file contents
        # in memory, for example, as a dictionary of CSV strings.
        # It should NOT write files to disk anymore.
        prediction_output = toden_e.toden_e_predict(
            pags_txt_path=pags_txt_path_arg,
            alpha=alpha_float_val,
            num_clusters=num_clusters_int_val
        )

        # The prediction_output should look something like this:
        # {
        #   "adj_matrix_csv": "...",
        #   "con_matrix_csv": "...",
        #   "clusters_csv": "...",
        #   "other_results": {...}
        # }
        
        # --- Upload files directly to Vercel Blob ---
        # The BLOB_READ_WRITE_TOKEN must be available as an environment variable.
        
        # Path prefix for all files related to this job
        blob_path_prefix = f"predictions/{result_id_arg}"

        # Upload adjacency matrix
        if 'adj_matrix_csv' in prediction_output:
            put(f"{blob_path_prefix}/adj_matrix.csv", prediction_output['adj_matrix_csv'], add_random_suffix=False)
        
        # Upload connectivity matrix
        if 'con_matrix_csv' in prediction_output:
            put(f"{blob_path_prefix}/con_matrix.csv", prediction_output['con_matrix_csv'], add_random_suffix=False)

        # Upload clusters file
        if 'clusters_csv' in prediction_output:
            put(f"{blob_path_prefix}/clusters.csv", prediction_output['clusters_csv'], add_random_suffix=False)

        # The final JSON printed to stdout should be simple.
        # The Node.js process only needs to know if it succeeded.
        print(json.dumps({"success": True}))

    except Exception as e:
        error_type = e.__class__.__name__
        error_message = str(e)
        print(json.dumps({"success": False, "error": error_message, "type": error_type}))
        sys.exit(1)

if __name__ == "__main__":
    main()