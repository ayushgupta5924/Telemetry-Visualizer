import os
import pandas as pd
import pyarrow.parquet as pq
from glob import glob

MAP_CONFIG = {
    'AmbroseValley': {'scale': 900, 'origin_x': -370, 'origin_z': -473},
    'GrandRift': {'scale': 581, 'origin_x': -290, 'origin_z': -290},
    'Lockdown': {'scale': 1000, 'origin_x': -500, 'origin_z': -500}
}

# Global DataFrame to hold everything in memory for lightning-fast API responses
_GLOBAL_DF = None

def load_all_data(base_path="player_data"):
    """Loads all parquet files into a single Pandas DataFrame on startup."""
    global _GLOBAL_DF
    if _GLOBAL_DF is not None:
        return _GLOBAL_DF

    print("Loading all match data into memory. This might take a few seconds...")
    all_frames = []
    
    # Iterate through all date folders
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith('.nakama-0'):
                file_path = os.path.join(root, file)
                try:
                    # Parse the date from the folder name (e.g., "February_10")
                    date_folder = os.path.basename(root)
                    
                    table = pq.read_table(file_path)
                    df = table.to_pandas()
                    df['event'] = df['event'].apply(lambda x: x.decode('utf-8') if isinstance(x, bytes) else x)
                    df['is_bot'] = df['user_id'].apply(lambda x: str(x).isnumeric())
                    df['date'] = date_folder
                    
                    all_frames.append(df)
                except Exception as e:
                    print(f"Failed reading {file}: {e}")

    if not all_frames:
        return pd.DataFrame()

    master_df = pd.concat(all_frames, ignore_index=True)

    # Vectorized coordinate mapping for maximum speed
    def map_x(row):
        config = MAP_CONFIG.get(row['map_id'])
        if not config: return None
        return ((row['x'] - config['origin_x']) / config['scale']) * 1024

    def map_y(row):
        config = MAP_CONFIG.get(row['map_id'])
        if not config: return None
        return (1 - ((row['z'] - config['origin_z']) / config['scale'])) * 1024

    master_df['pixel_x'] = master_df.apply(map_x, axis=1)
    master_df['pixel_y'] = master_df.apply(map_y, axis=1)
    
    # Drop rows where map matching failed
    _GLOBAL_DF = master_df.dropna(subset=['pixel_x', 'pixel_y'])
    print(f"Successfully loaded {_GLOBAL_DF.shape[0]} events!")
    return _GLOBAL_DF