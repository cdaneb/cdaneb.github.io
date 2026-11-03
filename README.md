# My personal website

Source for [cdaneb.github.io](https://cdaneb.github.io/), deployed with GitHub Pages.
Plain HTML, CSS, and JavaScript: no frameworks, no build step.

## Features

- Navy / cyan / powder-blue theme with a light/dark toggle (remembered per browser)
- Interactive terminal: press `` ` `` or click **Terminal**, then type `help`
- Subtle background animation: a drifting point cloud with edges between nearby points (a nod to topological data analysis)
- Project cards, a photo gallery with a full-screen viewer, and copy-to-clipboard email buttons
- Respects `prefers-reduced-motion`; all content works without JavaScript

## Structure

```
index.html      page markup and content
styles.css      theme tokens, layout, components
index.js        interactive features (one init function each)
404.html        GitHub Pages not-found page
pdfs/           CV and project PDFs
images/web/     resized, metadata-stripped photos used on the site
favicon_io/     favicons + web manifest
```

## Adding photos

Original phone photos contain GPS coordinates in their EXIF data, so they're git-ignored.
Make a stripped, resized copy for the site (macOS, no extra tools needed):

```sh
sips -Z 1800 -s format bmp images/IMG_XXXX.jpeg --out /tmp/p.bmp && \
sips -s format jpeg -s formatOptions 78 /tmp/p.bmp --out images/web/name.jpg
sips -Z 800  -s format bmp images/IMG_XXXX.jpeg --out /tmp/t.bmp && \
sips -s format jpeg -s formatOptions 78 /tmp/t.bmp --out images/web/name-thumb.jpg
```

Converting through BMP drops all EXIF metadata, including location.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```
