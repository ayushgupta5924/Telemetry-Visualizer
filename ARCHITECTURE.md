# LILA Player Journey Visualization Tool - Architecture

## Tech Stack & Rationale
* **Backend:** Python + FastAPI + PyArrow/Pandas
  * *Why:* Python is the industry standard for data manipulation. Instead of processing the raw Parquet files on every client request, the FastAPI server ingests and decodes all ~89,000 events into an in-memory Pandas DataFrame on startup. This allows for lightning-fast, zero-latency filtering (by map, date, match) before serving the payload to the client.
* **Frontend:** React (Vite) + Deck.gl
  * *Why:* Standard DOM elements (like Leaflet or plain Canvas) choke when rendering tens of thousands of data points dynamically. Deck.gl is a hardware-accelerated WebGL framework that pushes the rendering and timeline filtering directly to the GPU, ensuring smooth 60 FPS playback during the match timeline scrub.

## Data Flow & Coordinate Mapping
1. **Ingestion:** FastAPI reads the Parquet files using PyArrow. Byte strings are decoded to UTF-8.
2. **Transformation (The Tricky Part):** The 3D world coordinates (`x`, `z`) are mapped to the 2D pixel space (1024x1024) on the server side to save client processing power. 
   * The formula used utilizes the provided map scale and origin:
     * `u = (x - origin_x) / scale`
     * `v = (z - origin_z) / scale`
     * `pixel_x = u * 1024`
     * `pixel_y = (1 - v) * 1024` (Y is flipped to match standard web image coordinates).
   * Note: The `y` coordinate in the dataset was discarded as it represents 3D elevation, which is irrelevant for a top-down minimap.
3. **Delivery:** The frontend fetches the pre-calculated JSON array and passes it directly to Deck.gl's `ScatterplotLayer` and `HeatmapLayer`.

## Major Trade-offs & Decisions
| Trade-off | Decision | Justification |
| :--- | :--- | :--- |
| **Server-Side vs Client-Side Math** | Server-Side | Pre-calculating `pixel_x` and `pixel_y` on the FastAPI backend increases memory usage slightly but drastically reduces CPU load on the React frontend, allowing for smoother animation. |
| **GPU vs CPU Timeline Filtering** | Hybrid | Deck.gl's `DataFilterExtension` pushes the timeline slider filtering to the GPU for the path rendering (extreme performance). However, due to a known WebGL shader quirk with flat Cartesian heatmaps, the heatmap data is CPU-filtered before rendering to ensure stability. |

## Assumptions
* Based on the `user_id` formatting, it was assumed that any purely numeric string indicated a Bot, while UUIDs indicated Human players. This boolean flag (`is_bot`) was attached at the ingestion layer.