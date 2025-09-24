# Comic Layout Designer

A simple MVC PHP application that lets you drag and drop uploaded images into predefined comic page layouts and export the result to PDF.

## Setup

1. Install dependencies:
   ```bash
   composer install
   ```
2. Start a PHP server from the `public` directory:
   ```bash
   php -S localhost:8000 -t public
   ```
3. Open `http://localhost:8000` in your browser.

Uploaded images are stored in `uploads/`.

## Notes

* Exported PDFs and PNGs now keep the diagonal panel edges found in the angled layouts. The exporter re-applies each layout's
  `clip-path` geometry after html2canvas renders the page so the gutters stay crisp in the output files.
