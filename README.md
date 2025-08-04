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

Uploaded images are stored in `uploads/` and generated PDFs appear in `storage/generated/`.
