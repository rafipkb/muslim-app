import re

html_file = r'index.html'
with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Substitutions
subs = {
    'map-pin': 'icon-location',
    'book-open': 'icon-book-open',
    'book': 'icon-quran',
    'disc': 'icon-tasbeeh',
    'compass': 'icon-compass',
    'rotate-ccw': 'icon-reset',
    'search': 'icon-search',
    'arrow-left': 'icon-back',
    'a-arrow-down': 'icon-font-down',
    'a-arrow-up': 'icon-font-up',
    'home': 'icon-mosque',
    'clock': 'icon-clock',
    'sun': 'icon-sun'
}

for lucide, icon_id in subs.items():
    if lucide == 'sun':
        content = re.sub(fr'<i data-lucide="{lucide}"></i>', f'<svg class="icon" id="theme-icon"><use href="#{icon_id}"></use></svg>', content)
    else:    
        content = re.sub(fr'<i data-lucide="{lucide}"></i>', f'<svg class="icon"><use href="#{icon_id}"></use></svg>', content)

# Special case for Qibla pointer
content = re.sub(r'<i data-lucide="arrow-up" id="qibla-pointer" class="kaaba-pointer"></i>', r'<svg id="qibla-pointer" class="kaaba-pointer icon"><use href="#icon-kaaba"></use></svg>', content)

# Remove lucide script import
content = re.sub(r'<script src="https://unpkg\.com/lucide@latest"></script>\s*', '', content)

svg_defs = """<svg width="0" height="0" class="hidden">
  <defs>
    <symbol id="icon-mosque" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2C12 2 10 5 10 7C10 8.1 10.9 9 12 9C13.1 9 14 8.1 14 7C14 5 12 2 12 2Z"></path>
      <path d="M4 14V22H20V14"></path>
      <path d="M4 14C4 12 6.5 10 12 10C17.5 10 20 12 20 14"></path>
      <path d="M12 10V22"></path>
      <path d="M8 12L8 22"></path>
      <path d="M16 12L16 22"></path>
    </symbol>
    <symbol id="icon-tasbeeh" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="10" r="7" stroke-dasharray="2 3"></circle>
      <path d="M12 17V22M10 20H14"></path>
    </symbol>
    <symbol id="icon-quran" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">
      <path d=\"M4 19.5A2.5 2.5 0 0 1 6.5 17H20\"></path>
      <path d=\"M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z\"></path>
      <path d=\"M12 8A2 2 0 1 0 12 12A2 2 0 1 0 12 8Z\"></path>
      <path d=\"M14 8L12 10\"></path>
    </symbol>
    <symbol id="icon-book-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </symbol>
    <symbol id="icon-compass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
    </symbol>
    <symbol id="icon-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </symbol>
    <symbol id="icon-location" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </symbol>
    <symbol id="icon-sun" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </symbol>
    <symbol id="icon-moon" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </symbol>
    <symbol id="icon-search" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </symbol>
    <symbol id="icon-back" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </symbol>
    <symbol id="icon-font-up" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="4 7 4 4 20 4 20 7"></polyline>
      <line x1="12" y1="4" x2="12" y2="20"></line>
      <line x1="8" y1="20" x2="16" y2="20"></line>
      <path d="M20 12 L20 18 M17 15 L23 15"></path>
    </symbol>
    <symbol id="icon-font-down" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="4 7 4 4 20 4 20 7"></polyline>
      <line x1="12" y1="4" x2="12" y2="20"></line>
      <line x1="8" y1="20" x2="16" y2="20"></line>
      <line x1="18" y1="15" x2="22" y2="15"></line>
    </symbol>
    <symbol id="icon-reset" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
      <path d="M3 3v5h5"></path>
    </symbol>
    <symbol id="icon-kaaba" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C11.5 2 11 2.5 11 3L11 9.5C11 10 11.5 10.5 12 10.5C12.5 10.5 13 10 13 9.5L13 3C13 2.5 12.5 2 12 2Z"></path>
      <path d="M7 11L17 11L17 21L7 21Z"></path>
      <path d="M7 13L17 13M7 15L17 15M7 17L17 17M7 19L17 19" stroke="currentColor" stroke-width="1"></path>
    </symbol>
  </defs>
</svg>
"""

content = content.replace('<body>', '<body>\n    ' + svg_defs)

with open(html_file, 'w', encoding='utf-8') as f:
    f.write(content)
