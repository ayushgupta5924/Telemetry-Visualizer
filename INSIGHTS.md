# Level Design Insights: LILA BLACK

## Insight 1: The "Meat Grinder" Spawn Phenomenon 
* **Observation:** Using the "Combat" Heatmap overlay combined with the Timeline slider in the early minutes of a match, there are heavily concentrated, deep-red death zones clustered immediately around specific spawn perimeter areas.
* **Evidence:** The visual density of Black (Deaths) and Red (Kills) dots occurs within the first 60 seconds of the match timestamp before players have a chance to migrate inward.
* **Actionable Takeaway:** Level Designers should add more immediate hard cover or terrain elevation changes near these specific drop zones to prevent line-of-sight spawn sniping. This will positively affect the "Early Churn Rate" metric, keeping newer players engaged longer.

## Insight 2: High-Traffic Dead Zones
* **Observation:** By toggling the "Traffic" Heatmap, several highly detailed structures and buildings on the map show absolutely zero player footfall (no blue/grey movement paths), effectively making them "dead space."
* **Evidence:** The complete absence of Yellow (Loot) events in these specific structures compared to adjacent buildings.
* **Actionable Takeaway:** Players are economically driven. By shifting high-tier loot spawn nodes into these neglected buildings, Level Designers can organically redirect player flow. The metric to monitor here is "Map Utilization Percentage" and the distribution of loot events.

## Insight 3: Bot Pathing Anomalies
* **Observation:** When filtering by specific matches and scrubbing the timeline, the Grey dots (Bots) often follow rigid, perfectly straight lines and sometimes stall entirely in specific choke points, unlike the erratic, exploratory paths of Blue dots (Humans).
* **Evidence:** Linear `BotPosition` event trails that terminate or cluster abruptly at specific terrain geometry without accompanying combat events.
* **Actionable Takeaway:** The navmesh in these specific grid sectors needs to be smoothed, or the bot pathfinding algorithm requires wider collision tolerances. Fixing this will improve the "PvE Engagement Rate" by making bots feel more human and less prone to getting stuck on level geometry.