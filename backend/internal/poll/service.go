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

func (s *PollService) CreatePoll(ctx context.Context, question string, description string, options []string, createdBy primitive.ObjectID, multipleChoices bool) (*Poll, error) {
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
        Description:     description,
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

	existingVote, err := s.voteService.GetVote(ctx, pollID, userID)
    if err != nil && err != mongo.ErrNoDocuments {
        return err
    }

    if existingVote != nil {
        // User has already voted; update their vote
        return s.updateVote(ctx, existingVote, optionIDs)
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

func (s *PollService) updateVote(ctx context.Context, existingVote *vote.Vote, newOptionIDs []primitive.ObjectID) error {
    // Decrease counts for the old options
    update := bson.M{
        "$inc": bson.M{
            "options.$[oldElem].count": -1,
        },
    }

    _, err := s.pollCollection.UpdateOne(
        ctx,
        bson.M{"_id": existingVote.PollID},
        update,
        options.Update().SetArrayFilters(
            options.ArrayFilters{
                Filters: []interface{}{
                    bson.M{"oldElem._id": bson.M{"$in": existingVote.OptionIDs}},
                },
            },
        ),
    )
    if err != nil {
        return err
    }

    // Create and insert the new vote
    err = s.voteService.UpdateVote(ctx, existingVote, newOptionIDs)
    if err != nil {
        return err
    }

    // Increase counts for the new options
    update = bson.M{
        "$inc": bson.M{
            "options.$[newElem].count": 1,
        },
    }

    _, err = s.pollCollection.UpdateOne(
        ctx,
        bson.M{"_id": existingVote.PollID},
        update,
        options.Update().SetArrayFilters(
            options.ArrayFilters{
                Filters: []interface{}{
                    bson.M{"newElem._id": bson.M{"$in": newOptionIDs}},
                },
            },
        ),
    )

    return err
}

func (s *PollService) UpdatePollStatus(ctx context.Context, pollID primitive.ObjectID, userID primitive.ObjectID, active bool) error {
    poll, err := s.GetPoll(ctx, pollID)

    if poll.CreatedBy != userID {
        return errors.New("unauthorized: user is not the creator of the poll")
    }

    filter := bson.M{"_id": pollID}
    update := bson.M{
        "$set": bson.M{
            "active": active,
        },
    }

    result, err := s.pollCollection.UpdateOne(ctx, filter, update)
    if err != nil {
        return err
    }

    if result.MatchedCount == 0 {
        return errors.New("poll not found")
    }

    return nil
}



// Update this method in PollService struct in poll/service.go
func (s *PollService) ClearPollVotes(ctx context.Context, pollID primitive.ObjectID, userID primitive.ObjectID) error {
    poll, err := s.GetPoll(ctx, pollID)

    if poll.CreatedBy != userID {
        return errors.New("unauthorized: user is not the creator of the poll")
    }

    filter := bson.M{"_id": pollID}
    update := bson.M{
        "$set": bson.M{
            "options.$[].count": 0,
        },
    }
    
    result, err := s.pollCollection.UpdateOne(ctx, filter, update)
    if err != nil {
        return err
    }
    if result.MatchedCount == 0 {
        return errors.New("poll not found")
    }

    _, err = s.voteService.DeletePollVotes(ctx, pollID)
    if err != nil {
        return err
    }

    return nil
}

func (s *PollService) GetAllPolls(ctx context.Context, status string, skip int, limit int) ([]*Poll, int64, error) {
    
    
    // Build the filter based on status
    filter := bson.M{}
    if status == "active" {
        filter["active"] = true
    } else if status == "closed" {
        filter["active"] = false
    }
    
    // Get total count for pagination
    total, err := s.pollCollection.CountDocuments(ctx, filter)
    if err != nil {
        return nil, 0, err
    }
    
    // Set up options for pagination and sorting
    opts := options.Find().
        SetSkip(int64(skip)).
        SetLimit(int64(limit)).
        SetSort(bson.D{{Key: "created_at", Value: -1}}) // Sort by creation date, newest first
    
    // Execute the query
    cursor, err := s.pollCollection.Find(ctx, filter, opts)
    if err != nil {
        return nil, 0, err
    }
    defer cursor.Close(ctx)
    
    // Decode the results
    var polls []*Poll
    if err = cursor.All(ctx, &polls); err != nil {
        return nil, 0, err
    }
    
        return polls, total, nil
}


// GetActivePollsCount returns the total number of active polls
func (s *PollService) GetActivePollsCount(ctx context.Context) (int64, error) {
    return s.pollCollection.CountDocuments(ctx, bson.M{"active": true})
}

// GetClosedPollsCount returns the total number of closed polls
func (s *PollService) GetClosedPollsCount(ctx context.Context) (int64, error) {
    return s.pollCollection.CountDocuments(ctx, bson.M{"active": false})
}

// GetTotalPollsCount returns the total number of polls
func (s *PollService) GetTotalPollsCount(ctx context.Context) (int64, error) {
    return s.pollCollection.CountDocuments(ctx, bson.M{})
}