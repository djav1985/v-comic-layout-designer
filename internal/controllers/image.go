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
	var req struct {
		ImageID string `json:"imageId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.ImageID == "" {
		http.Error(w, "Image ID is required", http.StatusBadRequest)
		return
	}

	if err := i.model.DeleteImage(req.ImageID); err != nil {
		http.Error(w, "Failed to delete image", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}