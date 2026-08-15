# Coastal Ghost Asset Manifest Chunks

Every JSON file in this folder is under 25 KB.

Upload these files to a folder in GitHub, for example:

data/
  manifest-index.json
  assets-01.json
  assets-02.json
  ...
  product-groups-01.json
  ...

The website can first load `manifest-index.json`, then load each file listed in
`assetChunks` and `productGroupChunks`.

These chunks contain the same asset mapping as the original full manifest,
but are split to fit a 25 KB per-file upload limit.
