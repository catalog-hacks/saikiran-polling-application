package session

import (
	"context"

	"github.com/go-webauthn/webauthn/webauthn"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type SessionService struct {
	db *mongo.Collection
}

func NewSessionService(db *mongo.Database) *SessionService {
	return &SessionService{
		db: db.Collection("sessions"),
	}
}

func (s *SessionService) CreateSession(ctx context.Context, userID primitive.ObjectID, sessionData webauthn.SessionData) error {
	_, err := s.db.InsertOne(ctx, bson.M{
		"userId": userID,
		"data":   sessionData,
	})
	return err
}

func (s *SessionService) GetSession(ctx context.Context, userID primitive.ObjectID) (*SessionData, error) {
	var sessionData SessionData
	err := s.db.FindOne(ctx, bson.M{"userId": userID}).Decode(&sessionData)
	return &sessionData, err
}

func (s *SessionService) DeleteSession(ctx context.Context, userID primitive.ObjectID) error {
	_, err := s.db.DeleteOne(ctx, bson.M{"userId": userID})
	return err
}

func (s *SessionService) DeleteSessionsByUserID(ctx context.Context, userID primitive.ObjectID) error {
	_, err := s.db.DeleteMany(ctx, bson.M{"userId": userID})
	return err
}
