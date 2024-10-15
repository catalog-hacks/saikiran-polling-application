package user

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/go-webauthn/webauthn/webauthn"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserHandler struct {
	userService *UserService
	webauthn    *webauthn.WebAuthn
	sessionStore *SessionStore
}

type SessionStore struct {
	sessions map[string]webauthn.SessionData
	mu       sync.RWMutex
}

func NewSessionStore() *SessionStore {
	return &SessionStore{
		sessions: make(map[string]webauthn.SessionData),
	}
}

func (s *SessionStore) Store(key string, data webauthn.SessionData) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.sessions[key] = data
}

func (s *SessionStore) Get(key string) (webauthn.SessionData, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	data, ok := s.sessions[key]
	return data, ok
}

func (s *SessionStore) Delete(key string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, key)
}

func NewUserHandler(userService *UserService, webauthn *webauthn.WebAuthn) *UserHandler {
	return &UserHandler{
		userService: userService,
		webauthn:    webauthn,
		sessionStore: NewSessionStore(),
	}
}

func (h *UserHandler) BeginRegistration(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err := h.userService.GetUserByEmail(req.Email)
	if err == nil {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	user := &User{
		ID:           primitive.NewObjectID(),
		Name:         req.Name,
		DisplayName:  req.Name,
		Email:        req.Email,
		CreatedPolls: []primitive.ObjectID{},
		Credentials:  []webauthn.Credential{},
	}

	webAuthnUser := NewWebAuthnUser(user)

	options, sessionData, err := h.webauthn.BeginRegistration(webAuthnUser)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.sessionStore.Store(user.ID.Hex(), *sessionData)

	if err := h.userService.CreateUser(user); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(options)
}

func (h *UserHandler) FinishRegistration(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID string          `json:"userId"`
		Data   json.RawMessage `json:"data"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID, err := primitive.ObjectIDFromHex(req.UserID)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	user, err := h.userService.GetUser(userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	webAuthnUser := NewWebAuthnUser(user)

	sessionData, ok := h.sessionStore.Get(req.UserID)
	if !ok {
		http.Error(w, "Session not found", http.StatusBadRequest)
		return
	}
	defer h.sessionStore.Delete(req.UserID)

	credential, err := h.webauthn.FinishRegistration(webAuthnUser, sessionData, r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user.Credentials = append(user.Credentials, *credential)
	if err := h.userService.UpdateUser(user); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *UserHandler) BeginLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := h.userService.GetUserByEmail(req.Email)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	webAuthnUser := NewWebAuthnUser(user)

	options, sessionData, err := h.webauthn.BeginLogin(webAuthnUser)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.sessionStore.Store(user.ID.Hex(), *sessionData)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(options)
}

func (h *UserHandler) FinishLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID string          `json:"userId"`
		Data   json.RawMessage `json:"data"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID, err := primitive.ObjectIDFromHex(req.UserID)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	user, err := h.userService.GetUser(userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	webAuthnUser := NewWebAuthnUser(user)

	sessionData, ok := h.sessionStore.Get(req.UserID)
	if !ok {
		http.Error(w, "Session not found", http.StatusBadRequest)
		return
	}
	defer h.sessionStore.Delete(req.UserID)

	_, err = h.webauthn.FinishLogin(webAuthnUser, sessionData, r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *UserHandler) VerifyCredentials(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email  string `json:"email"`
		Action string `json:"action"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := h.userService.GetUserByEmail(req.Email)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	response := map[string]interface{}{
		"id":    user.ID.Hex(),
		"email": user.Email,
		"name":  user.Name,
	}

	if req.Action == "register" {
		// For registration, we just need to confirm the user exists
		if len(user.Credentials) > 0 {
			http.Error(w, "User already registered", http.StatusConflict)
			return
		}
	} else if req.Action == "login" {
		// For login, we need to confirm the user has registered credentials
		if len(user.Credentials) == 0 {
			http.Error(w, "User not registered", http.StatusUnauthorized)
			return
		}
	} else {
		http.Error(w, "Invalid action", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}