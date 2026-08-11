from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from data_processor import load_all_data
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="LILA Player Journey API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data into memory when server starts
df = load_all_data()

@app.get("/")
def health_check():
    return {"status": "LILA Backend is live.", "total_events": len(df)}

@app.get("/api/filters")
def get_filters():
    """Returns unique maps, dates, and matches so the frontend can build dropdowns."""
    return {
        "maps": df['map_id'].dropna().unique().tolist(),
        "dates": df['date'].dropna().unique().tolist(),
        "matches": df['match_id'].dropna().unique().tolist()
    }

@app.get("/api/events")
def get_events(
    map_id: str = Query(None),
    date: str = Query(None),
    match_id: str = Query(None)
):
    """Filters the in-memory dataframe and returns the events."""
    filtered_df = df.copy()
    
    if map_id:
        filtered_df = filtered_df[filtered_df['map_id'] == map_id]
    if date:
        filtered_df = filtered_df[filtered_df['date'] == date]
    if match_id:
        filtered_df = filtered_df[filtered_df['match_id'] == match_id]
        
    # Sort by timestamp so the timeline playback works perfectly
    filtered_df = filtered_df.sort_values(by='ts')
        
    return filtered_df.to_dict(orient="records")
