package user

import "go.mongodb.org/mongo-driver/bson/primitive"

type User struct {
	Id primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Username string `bson:"username" json:"username"`
	Email string `bson:"email" json:"email"`
	CreatedAt int64 `bson:"created_at" json:"created_at"`
	CreatedPolls []primitive.ObjectID `bson:"created_polls" json:"created_polls"`
	WebAuthCreds []WebAuthCredential `bson:"webauthn_creds" json:"webauthn_creds"`
}


type WebAuthCredential struct {
	ID string `bson:"_id" json:"id"`
	PublicKey []byte `bson:"public_key" json:"public_key"`
	CredentialID string `bson:"credential_id" json:"credential_id"`
	SignCount uint32 `bson:"sign_count" json:"sign_count"`
	AuthenticatorData []byte `bson:"authenticator_data" json:"authenticator_data"`
}

