package session

import (
	"github.com/go-webauthn/webauthn/webauthn"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SessionData struct {
	UserID primitive.ObjectID `bson:"userId"`
	Data   webauthn.SessionData `bson:"data"`
}
