"""Bundle the trainer into a portable HTML file. Run with Python 3."""
from pathlib import Path

root = Path(__file__).resolve().parent
html = (root / 'index.html').read_text()
html = html.replace('href="./index.html"', 'href="#"')
css = (root / 'styles.css').read_text()
gsap = (root / 'vendor/gsap.min.js').read_text()
app = (root / 'app.js').read_text()
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + css + '\n</style>')
html = html.replace('  <script defer src="vendor/gsap.min.js"></script>\n', '')
html = html.replace('  <script defer src="app.js"></script>\n', '')
html = html.replace('</body>', '<script>\n' + gsap + '\n</script>\n<script>\n' + app + '\n</script>\n</body>')
output = root / 'volleyball-trainer.html'
output.write_text(html)
print(f'Created {output.name} ({output.stat().st_size:,} bytes)')
