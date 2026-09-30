# Extract and syntax-check all JavaScript inside index.html
import re
import subprocess
import os

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script(?:\s+[^>]*)?>(.*?)</script>', html, re.DOTALL)
print(f"Found {len(scripts)} script blocks in index.html")

tmp_file = 'scripts/temp_extracted_script.js'

for idx, script in enumerate(scripts):
    # Skip external scripts or JSON-LD
    if not script.strip():
        continue
    with open(tmp_file, 'w', encoding='utf-8') as out:
        out.write(script)
    
    res = subprocess.run(['node', '--check', tmp_file], capture_output=True, text=True)
    if res.returncode != 0:
        print(f"ERROR in script block {idx+1}:")
        print(res.stderr[:500])
        exit(1)
    else:
        print(f"Script block {idx+1}: Syntax OK ({len(script)} chars)")

if os.path.exists(tmp_file):
    os.remove(tmp_file)

print("\nALL SCRIPT BLOCKS IN index.html PASSED SYNTAX CHECK!")
