
import glob
import re

def main():
  #  Build table of calls in each file
  r = re.compile(r'title="(.*?)"')
  r2 = re.compile(r'/(b1|b2|ms|plus|a1|a2|c1|c2|c3a)/')
  r3 = re.compile(r"Call\.classes\['(.*?)'\]")
  r3py = re.compile(r"caller\['classes'\]\['(.*)'\]")
  r4 = re.compile(r'\W')
  t = {}
  #  Read animations from xml files
  for filename in glob.glob('../*/*.xml'):
    filename = filename.replace('\\','/')
    if not r2.search(filename):
      continue
    t[filename] = []
    for line in open(filename):
      m = r.search(line)
      if m:
        t[filename].append(re.sub(r4,'',m.group(1).lower()))
  #  Read scripts from javascript and python files
  for filename in glob.glob('calls/*.js') + glob.glob('../squareplay/src/calls/*.py'):
    filename = filename.replace('\\','/')
    t['../src/'+filename] = []
    for line in open(filename):
      m = r3.search(line) or r3py.search(line)
      if m:
        t['../src/'+filename].append(re.sub(r4,'',m.group(1).lower()))

  #  Invert the table
  it = {}
  for c in t.values():
    for cc in c:
      it[cc] = set()
  for f in t:
    for c in t[f]:
      it[c].add(f.replace('../','').replace('src/squareplay/',''))
  #  Now print the file(s) for each call in JSON format
  print('{')
  for c in it:
    print('    "'+c+'":["'+'","'.join(it[c])+'"],')
  #  Mark end
  print('    "--":[]')
  print('}')

main()
