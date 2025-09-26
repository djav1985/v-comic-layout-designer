package controllers

import (
	"embed"
	"encoding/json"
	"html/template"
	"net/http"

	"comic-layout-designer/internal/models"
)

type HomeController struct {
	model       *models.ComicModel
	staticFiles embed.FS
}

func NewHomeController(model *models.ComicModel, staticFiles embed.FS) *HomeController {
	controller := &HomeController{
		model:       model,
		staticFiles: staticFiles,
	}
	
	// Load layouts from embedded files
	model.LoadLayoutsFromEmbed(staticFiles)
	
	return controller
}

func (h *HomeController) Index(w http.ResponseWriter, r *http.Request) {
	images, err := h.model.GetImages()
	if err != nil {
		http.Error(w, "Failed to get images", http.StatusInternalServerError)
		return
	}

	layouts := h.model.GetLayouts()
	templates := h.model.GetLayoutTemplates()
	styles := h.model.GetLayoutStyles()
	
	pages, err := h.model.GetPages()
	if err != nil {
		http.Error(w, "Failed to get pages", http.StatusInternalServerError)
		return
	}

	data := struct {
		Images    []interface{} `json:"images"`
		Layouts   map[string]string `json:"layouts"`
		Templates map[string]string `json:"templates"`
		Styles    map[string]string `json:"styles"`
		Pages     []interface{} `json:"pages"`
	}{
		Images:    interfaceSlice(images),
		Layouts:   layouts,
		Templates: templates,
		Styles:    styles,
		Pages:     interfaceSlice(pages),
	}

	// Read the main template
	templateContent, err := h.staticFiles.ReadFile("public/index.html")
	if err != nil {
		// Fall back to inline template
		templateContent = []byte(defaultIndexTemplate)
	}

	// Create template with custom functions
	funcMap := template.FuncMap{
		"toJSON": func(v interface{}) string {
			bytes, _ := json.Marshal(v)
			return string(bytes)
		},
	}

	tmpl, err := template.New("index").Funcs(funcMap).Parse(string(templateContent))
	if err != nil {
		http.Error(w, "Template parsing error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	if err := tmpl.Execute(w, data); err != nil {
		http.Error(w, "Template execution error", http.StatusInternalServerError)
		return
	}
}

func interfaceSlice[T any](slice []T) []interface{} {
	result := make([]interface{}, len(slice))
	for i, v := range slice {
		result[i] = v
	}
	return result
}

const defaultIndexTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Comic Layout Designer</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/style.css" />
</head>
<body>
<div class="app-shell">
    <header class="app-header">
        <div class="brand">
            <span class="brand-mark">V</span>
            <div class="brand-copy">
                <h1>Comic Layout Designer</h1>
                <p>Craft beautifully balanced comic pages with a responsive, distraction-free workspace.</p>
            </div>
        </div>
        <div class="header-actions">
            <button id="exportPdf" type="button" class="ghost">Export PDF</button>
            <button id="exportImages" type="button" class="ghost">Export Images</button>
            <button id="resetWorkspace" type="button" class="ghost danger">Reset Workspace</button>
            <button id="saveState" type="button" class="ghost">Save State</button>
            <button id="loadState" type="button" class="ghost">Load State</button>
            <input type="file" id="loadStateInput" accept="application/zip" hidden />
        </div>
    </header>
    <main class="app-main">
        <section id="images" aria-label="Image library">
            <button type="button" id="closeImageModal" class="mobile-modal-close" aria-label="Close image library">
                <span aria-hidden="true">✕</span>
                <span class="mobile-modal-close__text">Close</span>
            </button>
            <div class="card-header">
                <div>
                    <h2>Asset Library</h2>
                    <p>Upload images, then drag them into panels on the right.</p>
                </div>
                <button id="mobileImageToggle" class="mobile-image-toggle" type="button" aria-label="Show image library">
                    Images
                </button>
            </div>
            <div class="upload-zone">
                <form id="uploadForm" enctype="multipart/form-data">
                    <input type="file" id="imageInput" name="images[]" accept="image/*" multiple />
                    <div class="upload-prompt">
                        <span class="upload-icon" aria-hidden="true">📁</span>
                        <strong>Choose files</strong> or drag and drop
                        <small>JPEG, PNG, GIF up to 10MB each</small>
                    </div>
                </form>
            </div>
            <div id="imageList" class="image-list"></div>
        </section>
        <section id="workspace" class="workspace" aria-label="Comic workspace">
            <div class="workspace-header">
                <div>
                    <h2>Workspace</h2>
                    <div class="workspace-controls">
                        <button id="addPage" type="button" class="primary">Add Page</button>
                        <div class="workspace-utils">
                            <button id="toggleShortcuts" type="button" class="ghost small" aria-expanded="false">
                                Shortcuts
                            </button>
                        </div>
                    </div>
                </div>
                <div id="shortcutList" class="shortcut-list" aria-hidden="true">
                    <ul role="list">
                        <li><kbd>Ctrl/Cmd + N</kbd> Add page</li>
                        <li><kbd>Ctrl/Cmd + S</kbd> Save state</li>
                        <li><kbd>Ctrl/Cmd + E</kbd> Export PDF</li>
                        <li><kbd>Ctrl/Cmd + I</kbd> Export images</li>
                        <li><kbd>Ctrl/Cmd + D</kbd> Debug layouts</li>
                    </ul>
                </div>
            </div>
            <div id="pages" class="pages"></div>
        </section>
    </main>
    <div id="saveIndicator" class="save-indicator" aria-live="polite" aria-atomic="true"></div>
    <div id="mobileImageBackdrop" class="mobile-image-backdrop" hidden aria-hidden="true"></div>
</div>
<script>
const layouts = {{.Layouts | toJSON}};
const layoutTemplates = {{.Templates | toJSON}};
const layoutStyles = {{.Styles | toJSON}};
const savedPages = {{.Pages | toJSON}};
const initialImages = {{.Images | toJSON}};
</script>
<!-- jsPDF CDN -->
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script type="module" src="/js/app.js"></script>
</body>
</html>`