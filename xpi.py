import sys, os, re, datetime, zipfile

path = 'uc'
date = datetime.date.today().strftime('%Y%m%d')
name = path + date + '.xpi'

with open(path +'/install.rdf', 'r+b') as f:
  s = re.sub(r'(?<=\bversion=")\d+', date, f.read())
  f.seek(0)
  f.write(s)

zipf = zipfile.ZipFile(name, 'w', zipfile.ZIP_DEFLATED)
for dirpath, dirnames, filenames in os.walk(path):
  for filename in filenames:
    abspath = os.path.join(dirpath, filename)
    arcpath = abspath[len(path)+1:]
    zipf.write(abspath, arcpath)

print name
