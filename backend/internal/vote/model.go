package vote

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Vote struct {
	PollID    primitive.ObjectID   `bson:"poll_id" json:"poll_id"`
	UserID    primitive.ObjectID   `bson:"user_id" json:"user_id"`
	OptionIDs []primitive.ObjectID `bson:"option_ids" json:"option_ids"`
	VotedAt   time.Time            `bson:"voted_at" json:"voted_at"`
}