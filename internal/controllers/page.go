package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"comic-layout-designer/internal/database"
	"comic-layout-designer/internal/models"
)

type PageController struct {
	model *models.ComicModel
}

func NewPageController(model *models.ComicModel) *PageController {
	return &PageController{model: model}
}

func (p *PageController) Save(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Pages     []database.Page `json:"pages"`
		PageCount int            `json:"pageCount"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := p.model.SetPages(req.Pages); err != nil {
		http.Error(w, "Failed to save pages", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (p *PageController) Get(w http.ResponseWriter, r *http.Request) {
	pages, err := p.model.GetPages()
	if err != nil {
		http.Error(w, "Failed to get pages", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"pages": pages})
}

func (p *PageController) Stream(w http.ResponseWriter, r *http.Request) {
	// Set Server-Sent Events headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	// Get context with timeout
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	// Send retry interval
	fmt.Fprintf(w, "retry: 5000\n\n")
	flusher.Flush()

	// Get initial state
	lastModified, err := p.model.GetLastModified()
	if err != nil {
		log.Printf("Failed to get last modified: %v", err)
		return
	}

	// Send initial state
	if err := p.emitState(w, flusher); err != nil {
		log.Printf("Failed to emit initial state: %v", err)
		return
	}

	// Poll for changes
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	maxIterations := 25
	iterations := 0

	for {
		select {
		case <-ctx.Done():
			// Send keepalive message before closing
			fmt.Fprintf(w, "event: keepalive\n")
			fmt.Fprintf(w, "data: connection_timeout\n\n")
			flusher.Flush()
			return

		case <-ticker.C:
			if iterations >= maxIterations {
				// Send keepalive message before closing
				fmt.Fprintf(w, "event: keepalive\n")
				fmt.Fprintf(w, "data: connection_timeout\n\n")
				flusher.Flush()
				return
			}

			currentModified, err := p.model.GetLastModified()
			if err != nil {
				log.Printf("Failed to get last modified: %v", err)
				continue
			}

			if currentModified != lastModified {
				lastModified = currentModified
				if err := p.emitState(w, flusher); err != nil {
					log.Printf("Failed to emit state: %v", err)
					return
				}
			}

			iterations++
		}
	}
}

func (p *PageController) emitState(w http.ResponseWriter, flusher http.Flusher) error {
	state, err := p.model.RefreshStateFromDisk()
	if err != nil {
		return err
	}

	payload := map[string]interface{}{
		"pages":     state.Pages,
		"pageCount": state.PageCount,
		"timestamp": time.Now().Unix(),
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	fmt.Fprintf(w, "event: pages\n")
	fmt.Fprintf(w, "data: %s\n\n", string(data))
	flusher.Flush()

	return nil
}