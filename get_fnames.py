import os
import json

fnames = os.listdir("public/")
fnames = [f for f in fnames if f.endswith(".json") and f not in ["manifest.json", "fnames.json"]]

with open("public/fnames.json", "w") as f:
    json.dump(fnames, f)