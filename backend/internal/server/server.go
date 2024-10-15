package server

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/SaiKiranMatta/nextjs-golang-polling-application/backend/internal/database"
	"github.com/SaiKiranMatta/nextjs-golang-polling-application/backend/internal/user"
	"github.com/go-webauthn/webauthn/webauthn"
	_ "github.com/joho/godotenv/autoload"
)

type Server struct {
    port        int
    db          database.Service
    userService *user.UserService
    webAuthn    *webauthn.WebAuthn
}

func NewServer() *http.Server {
    port, _ := strconv.Atoi(os.Getenv("PORT"))
    NewServer := &Server{
        port: port,
        db:   database.New(),
    }

    // Declare Server config
    server := &http.Server{
        Addr:         fmt.Sprintf(":%d", NewServer.port),
        Handler:      corsMiddleware(NewServer.RegisterRoutes()), // Wrap the handler with CORS middleware
        IdleTimeout:  time.Minute,
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 30 * time.Second,
    }

    return server
}

// CORS middleware function
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Set CORS headers
        w.Header().Set("Access-Control-Allow-Origin", "*") // You can change * to specific origin, e.g., "http://localhost:3000"
        w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

        // Handle preflight (OPTIONS) requests
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }

        // Pass request to the next handler
        next.ServeHTTP(w, r)
    })
}
