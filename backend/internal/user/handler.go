package user

import (
	"bytes"
	"encoding/json"
	"net/http"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type UserHandler struct {
	userService *UserService
	webauthn    *webauthn.WebAuthn
	db          *mongo.Database
}

func NewUserHandler(userService *UserService, webauthn *webauthn.WebAuthn, db *mongo.Database) *UserHandler {
	return &UserHandler{
		userService: userService,
		webauthn:    webauthn,
		db:          db,
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

	// Store session data in MongoDB
	_, err = h.db.Collection("sessions").InsertOne(r.Context(), bson.M{
		"userId": user.ID,
		"data":   sessionData,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := h.userService.CreateUser(user); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := struct {
		UserID  string                        `json:"userId"`
		Options *protocol.CredentialCreation `json:"options"`
	}{
		UserID:  user.ID.Hex(),
		Options: options,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
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

	// Retrieve session data from MongoDB
	var sessionDataDoc struct {
		Data webauthn.SessionData `bson:"data"`
	}
	err = h.db.Collection("sessions").FindOne(r.Context(), bson.M{"userId": userID}).Decode(&sessionDataDoc)
	if err != nil {
		http.Error(w, "Session not found", http.StatusBadRequest)
		return
	}
	
	// Delete session data after retrieval
	_, err = h.db.Collection("sessions").DeleteOne(r.Context(), bson.M{"userId": userID})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	newReq, err := createNewRequestWithBody(req.Data, r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	credential, err := h.webauthn.FinishRegistration(webAuthnUser, sessionDataDoc.Data, newReq)
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

	// Store session data in MongoDB
	_, err = h.db.Collection("sessions").InsertOne(r.Context(), bson.M{
		"userId": user.ID,
		"data":   sessionData,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(options)
}

func (h *UserHandler) FinishLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		email string          `json:"email"`
		Data   json.RawMessage `json:"data"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// userID, err := primitive.ObjectIDFromHex(req.UserID)
	// if err != nil {
	// 	http.Error(w, "Invalid user ID", http.StatusBadRequest)
	// 	return
	// }

	user, err := h.userService.GetUserByEmail(req.email)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	webAuthnUser := NewWebAuthnUser(user)

	// Retrieve session data from MongoDB
	var sessionDataDoc struct {
		Data webauthn.SessionData `bson:"data"`
	}
	err = h.db.Collection("sessions").FindOne(r.Context(), bson.M{"userId": user.ID}).Decode(&sessionDataDoc)
	if err != nil {
		http.Error(w, "Session not found", http.StatusBadRequest)
		return
	}
	
	// Delete session data after retrieval
	_, err = h.db.Collection("sessions").DeleteOne(r.Context(), bson.M{"userId": user.ID})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	newReq, err := createNewRequestWithBody(req.Data, r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	_, err = h.webauthn.FinishLogin(webAuthnUser, sessionDataDoc.Data, newReq)
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
		if len(user.Credentials) == 0 {
			http.Error(w, "User not registered", http.StatusUnauthorized)
			return
		}
	} else if req.Action == "login" {
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

func createNewRequestWithBody(data json.RawMessage, originalReq *http.Request) (*http.Request, error) {
	bodyReader := bytes.NewReader(data)
	newReq, err := http.NewRequest(originalReq.Method, originalReq.URL.String(), bodyReader)
	if err != nil {
		return nil, err
	}
	newReq.Header = originalReq.Header
	newReq = newReq.WithContext(originalReq.Context())
	return newReq, nil
}

