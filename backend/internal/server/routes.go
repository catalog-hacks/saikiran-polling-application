package server

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/SaiKiranMatta/nextjs-golang-polling-application/backend/internal/user"
)



func (s *Server) RegisterRoutes() http.Handler {
	mux := http.NewServeMux()

	// Health Check Route
	mux.HandleFunc("/health", s.healthHandler)

	// Hello World Route (for testing)
	mux.HandleFunc("/", s.HelloWorldHandler)

	handler := user.NewUserHandler(s.userService, s.webAuthn)
	// WebAuthn Routes for Passkey Authentication
	mux.HandleFunc("/api/passkey/registerStart", handler.BeginRegistration)  
	mux.HandleFunc("/api/passkey/registerFinish", handler.FinishRegistration) 
	mux.HandleFunc("/api/passkey/loginStart", handler.BeginLogin)             
	mux.HandleFunc("/api/passkey/loginFinish", handler.FinishLogin)           

	// Other User-Related Routes (for future extensions)
	// e.g., mux.HandleFunc("/api/user/profile", s.UserProfileHandler)

	return mux
}

func (s *Server) HelloWorldHandler(w http.ResponseWriter, r *http.Request) {
	resp := make(map[string]string)
	resp["message"] = "Hello World"

	jsonResp, err := json.Marshal(resp)
	if err != nil {
		log.Fatalf("error handling JSON marshal. Err: %v", err)
	}

	_, _ = w.Write(jsonResp)
}

func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	jsonResp, err := json.Marshal(s.db.Health())

	if err != nil {
		log.Fatalf("error handling JSON marshal. Err: %v", err)
	}

	_, _ = w.Write(jsonResp)
}
