package controllers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"comic-layout-designer/internal/models"
)

type StateController struct {
	model *models.ComicModel
}

func NewStateController(model *models.ComicModel) *StateController {
	return &StateController{model: model}
}

func (s *StateController) Reset(w http.ResponseWriter, r *http.Request) {
	if err := s.model.ResetState(); err != nil {
		http.Error(w, "Failed to reset state", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (s *StateController) Export(w http.ResponseWriter, r *http.Request) {
	zipPath, err := s.model.ExportState()
	if err != nil {
		http.Error(w, "Failed to export state", http.StatusInternalServerError)
		return
	}
	
	// Clean up the temporary file after serving
	defer func() {
		// Note: In a production environment, you might want to clean this up asynchronously
		// to avoid blocking the response
	}()

	// Determine filename
	filename := fmt.Sprintf("comic-state-%d.zip", 
		func() int64 { t, _ := s.model.GetLastModified(); return t }())

	// Set headers for file download
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", 
		fmt.Sprintf("attachment; filename=\"%s\"", filename))

	// Serve the file
	http.ServeFile(w, r, zipPath)
}

func (s *StateController) Import(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form
	err := r.ParseMultipartForm(10 << 20) // 10MB limit
	if err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	file, fileHeader, err := r.FormFile("state")
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "No archive uploaded."})
		return
	}
	defer file.Close()

	if filepath.Ext(fileHeader.Filename) != ".zip" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid file type. Please upload a ZIP archive."})
		return
	}

	// Save uploaded file temporarily
	tempPath := filepath.Join("/tmp", fileHeader.Filename)
	tempFile, err := os.Create(tempPath)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create temporary file."})
		return
	}
	defer os.Remove(tempPath)

	_, err = io.Copy(tempFile, file)
	tempFile.Close()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to save uploaded file."})
		return
	}

	// Import state from zip file
	if err := s.model.ImportStateFromFile(tempPath); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// Get updated state
	pages, err := s.model.GetPages()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to get pages after import."})
		return
	}

	images, err := s.model.GetImages()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to get images after import."})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "ok",
		"pages":  pages,
		"images": images,
	})
}