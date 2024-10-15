package user

import (
	"fmt"
	"sync"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserService struct {
	users map[string]*User
	mu    sync.RWMutex
}

func NewUserService() *UserService {
	return &UserService{
		users: make(map[string]*User),
	}
}

func (s *UserService) GetUser(id primitive.ObjectID) (*User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	user, ok := s.users[id.Hex()]
	if !ok {
		return nil, fmt.Errorf("user not found")
	}
	return user, nil
}

func (s *UserService) CreateUser(user *User) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.users[user.ID.Hex()] = user
	return nil
}

func (s *UserService) UpdateUser(user *User) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.users[user.ID.Hex()] = user
	return nil
}

func (s *UserService) GetUserByEmail(email string) (*User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, user := range s.users {
		if user.Email == email {
			return user, nil
		}
	}
	return nil, fmt.Errorf("user not found")
}