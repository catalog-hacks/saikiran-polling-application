package user

import (
	"context"
	"testing"
	"time"

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

func TestUserService_CreateUser(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	service := NewUserService(db)

	t.Run("successful user creation", func(t *testing.T) {
		user := &User{
			ID:          primitive.NewObjectID(),
			Name:        "John Doe",
			DisplayName: "johndoe",
			Email:       "john@example.com",
		}

		err := service.CreateUser(user)
		assert.NoError(t, err)

		// Verify user was created
		var savedUser User
		err = db.Collection("users").FindOne(context.Background(), bson.M{"_id": user.ID}).Decode(&savedUser)
		assert.NoError(t, err)
		assert.Equal(t, user.Name, savedUser.Name)
		assert.Equal(t, user.Email, savedUser.Email)
	})

	t.Run("duplicate email", func(t *testing.T) {
		user1 := &User{
			ID:    primitive.NewObjectID(),
			Email: "same@example.com",
		}
		user2 := &User{
			ID:    primitive.NewObjectID(),
			Email: "same@example.com",
		}

		// Create index for unique email
		_, err := db.Collection("users").Indexes().CreateOne(context.Background(), mongo.IndexModel{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		})
		require.NoError(t, err)

		err = service.CreateUser(user1)
		assert.NoError(t, err)

		err = service.CreateUser(user2)
		assert.Error(t, err) // Should fail due to duplicate email
	})
}

func TestUserService_GetUser(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	service := NewUserService(db)

	t.Run("get existing user", func(t *testing.T) {
		user := &User{
			ID:          primitive.NewObjectID(),
			Name:        "Jane Doe",
			DisplayName: "janedoe",
			Email:       "jane@example.com",
		}

		_, err := db.Collection("users").InsertOne(context.Background(), user)
		require.NoError(t, err)

		foundUser, err := service.GetUser(user.ID)
		assert.NoError(t, err)
		assert.Equal(t, user.ID, foundUser.ID)
		assert.Equal(t, user.Name, foundUser.Name)
		assert.Equal(t, user.Email, foundUser.Email)
	})

	t.Run("user not found", func(t *testing.T) {
		nonExistentID := primitive.NewObjectID()
		_, err := service.GetUser(nonExistentID)
		assert.Error(t, err)
		assert.Equal(t, "user not found", err.Error())
	})
}

func TestUserService_GetUserByEmail(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	service := NewUserService(db)

	t.Run("get existing user by email", func(t *testing.T) {
		user := &User{
			ID:          primitive.NewObjectID(),
			Name:        "Bob Smith",
			DisplayName: "bobsmith",
			Email:       "bob@example.com",
		}

		_, err := db.Collection("users").InsertOne(context.Background(), user)
		require.NoError(t, err)

		foundUser, err := service.GetUserByEmail(user.Email)
		assert.NoError(t, err)
		assert.Equal(t, user.ID, foundUser.ID)
		assert.Equal(t, user.Name, foundUser.Name)
		assert.Equal(t, user.Email, foundUser.Email)
	})

	t.Run("email not found", func(t *testing.T) {
		_, err := service.GetUserByEmail("nonexistent@example.com")
		assert.Error(t, err)
		assert.Equal(t, "user not found", err.Error())
	})
}

func TestUserService_UpdateUser(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	service := NewUserService(db)

	t.Run("successful update", func(t *testing.T) {
		user := &User{
			ID:          primitive.NewObjectID(),
			Name:        "Original Name",
			DisplayName: "original",
			Email:       "original@example.com",
		}

		_, err := db.Collection("users").InsertOne(context.Background(), user)
		require.NoError(t, err)

		// Update user
		user.Name = "Updated Name"
		user.DisplayName = "updated"
		err = service.UpdateUser(user)
		assert.NoError(t, err)

		// Verify update
		var updatedUser User
		err = db.Collection("users").FindOne(context.Background(), bson.M{"_id": user.ID}).Decode(&updatedUser)
		assert.NoError(t, err)
		assert.Equal(t, "Updated Name", updatedUser.Name)
		assert.Equal(t, "updated", updatedUser.DisplayName)
	})

	t.Run("update non-existent user", func(t *testing.T) {
		nonExistentUser := &User{
			ID:   primitive.NewObjectID(),
			Name: "Non Existent",
		}

		err := service.UpdateUser(nonExistentUser)
		assert.NoError(t, err) // MongoDB UpdateOne doesn't return error if document not found
	})
}