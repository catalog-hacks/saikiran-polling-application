package server

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/SaiKiranMatta/nextjs-golang-polling-application/backend/internal/user"
)



func (s *Server) RegisterRoutes() http.Handler {
	mux := http.NewServeMux()


	// Hello World Route (for testing)
	mux.HandleFunc("/", s.HelloWorldHandler)

	handler := user.NewUserHandler(s.userService, s.webAuthn, s.db)
	// WebAuthn Routes for Passkey Authentication
	mux.HandleFunc("/register/begin", handler.BeginRegistration)  
	mux.HandleFunc("/register/finish", handler.FinishRegistration) 
	mux.HandleFunc("/login/begin", handler.BeginLogin)             
	mux.HandleFunc("/login/finish", handler.FinishLogin) 
	mux.HandleFunc("/auth/verify", handler.VerifyCredentials)          

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


