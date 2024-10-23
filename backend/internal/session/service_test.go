package session

import (
	"context"
	"testing"
	"time"

	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func setupTestDB(t *testing.T) (*mongo.Database, func()) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
	require.NoError(t, err)

	// Create a unique database name for this test run
	dbName := "test_db_" + primitive.NewObjectID().Hex()
	db := client.Database(dbName)

	// Return cleanup function
	cleanup := func() {
		err := db.Drop(context.Background())
		require.NoError(t, err)
		err = client.Disconnect(context.Background())
		require.NoError(t, err)
	}

	return db, cleanup
}

func TestSessionService_CreateSession(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	service := NewSessionService(db)

	t.Run("successful session creation", func(t *testing.T) {
		userID := primitive.NewObjectID()
		sessionData := webauthn.SessionData{
			Challenge: "randomChallenge", // Convert to string
			// add other fields as necessary
		}

		err := service.CreateSession(context.Background(), userID, sessionData)
		assert.NoError(t, err)

		var savedSession SessionData
		err = db.Collection("sessions").FindOne(context.Background(), bson.M{"userId": userID}).Decode(&savedSession)
		assert.NoError(t, err)
		assert.Equal(t, userID, savedSession.UserID)
		assert.Equal(t, sessionData.Challenge, savedSession.Data.Challenge)
	})
}


func TestSessionService_DeleteSession(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	service := NewSessionService(db)

	t.Run("delete existing session", func(t *testing.T) {
		userID := primitive.NewObjectID()
		sessionData := webauthn.SessionData{
			Challenge: "randomChallenge", // Convert to string
			// add other fields as necessary
		}

		_, err := db.Collection("sessions").InsertOne(context.Background(), SessionData{
			UserID: userID,
			Data:   sessionData,
		})
		require.NoError(t, err)

		err = service.DeleteSession(context.Background(), userID)
		assert.NoError(t, err)

		var deletedSession SessionData
		err = db.Collection("sessions").FindOne(context.Background(), bson.M{"userId": userID}).Decode(&deletedSession)
		assert.Error(t, err) // Session should be deleted
	})

	t.Run("delete non-existent session", func(t *testing.T) {
		nonExistentUserID := primitive.NewObjectID()
		err := service.DeleteSession(context.Background(), nonExistentUserID)
		assert.NoError(t, err) // Deleting a non-existent session should not return an error
	})
}

func TestSessionService_DeleteSessionsByUserID(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	
	service := NewSessionService(db)
	t.Run("delete multiple sessions for a user", func(t *testing.T) {
		userID := primitive.NewObjectID()
		sessionData2 := webauthn.SessionData{Challenge: "challenge2"} 
		sessionData1 := webauthn.SessionData{Challenge: "challenge1"}  
		// Insert two sessions
		_, err := db.Collection("sessions").InsertMany(context.Background(), []interface{}{
			SessionData{UserID: userID, Data: sessionData1},
			SessionData{UserID: userID, Data: sessionData2},
		})
		require.NoError(t, err)

		err = service.DeleteSessionsByUserID(context.Background(), userID)
		assert.NoError(t, err)

		count, err := db.Collection("sessions").CountDocuments(context.Background(), bson.M{"userId": userID})
		assert.NoError(t, err)
		assert.Equal(t, int64(0), count) // Should be 0 after deletion
	})

	t.Run("delete sessions for non-existent user", func(t *testing.T) {
		nonExistentUserID := primitive.NewObjectID()
		err := service.DeleteSessionsByUserID(context.Background(), nonExistentUserID)
		assert.NoError(t, err) 
	})
}
