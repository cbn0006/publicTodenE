import os
import csv
import io
import psycopg2
from dotenv import load_dotenv

# --- LOAD ENVIRONMENT VARIABLES ---
# This is the corrected line, providing the relative path to the .env file.
load_dotenv(dotenv_path='toden-e-frontend/.env.development.local')

# --- CONFIGURE THIS SECTION ---

# This list is still needed to find the cluster files
DATASET_FILES = [
    'Leukemia_2_0.5', 'Leukemia_3_0.25', 'Leukemia_3_0.5',
    'Leukemia_4_0.25', 'Leukemia_4_0.5', 'Leukemia_5_0.25', 'Leukemia_5_0.5',
]

# Get the connection string from the environment variables
NEON_CONNECTION_STRING = os.getenv("POSTGRES_URL")

# The path to your data folder remains the same
DATA_FOLDER_PATH = '/Users/codybnic/Development/publicTodenE/toden-e-frontend/go_metadata/data'

# --- END CONFIGURATION ---


def ingest_data():
    # Check if the connection string was found
    if not NEON_CONNECTION_STRING:
        print("ERROR: POSTGRES_URL not found. Please ensure the path to your .env file is correct.")
        return

    conn = None
    try:
        print("Connecting to the Neon database...")
        conn = psycopg2.connect(NEON_CONNECTION_STRING)
        cur = conn.cursor()

        # print("Clearing old data from tables...")
        # cur.execute("TRUNCATE TABLE dataset_clusters, dataset_similarities RESTART IDENTITY;")

        # --- Part 1: Process all the unique CLUSTER files ---
        for dataset_name in DATASET_FILES:
            print(f"\n--- Processing Cluster File for: {dataset_name} ---")
            cluster_file_path = os.path.join(DATA_FOLDER_PATH, f'{dataset_name}.csv')
            
            with open(cluster_file_path, 'r') as f:
                reader = csv.reader(f)
                header = next(reader)
                for row in reader:
                    algorithm_name = row[0]
                    for i, go_id_string in enumerate(row[1:]):
                        cluster_id = i
                        go_ids = [go_id.strip() for go_id in go_id_string.split(',') if go_id.strip()]
                        
                        cur.execute(
                            "INSERT INTO dataset_clusters (dataset_name, algorithm_name, cluster_id, go_ids) VALUES (%s, %s, %s, %s)",
                            (dataset_name, algorithm_name, cluster_id, go_ids)
                        )
            print(f"  Finished inserting cluster data for {dataset_name}.")

        # --- Part 2: Process the SHARED SIMILARITY data only ONCE ---
        print("\n--- Processing Shared Similarity Data for 'Leukemia' ---")
        
        # similarity_source_file = 'Leukemia_2_0.5Data.csv'
        # similarity_file_path = os.path.join(DATA_FOLDER_PATH, similarity_source_file)
        # print(f"Reading and preparing similarity file: {similarity_file_path}")

        # string_buffer = io.StringIO()
        
        # with open(similarity_file_path, 'r') as f:
        #     reader = csv.reader(f)
        #     next(reader)
        #     for row in reader:
        #         gs_a_id, gs_b_id, similarity = row
        #         string_buffer.write(f"{gs_a_id},{gs_b_id},{similarity},Leukemia\n")
        
        # string_buffer.seek(0)
        
        # print("  Bulk inserting 'Leukemia' similarity data...")
        # cur.copy_from(
        #     file=string_buffer,
        #     table='dataset_similarities',
        #     sep=',',
        #     columns=('gs_a_id', 'gs_b_id', 'similarity', 'dataset_name')
        # )

        conn.commit()
        print("\nData ingestion successful!")

    except Exception as e:
        print(f"\nAn error occurred: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
            print("Database connection closed.")


if __name__ == "__main__":
    ingest_data()