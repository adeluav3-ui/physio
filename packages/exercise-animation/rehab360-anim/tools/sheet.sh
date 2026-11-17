#!/bin/bash
# usage: tools/sheet.sh NAME "ID,ID,..." [views] [fracs] [size]
ids=$2; views=${3:-side,angled}; fracs=${4:-0.03,0.35,0.6}; size=${5:-270}
python3 "$(dirname "$0")/render-check.py" --ids "$ids" --views "$views" --fracs "$fracs" --size "$size" 2>&1 | grep -v "GET /" | grep -v "^/tmp/shots" | grep -v "ERR_FAILED"
python3 - "$1" "$ids" <<'PY'
import sys
from PIL import Image
ims=[Image.open('/tmp/shots/%s.png'%i) for i in sys.argv[2].split(',')]
w=max(i.width for i in ims); h=sum(i.height for i in ims)
s=Image.new('RGB',(w,h),'white'); y=0
for i in ims: s.paste(i,(0,y)); y+=i.height
s.save('/tmp/shots/%s.png'%sys.argv[1])
PY
