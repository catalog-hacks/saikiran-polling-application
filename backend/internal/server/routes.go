package server

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/SaiKiranMatta/nextjs-golang-polling-application/backend/internal/poll"
	"github.com/SaiKiranMatta/nextjs-golang-polling-application/backend/internal/user"
	"github.com/gorilla/mux"
)



func (s *Server) RegisterRoutes() http.Handler {
	mux := mux.NewRouter()


	// Hello World Route (for testing)
	mux.HandleFunc("/", s.HelloWorldHandler)

	userHandler := user.NewUserHandler(s.userService, s.webAuthn, s.sessionService)
	
	mux.HandleFunc("/register/begin", userHandler.BeginRegistration)  
	mux.HandleFunc("/register/finish", userHandler.FinishRegistration) 
	mux.HandleFunc("/login/begin", userHandler.BeginLogin)             
	mux.HandleFunc("/login/finish", userHandler.FinishLogin) 
	mux.HandleFunc("/auth/verify", userHandler.VerifyCredentials)     
	
	pollHandler := poll.NewPollHandler(s.pollService)
	mux.HandleFunc("/polls/{id}", pollHandler.GetPoll).Methods("GET")
	mux.HandleFunc("/polls", pollHandler.CreatePoll).Methods("POST")
	mux.HandleFunc("/polls/{id}/vote", pollHandler.Vote).Methods("POST")
	mux.HandleFunc("/polls/{id}/stream", pollHandler.StreamPollUpdates).Methods("GET")
	mux.HandleFunc("/userpolls", pollHandler.GetPollsByUser).Methods("GET")
	mux.HandleFunc("/polls/{id}/status", pollHandler.TogglePollStatus).Methods("PUT")
	mux.HandleFunc("/polls/{id}/clear-votes", pollHandler.ClearPollVotes).Methods("POST")

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


