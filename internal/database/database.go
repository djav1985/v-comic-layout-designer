package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

type Database struct {
	db     *sql.DB
	dbPath string
}

type State struct {
	Images    []ImageItem `json:"images"`
	Pages     []Page      `json:"pages"`
	PageCount int         `json:"pageCount"`
}

type ImageItem struct {
	ID       string `json:"id"`
	Filename string `json:"filename"`
	URL      string `json:"url"`
}

type Page struct {
	ID         string                 `json:"id"`
	Layout     string                 `json:"layout"`
	Gutter     string                 `json:"gutter"`
	IsLocked   bool                   `json:"isLocked"`
	Slots      map[string]interface{} `json:"slots"`
	Transforms map[string]interface{} `json:"transforms"`
}

func New(dbPath string) (*Database, error) {
	// Ensure directory exists
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create database directory: %w", err)
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	database := &Database{
		db:     db,
		dbPath: dbPath,
	}

	if err := database.initSchema(); err != nil {
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	return database, nil
}

func (d *Database) initSchema() error {
	query := `
		CREATE TABLE IF NOT EXISTS state (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL,
			updated_at INTEGER NOT NULL
		)
	`
	
	if _, err := d.db.Exec(query); err != nil {
		return err
	}

	// Initialize default state if empty
	var count int
	err := d.db.QueryRow("SELECT COUNT(*) FROM state").Scan(&count)
	if err != nil {
		return err
	}

	if count == 0 {
		defaultState := State{
			Images:    []ImageItem{},
			Pages:     []Page{},
			PageCount: 0,
		}
		return d.SetState(defaultState)
	}

	return nil
}

func (d *Database) GetState() (State, error) {
	var state State
	
	// Get all state values
	rows, err := d.db.Query("SELECT key, value FROM state")
	if err != nil {
		return state, err
	}
	defer rows.Close()

	stateMap := make(map[string]interface{})
	
	for rows.Next() {
		var key, value string
		if err := rows.Scan(&key, &value); err != nil {
			return state, err
		}
		
		var val interface{}
		if err := json.Unmarshal([]byte(value), &val); err != nil {
			return state, err
		}
		
		stateMap[key] = val
	}

	// Convert to structured state
	if images, ok := stateMap["images"]; ok {
		if imgData, err := json.Marshal(images); err == nil {
			json.Unmarshal(imgData, &state.Images)
		}
	}
	
	if pages, ok := stateMap["pages"]; ok {
		if pageData, err := json.Marshal(pages); err == nil {
			json.Unmarshal(pageData, &state.Pages)
		}
	}
	
	if pageCount, ok := stateMap["pageCount"]; ok {
		if count, ok := pageCount.(float64); ok {
			state.PageCount = int(count)
		}
	}

	return state, nil
}

func (d *Database) SetState(state State) error {
	tx, err := d.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	timestamp := time.Now().Unix()

	// Set individual state components
	if err := d.setStateValue(tx, "images", state.Images, timestamp); err != nil {
		return err
	}
	if err := d.setStateValue(tx, "pages", state.Pages, timestamp); err != nil {
		return err
	}
	if err := d.setStateValue(tx, "pageCount", state.PageCount, timestamp); err != nil {
		return err
	}

	return tx.Commit()
}

func (d *Database) setStateValue(tx *sql.Tx, key string, value interface{}, timestamp int64) error {
	jsonValue, err := json.Marshal(value)
	if err != nil {
		return err
	}

	_, err = tx.Exec("INSERT OR REPLACE INTO state (key, value, updated_at) VALUES (?, ?, ?)", 
		key, string(jsonValue), timestamp)
	return err
}

func (d *Database) GetLastModified() (int64, error) {
	var timestamp int64
	err := d.db.QueryRow("SELECT MAX(updated_at) FROM state").Scan(&timestamp)
	return timestamp, err
}

func (d *Database) GetDbPath() string {
	return d.dbPath
}

func (d *Database) Close() error {
	return d.db.Close()
}

func (d *Database) ImportFromFile(sourcePath string) error {
	sourceDb, err := sql.Open("sqlite", sourcePath)
	if err != nil {
		return fmt.Errorf("failed to open source database: %w", err)
	}
	defer sourceDb.Close()

	// Clear existing state
	if _, err := d.db.Exec("DELETE FROM state"); err != nil {
		return fmt.Errorf("failed to clear existing state: %w", err)
	}

	// Copy state from source database
	rows, err := sourceDb.Query("SELECT key, value, updated_at FROM state")
	if err != nil {
		return fmt.Errorf("failed to query source state: %w", err)
	}
	defer rows.Close()

	tx, err := d.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for rows.Next() {
		var key, value string
		var updatedAt int64
		if err := rows.Scan(&key, &value, &updatedAt); err != nil {
			return fmt.Errorf("failed to scan source row: %w", err)
		}

		_, err = tx.Exec("INSERT INTO state (key, value, updated_at) VALUES (?, ?, ?)", 
			key, value, updatedAt)
		if err != nil {
			return fmt.Errorf("failed to insert state: %w", err)
		}
	}

	return tx.Commit()
}