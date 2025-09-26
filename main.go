package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"comic-layout-designer/internal/controllers"
	"comic-layout-designer/internal/database"
	"comic-layout-designer/internal/models"

	"github.com/gorilla/mux"
)

//go:embed public/css/* public/js/* public/index.html layouts/*
var staticFiles embed.FS

func main() {
	// Initialize database
	dbPath := getDataDir() + "/state.db"
	db, err := database.New(dbPath)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Initialize model
	model := models.NewComicModel(db, getDataDir()+"/uploads")

	// Initialize controllers
	homeController := controllers.NewHomeController(model, staticFiles)
	uploadController := controllers.NewUploadController(model)
	imageController := controllers.NewImageController(model)
	pageController := controllers.NewPageController(model)
	stateController := controllers.NewStateController(model)

	// Setup routes
	r := mux.NewRouter()
	
	// Static file serving
	publicFS, err := fs.Sub(staticFiles, "public")
	if err != nil {
		log.Fatal("Failed to create sub filesystem:", err)
	}
	r.PathPrefix("/css/").Handler(http.FileServer(http.FS(publicFS)))
	r.PathPrefix("/js/").Handler(http.FileServer(http.FS(publicFS)))
	
	// API routes
	r.HandleFunc("/", homeController.Index).Methods("GET")
	r.HandleFunc("/upload", uploadController.Upload).Methods("POST")
	r.HandleFunc("/delete-image", imageController.Delete).Methods("POST")
	r.HandleFunc("/save-pages", pageController.Save).Methods("POST")
	r.HandleFunc("/get-pages", pageController.Get).Methods("GET")
	r.HandleFunc("/pages/stream", pageController.Stream).Methods("GET")
	r.HandleFunc("/state/reset", stateController.Reset).Methods("POST")
	r.HandleFunc("/state/export", stateController.Export).Methods("GET")
	r.HandleFunc("/state/import", stateController.Import).Methods("POST")
	
	// Serve uploaded files
	uploadsDir := getDataDir() + "/uploads"
	if _, err := os.Stat(uploadsDir); os.IsNotExist(err) {
		os.MkdirAll(uploadsDir, 0755)
	}
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadsDir))))

	log.Println("Server starting on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}

func getDataDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		home = "."
	}
	dataDir := filepath.Join(home, ".comic-layout-designer")
	os.MkdirAll(dataDir, 0755)
	return dataDir
}