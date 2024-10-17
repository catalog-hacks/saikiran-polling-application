package poll

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PollHandler struct {
	pollService *PollService
	clients     map[string]map[chan *Poll]bool
	mutex       sync.RWMutex
}

func NewPollHandler(pollService *PollService) *PollHandler {
	return &PollHandler{
		pollService: pollService,
		clients:     make(map[string]map[chan *Poll]bool),
	}
}

func (h *PollHandler) CreatePoll(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Question        string   `json:"question"`
		Options         []string `json:"options"`
		UserID          string   `json:"user_id"`
		MultipleChoices bool     `json:"multiple_choices"`
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

	poll, err := h.pollService.CreatePoll(r.Context(), req.Question, req.Options, userID, req.MultipleChoices)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(poll)
}

func (h *PollHandler) GetPoll(w http.ResponseWriter, r *http.Request) {
	pollID, err := primitive.ObjectIDFromHex(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid poll ID", http.StatusBadRequest)
		return
	}

	poll, err := h.pollService.GetPoll(r.Context(), pollID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(poll)
}



func (h *PollHandler) Vote(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID    string   `json:"user_id"`
		OptionIDs []string `json:"option_ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	pollID, err := primitive.ObjectIDFromHex(mux.Vars(r)["id"])
	if err != nil {
		http.Error(w, "Invalid poll ID", http.StatusBadRequest)
		return
	}

	userID, err := primitive.ObjectIDFromHex(req.UserID)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	optionIDs := make([]primitive.ObjectID, len(req.OptionIDs))
	for i, id := range req.OptionIDs {
		optionIDs[i], err = primitive.ObjectIDFromHex(id)
		if err != nil {
			http.Error(w, "Invalid option ID", http.StatusBadRequest)
			return
		}
	}

	err = h.pollService.Vote(r.Context(), pollID, userID, optionIDs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch the updated poll
	updatedPoll, err := h.pollService.GetPoll(r.Context(), pollID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Notify all clients subscribed to this poll
	h.notifyClients(pollID.Hex(), updatedPoll)

	w.WriteHeader(http.StatusOK)
}

func (h *PollHandler) StreamPollUpdates(w http.ResponseWriter, r *http.Request) {
	pollID := mux.Vars(r)["id"]

	// Set headers for SSE
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Create a channel for this client
	updateChan := make(chan *Poll)

	// Register the client
	h.mutex.Lock()
	if _, ok := h.clients[pollID]; !ok {
		h.clients[pollID] = make(map[chan *Poll]bool)
	}
	h.clients[pollID][updateChan] = true
	h.mutex.Unlock()

	// Unregister the client when the connection is closed
	defer func() {
		h.mutex.Lock()
		delete(h.clients[pollID], updateChan)
		if len(h.clients[pollID]) == 0 {
			delete(h.clients, pollID)
		}
		h.mutex.Unlock()
	}()

	// Stream updates to the client
	for {
		select {
		case poll := <-updateChan:
			data, err := json.Marshal(poll)
			if err != nil {
				fmt.Fprintf(w, "event: error\ndata: %s\n\n", err.Error())
				return
			}
			fmt.Fprintf(w, "data: %s\n\n", data)
			w.(http.Flusher).Flush()
		case <-r.Context().Done():
			return
		}
	}
}

func (h *PollHandler) notifyClients(pollID string, poll *Poll) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	if clients, ok := h.clients[pollID]; ok {
		for clientChan := range clients {
			select {
			case clientChan <- poll:
			default:
				// If the channel is full, we skip this client
			}
		}
	}
}
