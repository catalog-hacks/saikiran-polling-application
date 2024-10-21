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
		PollID: pollID,
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

type UserVoteResponse struct {
	OptionIDs []primitive.ObjectID `json:"option_ids"`
}


func (s *VoteService) GetUserVote(ctx context.Context, pollID, userID primitive.ObjectID) (UserVoteResponse, error) {
	// Find the vote document for the given user and poll
	var vote Vote
	err := s.voteCollection.FindOne(ctx, bson.M{
		"poll_id": pollID,
		"user_id": userID,
	}).Decode(&vote)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return UserVoteResponse{OptionIDs: []primitive.ObjectID{}}, err
		}
		return UserVoteResponse{}, err
	}

	return UserVoteResponse{OptionIDs: vote.OptionIDs}, nil
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

func (s *VoteService) GetVote(ctx context.Context, pollID, userID primitive.ObjectID) (*Vote, error) {
    var vote Vote
    err := s.voteCollection.FindOne(ctx, bson.M{
        "poll_id": pollID,
        "user_id": userID,
    }).Decode(&vote)

    if err != nil {
        return nil, err
    }

    return &vote, nil
}

func (s *VoteService) UpdateVote(ctx context.Context, existingVote *Vote, newOptionIDs []primitive.ObjectID) error {
    filter := bson.M{
        "poll_id": existingVote.PollID,
        "user_id": existingVote.UserID,
    }
    update := bson.M{
        "$set": bson.M{
            "option_ids": newOptionIDs,
            "voted_at":   time.Now(),
        },
    }

    _, err := s.voteCollection.UpdateOne(ctx, filter, update)
    return err
}


func (s *VoteService) DeletePollVotes(ctx context.Context, pollID primitive.ObjectID) (*mongo.DeleteResult, error) {
    return s.voteCollection.DeleteMany(ctx, bson.M{"poll_id": pollID})
}