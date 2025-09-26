package controllers

import (
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"

	"comic-layout-designer/internal/models"
)

type UploadController struct {
	model *models.ComicModel
}

func NewUploadController(model *models.ComicModel) *UploadController {
	return &UploadController{model: model}
}

func (u *UploadController) Upload(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form
	err := r.ParseMultipartForm(10 << 20) // 10MB limit
	if err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	files := r.MultipartForm.File["images[]"]
	if len(files) == 0 {
		http.Error(w, "No files uploaded", http.StatusBadRequest)
		return
	}

	var uploadedImages []interface{}

	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			continue
		}

		content, err := readFile(file)
		file.Close()
		if err != nil {
			continue
		}

		// Validate file type
		if !isValidImageType(fileHeader.Filename) {
			continue
		}

		imageItem, err := u.model.SaveUploadedFile(fileHeader.Filename, content)
		if err != nil {
			continue
		}

		uploadedImages = append(uploadedImages, imageItem)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(uploadedImages)
}

func readFile(file multipart.File) ([]byte, error) {
	return io.ReadAll(file)
}

func isValidImageType(filename string) bool {
	ext := filepath.Ext(filename)
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp":
		return true
	default:
		return false
	}
}