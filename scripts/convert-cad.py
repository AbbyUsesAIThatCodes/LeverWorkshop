"""Convert teacher-supplied VEX OBJ files to compact, unchanged triangle meshes.
Usage: python scripts/convert-cad.py /path/to/named/obj/files
Source OBJ files are not needed for running or building the app.
"""
import sys, json, struct, hashlib, gzip
from pathlib import Path
source=Path(sys.argv[1]); dest=Path('public/assets'); dest.mkdir(exist_ok=True,parents=True)
meta={}; data=bytearray()
for name in ['beam','upright','angle','pin','corner','offset','largeGear','smallGear','shaft','collar','standoff']:
 raw=(source/(name+'.obj')).read_text(); vertices=[]; normals=[]; faces=[]
 for line in raw.splitlines():
  v=line.split()
  if not v: continue
  if v[0]=='v': vertices.append(tuple(map(float,v[1:4])))
  elif v[0]=='vn': normals.append(tuple(map(float,v[1:4])))
  elif v[0]=='f':
   ids=[x.split('/') for x in v[1:]]
   for i in range(1,len(ids)-1): faces.extend([ids[0],ids[i],ids[i+1]])
 scale=2 if name in ['shaft','collar'] else 1/12.7
 offset=len(data); lo=[min(v[i] for v in vertices)*scale for i in range(3)]; hi=[max(v[i] for v in vertices)*scale for i in range(3)]
 for f in faces:
  p=vertices[int(f[0])-1]; n=normals[int(f[2])-1]
  data.extend(struct.pack('<6f',*[x*scale for x in p],*n))
 meta[name]={'offset':offset,'count':len(faces),'min':lo,'max':hi}
 print(name,len(faces)//3,'triangles', 'bounds',lo,hi)
(dest/'parts.bin.gz').write_bytes(gzip.compress(data,compresslevel=9,mtime=0))
(dest/'parts.json').write_text(json.dumps(meta,separators=(',',':')))
print('Wrote',len(data),'bytes; SHA256',hashlib.sha256(data).hexdigest())
