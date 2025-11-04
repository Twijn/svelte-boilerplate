#!/bin/bash

# Simple script to make a user an admin
# Usage: ./make-admin.sh <username>

if [ $# -eq 0 ]; then
    echo "Usage: ./make-admin.sh <username>"
    echo "Example: ./make-admin.sh tylert"
    exit 1
fi

USERNAME=$1

echo "🔧 Making user '$USERNAME' an administrator..."

# Check if user exists
USER_EXISTS=$(docker exec svelte-boilerplate-db-1 psql -U root -d local -t -c "SELECT COUNT(*) FROM \"user\" WHERE username = '$USERNAME';")

if [ "$USER_EXISTS" -eq 0 ]; then
    echo "❌ User '$USERNAME' not found!"
    exit 1
fi

# Get user ID
USER_ID=$(docker exec svelte-boilerplate-db-1 psql -U root -d local -t -c "SELECT id FROM \"user\" WHERE username = '$USERNAME';")
USER_ID=$(echo $USER_ID | xargs) # trim whitespace

# Check if user already has admin role
EXISTING_ROLE=$(docker exec svelte-boilerplate-db-1 psql -U root -d local -t -c "SELECT COUNT(*) FROM user_role WHERE user_id = '$USER_ID' AND role_id = 'admin';")

if [ "$EXISTING_ROLE" -gt 0 ]; then
    echo "ℹ️  User '$USERNAME' is already an administrator!"
    exit 0
fi

# Generate random ID for the role assignment
ASSIGNMENT_ID=$(openssl rand -hex 12)

# Assign admin role
docker exec svelte-boilerplate-db-1 psql -U root -d local -c "
INSERT INTO user_role (id, user_id, role_id, assigned_at) 
VALUES ('$ASSIGNMENT_ID', '$USER_ID', 'admin', NOW());
"

if [ $? -eq 0 ]; then
    echo "✅ Successfully made '$USERNAME' an administrator!"
    
    # Show user's current roles
    echo ""
    echo "📋 User's current roles:"
    docker exec svelte-boilerplate-db-1 psql -U root -d local -c "
    SELECT u.username, u.first_name, r.name as role_name 
    FROM \"user\" u 
    JOIN user_role ur ON u.id = ur.user_id 
    JOIN role r ON ur.role_id = r.id 
    WHERE u.username = '$USERNAME';
    "
else
    echo "❌ Failed to assign admin role!"
    exit 1
fi