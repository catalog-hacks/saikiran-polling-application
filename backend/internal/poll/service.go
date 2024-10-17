package poll

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type PollService struct {
	pollCollection *mongo.Collection
}

func NewPollService(db *mongo.Database) *PollService {
	return &PollService{
		pollCollection: db.Collection("polls"),
	}
}

func (s *PollService) CreatePoll(ctx context.Context, question string, options []string, createdBy primitive.ObjectID, multipleChoices bool) (*Poll, error) {
	pollOptions := make([]Option, len(options))
	for i, opt := range options {
		pollOptions[i] = Option{
			ID:    primitive.NewObjectID(),
			Text:  opt,
			Count: 0,
		}
	}

	poll := &Poll{
		ID:              primitive.NewObjectID(),
		Question:        question,
		Options:         pollOptions,
		CreatedBy:       createdBy,
		CreatedAt:       time.Now(),
		Votes:           []Vote{},
		MultipleChoices: multipleChoices,
		Active: true,
	}

	_, err := s.pollCollection.InsertOne(ctx, poll)
	if err != nil {
		return nil, err
	}

	return poll, nil
}

func (s *PollService) GetPoll(ctx context.Context, pollID primitive.ObjectID) (*Poll, error) {
	var poll Poll
	err := s.pollCollection.FindOne(ctx, bson.M{"_id": pollID}).Decode(&poll)
	if err != nil {
		return nil, err
	}
	return &poll, nil
}

// internal/poll/service.go

func (s *PollService) Vote(ctx context.Context, pollID, userID primitive.ObjectID, optionIDs []primitive.ObjectID) error {
    poll, err := s.GetPoll(ctx, pollID)
    if err != nil {
        return err
    }

    // Check if user has already voted
    for _, vote := range poll.Votes {
        if vote.UserID == userID {
            return errors.New("user has already voted")
        }
    }

    // Validate option IDs
    validOptionIDs := make(map[primitive.ObjectID]bool)
    for _, opt := range poll.Options {
        validOptionIDs[opt.ID] = true
    }

    for _, optionID := range optionIDs {
        if !validOptionIDs[optionID] {
            return errors.New("invalid option ID")
        }
    }

    if !poll.MultipleChoices && len(optionIDs) > 1 {
        return errors.New("multiple choices not allowed for this poll")
    }

    // Prepare the update operation
    update := bson.M{
        "$push": bson.M{
            "votes": Vote{
                UserID:    userID,
                OptionIDs: optionIDs,
                VotedAt:   time.Now(),
            },
        },
        "$inc": bson.M{
            "options.$[elem].count": 1,
        },
    }

    // Execute the update operation in a single call
    _, err = s.pollCollection.UpdateOne(
        ctx,
        bson.M{"_id": pollID},
        update,
        options.Update().SetArrayFilters(
            options.ArrayFilters{
                Filters: []interface{}{
                    bson.M{"elem._id": bson.M{"$in": optionIDs}},
                },
            },
        ),
    )

    if err != nil {
        return err
    }

    return nil
}
