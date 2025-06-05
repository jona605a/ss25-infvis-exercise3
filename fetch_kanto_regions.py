import requests

# Define the base URL and generation ID
BASE_URL = "https://pokeapi.co/api/v2/"
GENERATION_ID = 1

# Fetch generation data
generation_data = requests.get(f"{BASE_URL}generation/{GENERATION_ID}").json()

# Extract the main region URL
region_url = generation_data["main_region"]["url"]
# Fetch region data
region_data = requests.get(region_url).json()

# Extract the list of locations
locations = region_data["locations"]
# Extract and sort location names
location_names = sorted([location["name"] for location in locations])

# Display the location names
for name in location_names:
    print(name)