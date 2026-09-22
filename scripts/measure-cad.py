"""Reproduce CAD volume, centroid, and unit-mass inertia from source OBJ meshes.

Usage: python scripts/measure-cad.py /path/to/named/obj/files
Requires NumPy; normal builds use committed JSON and do not need Python.
"""

import argparse
import json
from pathlib import Path

import numpy as np

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("directory", type=Path)
args = parser.parse_args()
expected = {
    "beam", "upright", "angle", "pin", "corner", "offset", "largeGear",
    "smallGear", "shaft", "collar", "standoff",
}
paths = {path.stem: path for path in args.directory.glob("*.obj")}
if expected - paths.keys():
    parser.error(f"Missing named CAD files: {sorted(expected - paths.keys())}")

properties = {}
for name in sorted(expected):
    vertices, faces = [], []
    for line in paths[name].read_text().splitlines():
        tokens = line.split()
        if not tokens:
            continue
        if tokens[0] == "v":
            vertices.append(list(map(float, tokens[1:4])))
        elif tokens[0] == "f":
            indices = [int(value.split("/")[0]) - 1 for value in tokens[1:]]
            for i in range(1, len(indices) - 1):
                faces.append([indices[0], indices[i], indices[i + 1]])

    # Source shaft/collar dimensions are inches; all others are millimeters.
    scale = 2 if name in {"shaft", "collar"} else 1 / 12.7
    vertices = np.asarray(vertices) * scale
    triangles = vertices[np.asarray(faces)]
    signed = np.einsum(
        "ij,ij->i", triangles[:, 0], np.cross(triangles[:, 1], triangles[:, 2])
    ) / 6
    volume = signed.sum()
    if abs(volume) < 1e-10:
        raise ValueError(f"Degenerate volume for {name}")
    sums = triangles.sum(axis=1)
    center = (sums * signed[:, None]).sum(axis=0) / volume / 4
    second_moment = (
        np.einsum("tvi,tvj->tij", triangles, triangles)
        + np.einsum("ti,tj->tij", sums, sums)
    ) / 20
    covariance = (
        (second_moment * signed[:, None, None]).sum(axis=0) / volume
        - np.outer(center, center)
    )
    inertia = np.eye(3) * np.trace(covariance) - covariance
    properties[name] = {
        "volumeCm3": round(abs(volume) * 1.27**3, 8),
        "center": center.round(8).tolist(),
        "inertiaPerMass": inertia.round(8).tolist(),
        "bounds": [vertices.min(0).round(8).tolist(), vertices.max(0).round(8).tolist()],
    }
    print(name, properties[name]["volumeCm3"], center.round(4).tolist())

Path("src/part-properties.json").write_text(json.dumps(properties, indent=2) + "\n")
