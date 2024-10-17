package poll

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Poll struct {
	ID        primitive.ObjectID   `bson:"_id" json:"id"`
	Question  string               `bson:"question" json:"question"`
	Options   []Option             `bson:"options" json:"options"`
	CreatedBy primitive.ObjectID   `bson:"created_by" json:"created_by"`
	CreatedAt time.Time            `bson:"created_at" json:"created_at"`
	Votes     []Vote               `bson:"votes" json:"votes"`
	MultipleChoices bool           `bson:"multiple_choices" json:"multiple_choices"`
	Active     bool                `bson:"active" json:"active"`
}

type Option struct {
	ID    primitive.ObjectID `bson:"_id" json:"id"`
	Text  string             `bson:"text" json:"text"`
	Count int                `bson:"count" json:"count"`
}

type Vote struct {
	UserID    primitive.ObjectID   `bson:"user_id" json:"user_id"`
	OptionIDs []primitive.ObjectID `bson:"option_ids" json:"option_ids"`
	VotedAt   time.Time            `bson:"voted_at" json:"voted_at"`
}