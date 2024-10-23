.PHONY: frontend backend all install-frontend

# Set paths to frontend and backend
FRONTEND_DIR := frontend
BACKEND_DIR := backend

# Commands to run the frontend and backend
FRONTEND_CMD := cd $(FRONTEND_DIR) && npm run dev
BACKEND_CMD := cd $(BACKEND_DIR) && make run

# Command to install frontend dependencies
INSTALL_FRONTEND_CMD := cd $(FRONTEND_DIR) && npm install

# Run both frontend and backend simultaneously
all: frontend backend

frontend:
	$(FRONTEND_CMD)

backend:
	$(BACKEND_CMD)

# To run frontend
run-frontend:
	@echo "Starting frontend"
	@$(FRONTEND_CMD)

# To run backend
run-backend:
	@echo "Starting backend"
	@$(BACKEND_CMD)

# To install frontend dependencies
install-frontend:
	@echo "Installing frontend dependencies"
	@$(INSTALL_FRONTEND_CMD)

# Clean up any build artifacts
clean:
	$(MAKE) -C $(FRONTEND_DIR) clean
	$(MAKE) -C $(BACKEND_DIR) clean
