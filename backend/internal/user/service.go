package user

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type UserService struct{
	db *mongo.Collection
}

func NewUserService(db *mongo.Collection) *UserService {
    return &UserService{db: db}
}

func (s *UserService) RegisterUser(user *User) error {
    user.CreatedAt = time.Now().Unix()
    _, err := s.db.InsertOne(context.TODO(), user)
    return err
}

func (s *UserService) FindUserByEmail(email string) (*User, error) {
    var user User
    err := s.db.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
    if err != nil {
        return nil, err
    }
    return &user, nil
}

func (s *UserService) AddWebAuthnCredential(userID primitive.ObjectID, cred WebAuthnCredential) error {
    _, err := s.db.UpdateOne(
        context.TODO(),
        bson.M{"_id": userID},
        bson.M{"$push": bson.M{"webauthn_creds": cred}},
    )
    return err
}


// VerifyCredential checks if the provided credential matches the stored WebAuthn credential.
func (s *UserService) VerifyCredential(userID primitive.ObjectID, credentialID string) (*WebAuthnCredential, error) {
    var user User
    err := s.db.FindOne(context.TODO(), bson.M{"_id": userID}).Decode(&user)
    if err != nil {
        return nil, err
    }

    for _, cred := range user.WebAuthnCreds {
        if cred.CredentialID == credentialID {
            return &cred, nil
        }
    }
    return nil, errors.New("credential not found")
}