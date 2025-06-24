#!/usr/bin/env python3

# Standard library imports

# Remote library imports
from flask import request, session, make_response, jsonify
from flask_restful import Resource
import traceback
import os

# Local imports
from config import app, db, api, bcrypt
# Add your model imports
from models import User, Letter, TimeCapsule, UserNote, SoulNote


# Views go here!
class ValidationError(Exception):
    pass

@app.route('/')
def index():
    """
    Root route for the API.
    Used to confirm the server is running.
    """
    return '<h1>SoulSpace API</h1>'


@app.errorhandler(ValidationError)
def handle_validation_error(e):
    return make_response(
        jsonify({"errors": str(e)}),
        400
    )

@app.errorhandler(401)
def handle_unauthorized(e):
    """
    Custom error handler for 401 Unauthorized errors.
    """
    return make_response(
        jsonify({"errors": "Unauthorized: Please log in."}),
        401
    )

@app.errorhandler(403)
def handle_forbidden(e):
    return make_response(
        jsonify({"errors": "Forbidden: You do not have permission to access this resource."}),
        403
    )

@app.errorhandler(404)
def handle_not_found(e):
    return make_response(
        jsonify({"errors": "Resource not found."}),
        404
    )

@app.errorhandler(500)
def handle_internal_server_error(e):
    if app.debug:
        print(traceback.format_exc()) 
    return make_response(
        jsonify({"errors": "An internal server error occurred."}),
        500
    )

class Signup(Resource):
    """
    Handles user registration (signup).
    """
    def post(self):
        try:
            data = request.get_json()
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            password_confirmation = data.get('password_confirmation')

            # Basic input validation
            if not all([username, email, password, password_confirmation]):
                raise ValidationError("All fields are required: username, email, password, password confirmation.")
            if password != password_confirmation:
                raise ValidationError("Passwords do not match.")

            # Create new user instance
            new_user = User(
                username=username,
                email=email,
            )
            new_user.password_hash = password

            db.session.add(new_user)
            db.session.commit()

            session['user_id'] = new_user.id

            return new_user.to_dict(), 201 
        except ValueError as ve: 
            db.session.rollback()
            return make_response(
                jsonify({"errors": str(ve)}),
                400
            )
        except Exception as e:
            db.session.rollback()
            if app.debug:
                print(f"An unexpected error occurred during signup: {e}")
                print(traceback.format_exc())
            return make_response(
                jsonify({"errors": "Failed to create user: An unexpected error occurred."}),
                500
            )

api.add_resource(Signup, '/signup')

class Login(Resource):
    """
    Handles user login.
    """
    def post(self):
        """
        Logs in an existing user.
        Expects JSON with 'username' or 'email', and 'password'.
        """
        try:
            data = request.get_json()
            identifier = data.get('identifier') # Can be username or email
            password = data.get('password')

            if not all([identifier, password]):
                raise ValidationError("Identifier (username or email) and password are required.")

            user = User.query.filter(
                (User.username == identifier) | (User.email == identifier)
            ).first()

            if not user:
                return make_response(
                    jsonify({"errors": "Invalid identifier or password."}),
                    401
                )

            if user.authenticate(password):
                session['user_id'] = user.id # Store user ID in session
                return user.to_dict(), 200 # Return user data and 200 OK status
            else:
                return make_response(
                    jsonify({"errors": "Invalid identifier or password."}),
                    401
                )
        except Exception as e:
            # Log the unexpected error for debugging
            if app.debug:
                print(f"An unexpected error occurred during login: {e}")
                print(traceback.format_exc())
            return make_response(
                jsonify({"errors": "Login failed: An unexpected error occurred."}),
                500
            )

api.add_resource(Login, '/login')

class CheckSession(Resource):
    """
    Checks if a user is currently logged in.
    """
    def get(self):
        """
        Returns the logged-in user's data if a session exists, otherwise returns an error.
        """
        user_id = session.get('user_id')
        if user_id:
            user = User.query.filter_by(id=user_id).first()
            if user:
                return user.to_dict(), 200
            else:
                # If user_id is in session but user not found in DB (e.g., deleted account)
                session.pop('user_id', None) # Clear invalid session
                return make_response(
                    jsonify({"errors": "User not found."}),
                    401
                )
        return make_response(
            jsonify({"errors": "No active session."}),
            401
        )

api.add_resource(CheckSession, '/check_session')

class Logout(Resource):
    """
    Handles user logout.
    """
    def delete(self):
        """
        Logs out the current user by clearing the session.
        """
        # Remove user ID from session. .pop() is safer than .clear() if you only want to remove one key.
        session.pop('user_id', None) 
        return make_response(
            jsonify({"message": "Successfully logged out."}),
            204 # 204 No Content for successful deletion/logout
        )

api.add_resource(Logout, '/logout')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5555))
    app.run(port=port, debug=True) 



