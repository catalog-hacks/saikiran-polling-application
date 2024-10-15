// internal/user/model.go
package user

import (
	"github.com/go-webauthn/webauthn/webauthn"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID             primitive.ObjectID   `bson:"_id" json:"id"`
	Name           string               `bson:"name" json:"name"`
	DisplayName    string               `bson:"display_name" json:"display_name"`
	Email          string               `bson:"email" json:"email"`
	CreatedPolls   []primitive.ObjectID `bson:"created_polls" json:"created_polls"`
	Credentials    []webauthn.Credential `bson:"credentials" json:"credentials"`
}

// WebAuthnUser is an adapter that implements the webauthn.User interface
type WebAuthnUser struct {
	*User
}

func (u *WebAuthnUser) WebAuthnID() []byte {
	return u.ID[:]
}

func (u *WebAuthnUser) WebAuthnName() string {
	return u.Name
}

func (u *WebAuthnUser) WebAuthnDisplayName() string {
	return u.DisplayName
}

func (u *WebAuthnUser) WebAuthnIcon() string {
	return ""
}

func (u *WebAuthnUser) WebAuthnCredentials() []webauthn.Credential {
	return u.Credentials
}

// NewWebAuthnUser creates a new WebAuthnUser from a User
func NewWebAuthnUser(u *User) *WebAuthnUser {
	return &WebAuthnUser{User: u}
}

