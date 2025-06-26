# Standard library imports
from flask import request, session, make_response, jsonify
from flask_restful import Resource
import traceback
import os
from functools import wraps # For creating decorators

# Local imports
from config import app, db, api, bcrypt
from models import User, Letter, TimeCapsule, UserNote, SoulNote

# Define a custom error for validation issues
class ValidationError(Exception):
    pass

# --- Decorator for Login Protection ---
def login_required(f):
    """
    Decorator to protect routes, ensuring only logged-in users can access them.
    Checks for 'user_id' in session.
    """
    @wraps(f) # Helps preserve original function's metadata
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            # If no user_id in session, return a 401 Unauthorized response
            return make_response(
                jsonify({"errors": "Unauthorized: Please log in to access this resource."}),
                401
            )
        return f(*args, **kwargs)
    return decorated_function

# --- Root Route ---
@app.route('/')
def index():
    """
    Root route for the API.
    Used to confirm the server is running.
    """
    return '<h1>SoulSpace API</h1>'

# --- Resource for Handling Errors (Keep existing) ---
@app.errorhandler(ValidationError)
def handle_validation_error(e):
    """Custom error handler for ValidationError."""
    return make_response(jsonify({"errors": str(e)}), 400)

@app.errorhandler(401)
def handle_unauthorized(e):
    """Custom error handler for 401 Unauthorized errors."""
    return make_response(jsonify({"errors": "Unauthorized: Please log in."}), 401)

@app.errorhandler(403)
def handle_forbidden(e):
    """Custom error handler for 403 Forbidden errors."""
    return make_response(jsonify({"errors": "Forbidden: You do not have permission to access this resource."}), 403)

@app.errorhandler(404)
def handle_not_found(e):
    """Custom error handler for 404 Not Found errors."""
    return make_response(jsonify({"errors": "Resource not found."}), 404)

@app.errorhandler(500)
def handle_internal_server_error(e):
    """Custom error handler for 500 Internal Server Errors."""
    if app.debug:
        print(traceback.format_exc())
    return make_response(jsonify({"errors": "An internal server error occurred."}), 500)

# --- Authentication Resources (Keep existing) ---
class Signup(Resource):
    """Handles user registration (signup)."""
    def post(self):
        try:
            data = request.get_json()
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            password_confirmation = data.get('password_confirmation')

            if not all([username, email, password, password_confirmation]):
                raise ValidationError("All fields are required: username, email, password, password confirmation.")
            if password != password_confirmation:
                raise ValidationError("Passwords do not match.")

            new_user = User(username=username, email=email)
            new_user.password_hash = password

            db.session.add(new_user)
            db.session.commit()

            session['user_id'] = new_user.id
            return new_user.to_dict(), 201
        except ValueError as ve:
            db.session.rollback()
            return make_response(jsonify({"errors": str(ve)}), 400)
        except Exception as e:
            db.session.rollback()
            if app.debug: print(f"An unexpected error occurred during signup: {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to create user: An unexpected error occurred."}), 500)
api.add_resource(Signup, '/signup')

class Login(Resource):
    """Handles user login."""
    def post(self):
        try:
            data = request.get_json()
            identifier = data.get('identifier')
            password = data.get('password')

            if not all([identifier, password]):
                raise ValidationError("Identifier (username or email) and password are required.")

            user = User.query.filter((User.username == identifier) | (User.email == identifier)).first()

            if not user or not user.authenticate(password):
                return make_response(jsonify({"errors": "Invalid identifier or password."}), 401)

            session['user_id'] = user.id
            return user.to_dict(), 200
        except Exception as e:
            if app.debug: print(f"An unexpected error occurred during login: {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Login failed: An unexpected error occurred."}), 500)
api.add_resource(Login, '/login')

class CheckSession(Resource):
    """Checks if a user is currently logged in."""
    def get(self):
        user_id = session.get('user_id')
        if user_id:
            user = User.query.filter_by(id=user_id).first()
            if user:
                return user.to_dict(), 200
            else:
                session.pop('user_id', None)
                return make_response(jsonify({"errors": "User not found."}), 401)
        return make_response(jsonify({"errors": "No active session."}), 401)
api.add_resource(CheckSession, '/check_session')

class Logout(Resource):
    """Handles user logout."""
    def delete(self):
        session.pop('user_id', None)
        return make_response(jsonify({"message": "Successfully logged out."}), 204)
api.add_resource(Logout, '/logout')

# --- Letters Unsent Resources ---

class LettersResource(Resource):
    """
    Handles GET for all letters of the logged-in user, and POST for creating a new letter.
    """
    decorators = [login_required] # Apply login_required decorator to all methods in this class

    def get(self):
        """Get all letters for the current user."""
        try:
            user_id = session['user_id']
            # Fetch letters associated with the logged-in user, ordered by creation date (newest first)
            letters = Letter.query.filter_by(user_id=user_id).order_by(Letter.created_at.desc()).all()
            return [letter.to_dict() for letter in letters], 200
        except Exception as e:
            if app.debug: print(f"Error fetching letters: {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to fetch letters."}), 500)

    def post(self):
        """Create a new letter for the current user."""
        try:
            user_id = session['user_id']
            data = request.get_json()
            title = data.get('title')
            content = data.get('content')

            if not all([title, content]):
                raise ValidationError("Title and content are required for a letter.")

            new_letter = Letter(
                user_id=user_id,
                title=title,
                content=content
            )
            db.session.add(new_letter)
            db.session.commit()
            return new_letter.to_dict(), 201
        except ValueError as ve: # Catch validation errors from models (e.g., title/content constraints)
            db.session.rollback()
            return make_response(jsonify({"errors": str(ve)}), 400)
        except Exception as e:
            db.session.rollback()
            if app.debug: print(f"Error creating letter: {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to create letter."}), 500)

api.add_resource(LettersResource, '/letters')


class LetterByIdResource(Resource):
    """
    Handles GET, PATCH, and DELETE for a specific letter by its ID.
    Ensures the letter belongs to the logged-in user.
    """
    decorators = [login_required] # Apply login_required decorator

    def get(self, id):
        """Get a specific letter by ID."""
        try:
            user_id = session['user_id']
            letter = Letter.query.filter_by(id=id, user_id=user_id).first()
            if not letter:
                return make_response(jsonify({"errors": "Letter not found or unauthorized."}), 404)
            return letter.to_dict(), 200
        except Exception as e:
            if app.debug: print(f"Error fetching letter (ID: {id}): {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to fetch letter."}), 500)

    def patch(self, id):
        """Update a specific letter by ID."""
        try:
            user_id = session['user_id']
            letter = Letter.query.filter_by(id=id, user_id=user_id).first()
            if not letter:
                return make_response(jsonify({"errors": "Letter not found or unauthorized."}), 404)

            data = request.get_json()
            # Only update provided fields
            if 'title' in data:
                letter.title = data['title']
            if 'content' in data:
                letter.content = data['content']
            
            db.session.commit()
            return letter.to_dict(), 200
        except ValueError as ve: # Catch validation errors from models
            db.session.rollback()
            return make_response(jsonify({"errors": str(ve)}), 400)
        except Exception as e:
            db.session.rollback()
            if app.debug: print(f"Error updating letter (ID: {id}): {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to update letter."}), 500)

    def delete(self, id):
        """Delete a specific letter by ID."""
        try:
            user_id = session['user_id']
            letter = Letter.query.filter_by(id=id, user_id=user_id).first()
            if not letter:
                return make_response(jsonify({"errors": "Letter not found or unauthorized."}), 404)

            db.session.delete(letter)
            db.session.commit()
            return make_response(jsonify({"message": "Letter deleted successfully."}), 204)
        except Exception as e:
            db.session.rollback()
            if app.debug: print(f"Error deleting letter (ID: {id}): {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to delete letter."}), 500)

api.add_resource(LetterByIdResource, '/letters/<int:id>') # Route with ID parameter

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5555))
    app.run(port=port, debug=True)
