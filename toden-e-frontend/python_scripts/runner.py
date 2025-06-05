# python_scripts/runner.py
import sys
import json
import os

# ... (sys.path modifications and toden_e import as before) ...
current_script_dir = os.path.dirname(os.path.abspath(__file__))
if current_script_dir not in sys.path:
    sys.path.append(current_script_dir)

packages_dir = os.path.join(current_script_dir, ".packages")
if packages_dir not in sys.path:
    sys.path.insert(0, packages_dir)

try:
    import toden_e
except ImportError as e:
    print(json.dumps({"error": f"Failed to import toden_e: {str(e)}", "type": "ImportError"}))
    sys.exit(1)


def main():
    error_response_template = {"error": "An unknown error occurred in runner.py", "type": "PythonRunnerError"}
    try:
        # Expecting 5 arguments now: script_name, path, alpha, clusters, result_id, base_tmp_path
        if len(sys.argv) != 6: # Script name + 5 arguments
            error_response_template["error"] = (
                f"Incorrect number of arguments. Expected 5 (pags_txt_path, alpha, clusters, result_id, base_tmp_path), "
                f"got {len(sys.argv) - 1}."
            )
            error_response_template["type"] = "ArgumentError"
            print(json.dumps(error_response_template))
            sys.exit(1)

        pags_txt_path_arg = sys.argv[1]
        alpha_str_arg = sys.argv[2]
        clusters_str_arg = sys.argv[3]
        result_id_arg = sys.argv[4]
        base_tmp_path_arg = sys.argv[5] # New argument: base path for temp files

        # ... (alpha and clusters validation as before) ...
        try:
            alpha_float_val = float(alpha_str_arg)
        except ValueError: # ... (error handling) ...
            error_response_template["error"] = f"Invalid alpha value: '{alpha_str_arg}'. Must be a convertible to float."
            print(json.dumps(error_response_template))
            sys.exit(1)

        try:
            num_clusters_int_val = int(clusters_str_arg)
        except ValueError: # ... (error handling) ...
            error_response_template["error"] = f"Invalid clusters value: '{clusters_str_arg}'. Must be convertible to an integer."
            print(json.dumps(error_response_template))
            sys.exit(1)


        # Call the prediction function, now passing result_id and base_tmp_path
        prediction_output = toden_e.toden_e_predict(
            pags_txt_path=pags_txt_path_arg,
            alpha=alpha_float_val,
            num_clusters=num_clusters_int_val,
            result_id=result_id_arg,
            base_tmp_path=base_tmp_path_arg # Pass the base temp path
        )

        success_response = {"result": prediction_output}
        print(json.dumps(success_response))

    except Exception as e:
        # ... (error handling as before) ...
        error_type = e.__class__.__name__
        error_response_template["error"] = str(e)
        error_response_template["type"] = error_type
        print(json.dumps(error_response_template))
        sys.exit(1)


if __name__ == "__main__":
    main()