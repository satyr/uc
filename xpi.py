import os
import zipfile

name = 'uc.xpi'
path = 'uc'
zipf = zipfile.ZipFile(name, 'w', zipfile.ZIP_DEFLATED)
for dirpath, dirnames, filenames in os.walk(path):
  for filename in filenames:
    abspath = os.path.join(dirpath, filename)
    arcpath = abspath[len(path)+1:]
    zipf.write(abspath, arcpath)
print name
