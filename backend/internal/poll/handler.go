package poll

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/SaiKiranMatta/nextjs-golang-polling-application/backend/internal/vote"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
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


type PollWithUserVote struct {
    *Poll
    UserVote *vote.UserVoteResponse `json:"user_vote"`
}

func (h *PollHandler) GetPoll(w http.ResponseWriter, r *http.Request) {
    pollID, err := primitive.ObjectIDFromHex(mux.Vars(r)["id"])
    if err != nil {
        http.Error(w, "Invalid poll ID", http.StatusBadRequest)
        return
    }

    // Get user ID from query parameter
    userIDStr := r.URL.Query().Get("userId")
    userID, err := primitive.ObjectIDFromHex(userIDStr)
    if err != nil {
        http.Error(w, "Invalid user ID", http.StatusBadRequest)
        return
    }

    poll, err := h.pollService.GetPoll(r.Context(), pollID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    // Get user's vote
    userVote, err := h.pollService.voteService.GetUserVote(r.Context(), pollID, userID)
    if err != nil && err != mongo.ErrNoDocuments {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    response := PollWithUserVote{
        Poll:     poll,
        UserVote: &userVote,
    }

    json.NewEncoder(w).Encode(response)
}

func (h *PollHandler) GetPollsByUser(w http.ResponseWriter, r *http.Request) {
    userIDStr := r.URL.Query().Get("userId")
    if userIDStr == "" {
        http.Error(w, "User ID is required", http.StatusBadRequest)
        return
    }

    userID, err := primitive.ObjectIDFromHex(userIDStr)
    if err != nil {
        http.Error(w, "Invalid user ID", http.StatusBadRequest)
        return
    }

    polls, err := h.pollService.GetPollsByUser(r.Context(), userID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(polls)
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
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
        return
    }

    // Create a channel for this client with a buffer
    updateChan := make(chan *Poll, 10)

    // Register the client
    h.mutex.Lock()
    if _, ok := h.clients[pollID]; !ok {
        h.clients[pollID] = make(map[chan *Poll]bool)
    }
    h.clients[pollID][updateChan] = true
    h.mutex.Unlock()

    // Create keep-alive ticker
    ticker := time.NewTicker(15 * time.Second)
    defer ticker.Stop()

    // Clean up on connection close
    go func() {
        <-r.Context().Done()
        ticker.Stop()
        h.mutex.Lock()
        delete(h.clients[pollID], updateChan)
        if len(h.clients[pollID]) == 0 {
            delete(h.clients, pollID)
        }
        h.mutex.Unlock()
        close(updateChan)
    }()

    // Send initial connection message
    fmt.Fprintf(w, "data: {\"status\": \"connected\"}\n\n")
    flusher.Flush()

    // Stream updates to the client
    for {
        select {
        case poll, ok := <-updateChan:
            if !ok {
                return
            }
            
            data, err := json.Marshal(poll)
            if err != nil {
                fmt.Fprintf(w, "event: error\ndata: %s\n\n", err.Error())
                flusher.Flush()
                return
            }

            _, err = fmt.Fprintf(w, "data: %s\n\n", data)
            if err != nil {
                return
            }
            flusher.Flush()

        case <-ticker.C:
            // Send keep-alive message
            _, err := fmt.Fprintf(w, ": keepalive\n\n")
            if err != nil {
                log.Printf("Error sending keepalive: %v", err)
                return
            }
            flusher.Flush()

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
                // Successfully sent
            default:
                // Channel is full, log it
                log.Printf("Warning: Client channel for poll %s is full, skipping update", pollID)
            }
        }
    }
}


type PollStatusUpdateRequest struct {
    Active bool `json:"active"` // The new status (true for enable, false for disable)
    UserID primitive.ObjectID `json:"userId"`
}

// TogglePollStatus handles enabling/disabling a poll
func (h *PollHandler) TogglePollStatus(w http.ResponseWriter, r *http.Request) {
    // Get poll ID from the URL parameters
    pollID, err := primitive.ObjectIDFromHex(mux.Vars(r)["id"])
    if err != nil {
        http.Error(w, "Invalid poll ID", http.StatusBadRequest)
        return
    }

    // Parse the request body to get the new status
    var req PollStatusUpdateRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    // Call the poll service to update the poll status
    err = h.pollService.UpdatePollStatus(r.Context(), pollID,req.UserID, req.Active)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    updatedPoll, err := h.pollService.GetPoll(r.Context(), pollID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Notify all clients subscribed to this poll
	h.notifyClients(pollID.Hex(), updatedPoll)

    // Respond with a success message
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{
        "message": "Poll status updated successfully",
    })
}

func (h *PollHandler) ClearPollVotes(w http.ResponseWriter, r *http.Request) {
    pollID, err := primitive.ObjectIDFromHex(mux.Vars(r)["id"])
    if err != nil {
        http.Error(w, "Invalid poll ID", http.StatusBadRequest)
        return
    }

    var requestBody struct {
        UserID primitive.ObjectID `json:"userId"`
    }

    err = json.NewDecoder(r.Body).Decode(&requestBody)
    if err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    err = h.pollService.ClearPollVotes(r.Context(), pollID, requestBody.UserID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    updatedPoll, err := h.pollService.GetPoll(r.Context(), pollID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    h.notifyClients(pollID.Hex(), updatedPoll)

    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{
        "message": "Poll votes cleared successfully",
    })
}
