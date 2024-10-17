package vote

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type VoteService struct {
	voteCollection *mongo.Collection
}

func NewVoteService(db *mongo.Database) *VoteService {
	return &VoteService{
		voteCollection: db.Collection("votes"),
	}
}

func (s *VoteService) AddVote(ctx context.Context, pollID, userID primitive.ObjectID, optionIDs []primitive.ObjectID) error {
	// Check if user has already voted for this poll
	count, err := s.voteCollection.CountDocuments(ctx, bson.M{
		"poll_id": pollID,
		"user_id": userID,
	})
	if err != nil {
		return err
	}
	if count > 0 {
		return errors.New("user has already voted")
	}

	// Create and insert the vote
	vote := &Vote{
		UserID:    userID,
		OptionIDs: optionIDs,
		VotedAt:   time.Now(),
	}

	_, err = s.voteCollection.InsertOne(ctx, vote)
	if err != nil {
		return err
	}

	return nil
}

func (s *VoteService) GetVotesForPoll(ctx context.Context, pollID primitive.ObjectID) ([]Vote, error) {
	cursor, err := s.voteCollection.Find(ctx, bson.M{"poll_id": pollID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var votes []Vote
	if err = cursor.All(ctx, &votes); err != nil {
		return nil, err
	}

	return votes, nil
}
