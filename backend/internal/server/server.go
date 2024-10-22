package server

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/SaiKiranMatta/nextjs-golang-polling-application/backend/internal/database"
	"github.com/SaiKiranMatta/nextjs-golang-polling-application/backend/internal/poll"
	"github.com/SaiKiranMatta/nextjs-golang-polling-application/backend/internal/session"
	"github.com/SaiKiranMatta/nextjs-golang-polling-application/backend/internal/user"
	"github.com/SaiKiranMatta/nextjs-golang-polling-application/backend/internal/vote"
	"github.com/go-webauthn/webauthn/webauthn"
	_ "github.com/joho/godotenv/autoload"
	"go.mongodb.org/mongo-driver/mongo"
)

type Server struct {
    port        int
    db          *mongo.Database
    userService *user.UserService
    pollService *poll.PollService
    sessionService *session.SessionService
    webAuthn    *webauthn.WebAuthn
}

func NewServer() *http.Server {
    port, _ := strconv.Atoi(os.Getenv("PORT"))
    db, err := database.New()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
    userService := user.NewUserService(db)
    voteService := vote.NewVoteService(db)
    pollService := poll.NewPollService(db, voteService, userService)
    sessionService := session.NewSessionService(db)

    rpDisplayName := os.Getenv("RP_DISPLAY_NAME")
	rpID := os.Getenv("RP_ID")
	rpOrigins := os.Getenv("RP_ORIGINS")

    if rpDisplayName == "" {
		rpDisplayName = "Polling App"
	}
	if rpID == "" {
		rpID = "localhost"
	}
	if rpOrigins == "" {
		rpOrigins = "http://localhost:3000"
	}

    // Split RP origins if multiple origins are provided
	rpOriginsList := strings.Split(rpOrigins, ",")

	web, err := webauthn.New(&webauthn.Config{
		RPDisplayName: rpDisplayName,
		RPID:          rpID,
		RPOrigins:     rpOriginsList,
	})
    if err != nil {
        fmt.Printf("Failed to initialize WebAuthn: %v\n", err)
        os.Exit(1) 
    }

    NewServer := &Server{
        port: port,
        db:   db,
        userService: userService,
        pollService: pollService,
        webAuthn:    web,
        sessionService: sessionService,
    }

    // Declare Server config
    server := &http.Server{
        Addr:         fmt.Sprintf(":%d", NewServer.port),
        Handler:      corsMiddleware(NewServer.RegisterRoutes()), 
        IdleTimeout:  5*time.Minute,
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 0,
    }

    return server
}

// CORS middleware function
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Set CORS headers
        w.Header().Set("Access-Control-Allow-Origin", "*") 
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
