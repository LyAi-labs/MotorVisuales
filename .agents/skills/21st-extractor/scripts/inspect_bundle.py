import sys

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

path = r'C:\opt\lyai\app\lyai-shared\components\features-with-panel\bundle.html'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

pos_im = text.find('function iM()')
pos_end = text.find('FeaturesWithPanel")')
print("=== COMPONENT iM ===")
print(text[pos_im:pos_end+30])

pos_media = text.rfind('function Fg(', 0, pos_im)
if pos_media != -1:
    print("=== MEDIA RENDERER Fg ===")
    print(text[pos_media:pos_im])
