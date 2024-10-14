# Simple Makefile for a Go project

# Build the application
all: build test

build:
	@echo "Building for the current platform..."
	@go build -o build/api ./cmd/api

# Cross-platform builds
#Build for Windows
build-windows:
	@echo "Building for Windows..."
	set GOOS=windows && set GOARCH=amd64 && go build -o build/windows/api.exe ./cmd/api

# Build for Linux
build-linux:
	@echo "Building for Linux..."
	set GOOS=linux && set GOARCH=amd64 && go build -o build/linux/api ./cmd/api

# Build for macOS
build-darwin:
	@echo "Building for macOS..."
	set GOOS=darwin && set GOARCH=amd64 && go build -o build/darwin/api ./cmd/api

# Run the application
run:
	@go run cmd/api/main.go

# Test the application
test:
	@echo "Testing..."
	@go test ./... -v

# Integration Tests for the application
itest:
	@echo "Running integration tests..."
	@go test ./internal/database -v

# Clean the binary
clean:
	@echo "Cleaning..."
	@rm -f main

# Live Reload
watch:
	@powershell -ExecutionPolicy Bypass -Command "if (Get-Command air -ErrorAction SilentlyContinue) { \
		air; \
		Write-Output 'Watching...'; \
	} else { \
		Write-Output 'Installing air...'; \
		go install github.com/air-verse/air@latest; \
		air; \
		Write-Output 'Watching...'; \
	}"

.PHONY: all build run test clean watch itest
