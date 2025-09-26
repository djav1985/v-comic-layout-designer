package controllers

import (
	"encoding/json"
	"net/http"

	"comic-layout-designer/internal/models"
)

type ImageController struct {
	model *models.ComicModel
}

func NewImageController(model *models.ComicModel) *ImageController {
	return &ImageController{model: model}
}

func (i *ImageController) Delete(w http.ResponseWriter, r *http.Request) {
	// Parse form data
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	imageID := r.FormValue("name")
	if imageID == "" {
		http.Error(w, "Image ID is required", http.StatusBadRequest)
		return
	}

	if err := i.model.DeleteImage(imageID); err != nil {
		http.Error(w, "Failed to delete image", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}