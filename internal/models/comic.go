package models

import (
	"archive/zip"
	"crypto/rand"
	"embed"
	"encoding/hex"
	"fmt"
	"html/template"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"comic-layout-designer/internal/database"
)

type ComicModel struct {
	db        *database.Database
	uploadDir string
	layouts   map[string]string
	templates map[string]string
	styles    map[string]string
	mutex     sync.RWMutex
}

func NewComicModel(db *database.Database, uploadDir string) *ComicModel {
	model := &ComicModel{
		db:        db,
		uploadDir: uploadDir,
		layouts:   make(map[string]string),
		templates: make(map[string]string),
		styles:    make(map[string]string),
	}

	// Ensure upload directory exists
	os.MkdirAll(uploadDir, 0755)

	return model
}

func (m *ComicModel) LoadLayoutsFromEmbed(staticFiles embed.FS) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	// Read layout files from embedded filesystem
	layoutFiles, err := fs.ReadDir(staticFiles, "layouts")
	if err != nil {
		return fmt.Errorf("failed to read layouts directory: %w", err)
	}

	for _, file := range layoutFiles {
		if file.IsDir() {
			continue
		}

		fileName := file.Name()
		filePath := filepath.Join("layouts", fileName)
		
		content, err := fs.ReadFile(staticFiles, filePath)
		if err != nil {
			continue
		}

		if strings.HasSuffix(fileName, ".php") {
			layoutName := strings.TrimSuffix(fileName, ".php")
			// Convert PHP template to Go template
			goTemplate := convertPHPToGoTemplate(string(content))
			m.templates[layoutName] = goTemplate
			m.layouts[layoutName] = layoutName
		} else if strings.HasSuffix(fileName, ".css") {
			layoutName := strings.TrimSuffix(fileName, ".css")
			m.styles[layoutName] = string(content)
		}
	}

	return nil
}

func convertPHPToGoTemplate(phpContent string) string {
	// Convert PHP template syntax to Go template syntax
	// This is a simplified conversion - you may need to enhance this based on actual PHP templates
	goContent := phpContent
	
	// Replace PHP opening/closing tags
	goContent = strings.ReplaceAll(goContent, "<?php", "")
	goContent = strings.ReplaceAll(goContent, "?>", "")
	
	// Replace basic PHP echo with Go template syntax
	goContent = strings.ReplaceAll(goContent, "<?= ", "{{")
	goContent = strings.ReplaceAll(goContent, " ?>", "}}")
	
	return goContent
}

func (m *ComicModel) GetState() (database.State, error) {
	return m.db.GetState()
}

func (m *ComicModel) SetState(state database.State) error {
	return m.db.SetState(state)
}

func (m *ComicModel) RefreshStateFromDisk() (database.State, error) {
	return m.db.GetState()
}

func (m *ComicModel) GetImages() ([]database.ImageItem, error) {
	state, err := m.db.GetState()
	if err != nil {
		return nil, err
	}
	return state.Images, nil
}

func (m *ComicModel) SetImages(images []database.ImageItem) error {
	state, err := m.db.GetState()
	if err != nil {
		return err
	}
	state.Images = images
	return m.db.SetState(state)
}

func (m *ComicModel) GetPages() ([]database.Page, error) {
	state, err := m.db.GetState()
	if err != nil {
		return nil, err
	}
	return state.Pages, nil
}

func (m *ComicModel) SetPages(pages []database.Page) error {
	state, err := m.db.GetState()
	if err != nil {
		return err
	}
	state.Pages = pages
	state.PageCount = len(pages)
	return m.db.SetState(state)
}

func (m *ComicModel) GetLayouts() map[string]string {
	m.mutex.RLock()
	defer m.mutex.RUnlock()
	
	layouts := make(map[string]string)
	for k, v := range m.layouts {
		layouts[k] = v
	}
	return layouts
}

func (m *ComicModel) GetLayoutTemplates() map[string]string {
	m.mutex.RLock()
	defer m.mutex.RUnlock()
	
	templates := make(map[string]string)
	for k, v := range m.templates {
		templates[k] = v
	}
	return templates
}

func (m *ComicModel) GetLayoutStyles() map[string]string {
	m.mutex.RLock()
	defer m.mutex.RUnlock()
	
	styles := make(map[string]string)
	for k, v := range m.styles {
		styles[k] = v
	}
	return styles
}

func (m *ComicModel) RenderLayoutTemplate(layoutName string, data interface{}) (string, error) {
	m.mutex.RLock()
	templateContent, exists := m.templates[layoutName]
	m.mutex.RUnlock()
	
	if !exists {
		return "", fmt.Errorf("layout template not found: %s", layoutName)
	}

	tmpl, err := template.New(layoutName).Parse(templateContent)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var buf strings.Builder
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}

func (m *ComicModel) SaveUploadedFile(filename string, content []byte) (database.ImageItem, error) {
	// Generate unique ID
	id := generateID()
	
	// Save file
	filePath := filepath.Join(m.uploadDir, filename)
	if err := os.WriteFile(filePath, content, 0644); err != nil {
		return database.ImageItem{}, fmt.Errorf("failed to save file: %w", err)
	}

	// Create image item
	imageItem := database.ImageItem{
		ID:       id,
		Filename: filename,
		URL:      "/uploads/" + filename,
	}

	// Add to state
	images, err := m.GetImages()
	if err != nil {
		return imageItem, err
	}

	images = append(images, imageItem)
	if err := m.SetImages(images); err != nil {
		return imageItem, err
	}

	return imageItem, nil
}

func (m *ComicModel) DeleteImage(imageID string) error {
	images, err := m.GetImages()
	if err != nil {
		return err
	}

	var updatedImages []database.ImageItem
	var deletedFilename string

	for _, img := range images {
		if img.ID != imageID {
			updatedImages = append(updatedImages, img)
		} else {
			deletedFilename = img.Filename
		}
	}

	// Delete file from disk
	if deletedFilename != "" {
		filePath := filepath.Join(m.uploadDir, deletedFilename)
		os.Remove(filePath) // Ignore error if file doesn't exist
	}

	return m.SetImages(updatedImages)
}

func (m *ComicModel) ResetState() error {
	// Clear all images from disk
	entries, err := os.ReadDir(m.uploadDir)
	if err == nil {
		for _, entry := range entries {
			if !entry.IsDir() {
				os.Remove(filepath.Join(m.uploadDir, entry.Name()))
			}
		}
	}

	// Reset state
	defaultState := database.State{
		Images:    []database.ImageItem{},
		Pages:     []database.Page{},
		PageCount: 0,
	}

	return m.db.SetState(defaultState)
}

func (m *ComicModel) GetLastModified() (int64, error) {
	return m.db.GetLastModified()
}

func (m *ComicModel) ExportState() (string, error) {
	// Create temporary zip file
	tempDir := os.TempDir()
	zipPath := filepath.Join(tempDir, fmt.Sprintf("comic-state-%d.zip", time.Now().Unix()))

	zipFile, err := os.Create(zipPath)
	if err != nil {
		return "", fmt.Errorf("failed to create zip file: %w", err)
	}
	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	// Add database file
	dbFile, err := zipWriter.Create("state.db")
	if err != nil {
		return "", err
	}

	dbContent, err := os.ReadFile(m.db.GetDbPath())
	if err != nil {
		return "", err
	}

	_, err = dbFile.Write(dbContent)
	if err != nil {
		return "", err
	}

	// Add uploads directory
	if entries, err := os.ReadDir(m.uploadDir); err == nil {
		for _, entry := range entries {
			if entry.IsDir() {
				continue
			}

			filePath := filepath.Join(m.uploadDir, entry.Name())
			fileContent, err := os.ReadFile(filePath)
			if err != nil {
				continue
			}

			zipEntry, err := zipWriter.Create(filepath.Join("uploads", entry.Name()))
			if err != nil {
				continue
			}

			zipEntry.Write(fileContent)
		}
	}

	return zipPath, nil
}

func (m *ComicModel) ImportStateFromFile(zipPath string) error {
	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return fmt.Errorf("failed to open zip file: %w", err)
	}
	defer reader.Close()

	tempDir := filepath.Join(os.TempDir(), fmt.Sprintf("import_%s", generateID()))
	defer os.RemoveAll(tempDir)

	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return fmt.Errorf("failed to create temp directory: %w", err)
	}

	// Extract all files
	for _, file := range reader.File {
		extractPath := filepath.Join(tempDir, file.Name)
		
		if file.FileInfo().IsDir() {
			os.MkdirAll(extractPath, file.FileInfo().Mode())
			continue
		}

		os.MkdirAll(filepath.Dir(extractPath), 0755)

		rc, err := file.Open()
		if err != nil {
			return err
		}

		outFile, err := os.Create(extractPath)
		if err != nil {
			rc.Close()
			return err
		}

		_, err = io.Copy(outFile, rc)
		rc.Close()
		outFile.Close()
		if err != nil {
			return err
		}
	}

	// Import database
	dbPath := filepath.Join(tempDir, "state.db")
	if _, err := os.Stat(dbPath); err == nil {
		if err := m.db.ImportFromFile(dbPath); err != nil {
			return fmt.Errorf("failed to import database: %w", err)
		}
	}

	// Import uploads
	uploadsDir := filepath.Join(tempDir, "uploads")
	if entries, err := os.ReadDir(uploadsDir); err == nil {
		// Clear existing uploads
		if existingEntries, err := os.ReadDir(m.uploadDir); err == nil {
			for _, entry := range existingEntries {
				if !entry.IsDir() {
					os.Remove(filepath.Join(m.uploadDir, entry.Name()))
				}
			}
		}

		// Copy new uploads
		for _, entry := range entries {
			if entry.IsDir() {
				continue
			}

			srcPath := filepath.Join(uploadsDir, entry.Name())
			dstPath := filepath.Join(m.uploadDir, entry.Name())

			srcFile, err := os.Open(srcPath)
			if err != nil {
				continue
			}

			dstFile, err := os.Create(dstPath)
			if err != nil {
				srcFile.Close()
				continue
			}

			io.Copy(dstFile, srcFile)
			srcFile.Close()
			dstFile.Close()
		}
	}

	return nil
}

func generateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}