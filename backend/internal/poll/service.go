package poll

import (
	"context"
	"errors"
	"time"

	"github.com/SaiKiranMatta/nextjs-golang-polling-application/backend/internal/user"
	"github.com/SaiKiranMatta/nextjs-golang-polling-application/backend/internal/vote"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type PollService struct {
	pollCollection *mongo.Collection
	voteService    *vote.VoteService
    userService    *user.UserService
}

func NewPollService(db *mongo.Database, voteService *vote.VoteService, userService *user.UserService) *PollService {
	return &PollService{
		pollCollection: db.Collection("polls"),
		voteService:    voteService,
        userService:    userService,
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
		MultipleChoices: multipleChoices,
		Active:          true,
	}

	_, err := s.pollCollection.InsertOne(ctx, poll)
	if err != nil {
		return nil, err
	}

    user, err := s.userService.GetUser(createdBy)
    if err != nil {
        return nil, err
    }

    user.CreatedPolls = append(user.CreatedPolls, poll.ID)

    err = s.userService.UpdateUser(user)
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

func (s *PollService) GetPollsByUser(ctx context.Context, userID primitive.ObjectID) ([]Poll, error) {
    var polls []Poll
    filter := bson.M{"created_by": userID}
    cursor, err := s.pollCollection.Find(ctx, filter)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    if err := cursor.All(ctx, &polls); err != nil {
        return nil, err
    }
    return polls, nil
}

func (s *PollService) Vote(ctx context.Context, pollID, userID primitive.ObjectID, optionIDs []primitive.ObjectID) error {
	poll, err := s.GetPoll(ctx, pollID)
	if err != nil {
		return err
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

	// Use VoteService to add the vote
	err = s.voteService.AddVote(ctx, pollID, userID, optionIDs)
	if err != nil {
		return err
	}

	// Increment vote count for the selected options
	update := bson.M{
		"$inc": bson.M{
			"options.$[elem].count": 1,
		},
	}

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
