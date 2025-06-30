from flask import request, session, make_response, jsonify
from flask_restful import Resource
import traceback
import os
from functools import wraps
from datetime import datetime
from random import randint, choice

from config import app, db, api, bcrypt
from models import User, Letter, TimeCapsule, UserNote, SoulNote

class ValidationError(Exception):
    pass

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return make_response(
                jsonify({"errors": "Unauthorized: Please log in to access this resource."}),
                401
            )
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    return '<h1>SoulSpace API</h1>'

@app.errorhandler(ValidationError)
def handle_validation_error(e):
    return make_response(jsonify({"errors": str(e)}), 400)

@app.errorhandler(401)
def handle_unauthorized(e):
    return make_response(jsonify({"errors": "Unauthorized: Please log in."}), 401)

@app.errorhandler(403)
def handle_forbidden(e):
    return make_response(jsonify({"errors": "Forbidden: You do not have permission to access this resource."}), 403)

@app.errorhandler(404)
def handle_not_found(e):
    return make_response(jsonify({"errors": "Resource not found."}), 404)

@app.errorhandler(500)
def handle_internal_server_error(e):
    if app.debug: print(traceback.format_exc())
    return make_response(jsonify({"errors": "An internal server error occurred."}), 500)

class Signup(Resource):
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
    def delete(self):
        session.pop('user_id', None)
        return make_response(jsonify({"message": "Successfully logged out."}), 204)
api.add_resource(Logout, '/logout')

# --- Letters Unsent Resources (Keep existing) ---
class LettersResource(Resource):
    decorators = [login_required]
    def get(self):
        try:
            user_id = session['user_id']
            letters = Letter.query.filter_by(user_id=user_id).order_by(Letter.created_at.desc()).all()
            return [letter.to_dict() for letter in letters], 200
        except Exception as e:
            if app.debug: print(f"Error fetching letters: {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to fetch letters."}), 500)

    def post(self):
        try:
            user_id = session['user_id']
            data = request.get_json()
            title = data.get('title')
            content = data.get('content')

            if not all([title, content]):
                raise ValidationError("Title and content are required for a letter.")

            new_letter = Letter(user_id=user_id, title=title, content=content)
            db.session.add(new_letter)
            db.session.commit()
            return new_letter.to_dict(), 201
        except ValueError as ve:
            db.session.rollback()
            return make_response(jsonify({"errors": str(ve)}), 400)
        except Exception as e:
            db.session.rollback()
            if app.debug: print(f"Error creating letter: {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to create letter."}), 500)
api.add_resource(LettersResource, '/letters')

class LetterByIdResource(Resource):
    decorators = [login_required]
    def get(self, id):
        try:
            user_id = session['user_id']
            letter = Letter.query.filter_by(id=id, user_id=user_id).first()
            if not letter: return make_response(jsonify({"errors": "Letter not found or unauthorized."}), 404)
            return letter.to_dict(), 200
        except Exception as e:
            if app.debug: print(f"Error fetching letter (ID: {id}): {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to fetch letter."}), 500)

    def patch(self, id):
        try:
            user_id = session['user_id']
            letter = Letter.query.filter_by(id=id, user_id=user_id).first()
            if not letter: return make_response(jsonify({"errors": "Letter not found or unauthorized."}), 404)

            data = request.get_json()
            if 'title' in data: letter.title = data['title']
            if 'content' in data: letter.content = data['content']
            
            db.session.commit()
            return letter.to_dict(), 200
        except ValueError as ve:
            db.session.rollback()
            return make_response(jsonify({"errors": str(ve)}), 400)
        except Exception as e:
            db.session.rollback()
            if app.debug: print(f"Error updating letter (ID: {id}): {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to update letter."}), 500)

    def delete(self, id):
        try:
            user_id = session['user_id']
            letter = Letter.query.filter_by(id=id, user_id=user_id).first()
            if not letter: return make_response(jsonify({"errors": "Letter not found or unauthorized."}), 404)

            db.session.delete(letter)
            db.session.commit()
            return make_response(jsonify({"message": "Letter deleted successfully."}), 204)
        except Exception as e:
            db.session.rollback()
            if app.debug: print(f"Error deleting letter (ID: {id}): {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to delete letter."}), 500)
api.add_resource(LetterByIdResource, '/letters/<int:id>')

class TimeCapsulesResource(Resource):
    decorators = [login_required]

    def get(self):
        try:
            user_id = session['user_id']
            time_capsules = TimeCapsule.query.filter_by(user_id=user_id).order_by(TimeCapsule.open_date.asc()).all()
            return [tc.to_dict() for tc in time_capsules], 200
        except Exception as e:
            if app.debug: print(f"Error fetching time capsules: {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to fetch time capsules."}), 500)

    def post(self):
        try:
            user_id = session['user_id']
            data = request.get_json()
            message = data.get('message')
            open_date_str = data.get('open_date')

            if not all([message, open_date_str]):
                raise ValidationError("Message and open date are required for a time capsule.")

            try:
                open_date = datetime.fromisoformat(open_date_str)
            except ValueError:
                open_date = datetime.strptime(open_date_str, '%Y-%m-%d')


            new_time_capsule = TimeCapsule(
                user_id=user_id,
                message=message,
                open_date=open_date
            )
            db.session.add(new_time_capsule)
            db.session.commit()
            return new_time_capsule.to_dict(), 201
        except ValueError as ve:
            db.session.rollback()
            return make_response(jsonify({"errors": str(ve)}), 400)
        except Exception as e:
            db.session.rollback()
            if app.debug: print(f"Error creating time capsule: {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to create time capsule."}), 500)
api.add_resource(TimeCapsulesResource, '/time_capsules')


class TimeCapsuleByIdResource(Resource):
    decorators = [login_required]

    def get(self, id):
        try:
            user_id = session['user_id']
            time_capsule = TimeCapsule.query.filter_by(id=id, user_id=user_id).first()
            if not time_capsule:
                return make_response(jsonify({"errors": "Time Capsule not found or unauthorized."}), 404)
            return time_capsule.to_dict(), 200
        except Exception as e:
            if app.debug: print(f"Error fetching time capsule (ID: {id}): {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to fetch time capsule."}), 500)

    def patch(self, id):
        try:
            user_id = session['user_id']
            time_capsule = TimeCapsule.query.filter_by(id=id, user_id=user_id).first()
            if not time_capsule:
                return make_response(jsonify({"errors": "Time Capsule not found or unauthorized."}), 404)

            data = request.get_json()
            if 'message' in data:
                time_capsule.message = data['message']
            if 'open_date' in data:
                try:
                    open_date = datetime.fromisoformat(data['open_date'])
                    time_capsule.open_date = open_date
                except ValueError:
                    return make_response(jsonify({"errors": "Invalid date format for open_date."}), 400)
            
            db.session.commit()
            return time_capsule.to_dict(), 200
        except ValueError as ve:
            db.session.rollback()
            return make_response(jsonify({"errors": str(ve)}), 400)
        except Exception as e:
            db.session.rollback()
            if app.debug: print(f"Error updating time capsule (ID: {id}): {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to update time capsule."}), 500)

    def delete(self, id):
        try:
            user_id = session['user_id']
            time_capsule = TimeCapsule.query.filter_by(id=id, user_id=user_id).first()
            if not time_capsule:
                return make_response(jsonify({"errors": "Time Capsule not found or unauthorized."}), 404)

            db.session.delete(time_capsule)
            db.session.commit()
            return make_response(jsonify({"message": "Time Capsule deleted successfully."}), 204)
        except Exception as e:
            db.session.rollback()
            if app.debug: print(f"Error deleting time capsule (ID: {id}): {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to delete time capsule."}), 500)
api.add_resource(TimeCapsuleByIdResource, '/time_capsules/<int:id>')


class UserNotesResource(Resource):
    decorators = [login_required]

    def get(self):
        try:
            user_id = session['user_id']
            user_notes = UserNote.query.filter_by(user_id=user_id).order_by(UserNote.created_at.desc()).all()
            return [note.to_dict() for note in user_notes], 200
        except Exception as e:
            if app.debug: print(f"Error fetching user notes: {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to fetch user notes."}), 500)

    def post(self):
        try:
            user_id = session['user_id']
            data = request.get_json()
            content = data.get('content')

            if not content:
                raise ValidationError("Content is required for a user note.")

            new_user_note = UserNote(
                user_id=user_id,
                content=content
            )
            db.session.add(new_user_note)
            db.session.commit()
            return new_user_note.to_dict(), 201
        except ValueError as ve:
            db.session.rollback()
            return make_response(jsonify({"errors": str(ve)}), 400)
        except Exception as e:
            db.session.rollback()
            if app.debug: print(f"Error creating user note: {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to create user note."}), 500)
api.add_resource(UserNotesResource, '/user_notes')

class UserNoteByIdResource(Resource):
    decorators = [login_required]

    def get(self, id):
        try:
            user_id = session['user_id']
            user_note = UserNote.query.filter_by(id=id, user_id=user_id).first()
            if not user_note:
                return make_response(jsonify({"errors": "User Note not found or unauthorized."}), 404)
            return user_note.to_dict(), 200
        except Exception as e:
            if app.debug: print(f"Error fetching user note (ID: {id}): {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to fetch user note."}), 500)

    def patch(self, id):
        try:
            user_id = session['user_id']
            user_note = UserNote.query.filter_by(id=id, user_id=user_id).first()
            if not user_note:
                return make_response(jsonify({"errors": "User Note not found or unauthorized."}), 404)

            data = request.get_json()
            if 'content' in data:
                user_note.content = data['content']
            
            db.session.commit()
            return user_note.to_dict(), 200
        except ValueError as ve:
            db.session.rollback()
            return make_response(jsonify({"errors": str(ve)}), 400)
        except Exception as e:
            db.session.rollback()
            if app.debug: print(f"Error updating user note (ID: {id}): {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to update user note."}), 500)

    def delete(self, id):
        try:
            user_id = session['user_id']
            user_note = UserNote.query.filter_by(id=id, user_id=user_id).first()
            if not user_note:
                return make_response(jsonify({"errors": "User Note not found or unauthorized."}), 404)

            db.session.delete(user_note)
            db.session.commit()
            return make_response(jsonify({"message": "User Note deleted successfully."}), 204)
        except Exception as e:
            db.session.rollback()
            if app.debug: print(f"Error deleting user note (ID: {id}): {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to delete user note."}), 500)
api.add_resource(UserNoteByIdResource, '/user_notes/<int:id>')


class RandomSoulNoteResource(Resource):
    """
    Handles GET for a random SoulNote (not user-specific).
    """
    def get(self):
        try:
            count = db.session.query(SoulNote).count()
            if count == 0:
                return make_response(jsonify({"message": "No soul notes available."}), 200)
            
            random_offset = max(0, randint(0, count - 1))
            soul_note = SoulNote.query.offset(random_offset).limit(1).first()

            if not soul_note:
                return make_response(jsonify({"message": "Could not retrieve a random soul note."}), 404)
            return soul_note.to_dict(), 200
        except Exception as e:
            if app.debug: print(f"Error fetching random soul note: {e}\n{traceback.format_exc()}")
            return make_response(jsonify({"errors": "Failed to retrieve soul note."}), 500)
api.add_resource(RandomSoulNoteResource, '/soul_notes/random')


class LoopBreakerPromptResource(Resource):

    def get(self):
        prompts = [
            "What is one small thing you can do right now to shift your focus?",
            "Identify one thought you're stuck on. Is it truly serving you?",
            "Close your eyes and focus on five things you can hear.",
            "If this feeling were a cloud, what shape would it be? Watch it drift.",
            "Name three things you are grateful for in this exact moment.",
            "What would a wise friend advise you to do right now?",
            "Consider your breath. Inhale calm, exhale tension.",
            "What simple act of kindness can you offer yourself today?",
            "Is there a different perspective you haven't considered yet?",
            "What if this feeling is just a visitor, not a permanent resident?"
        ]
        return make_response(jsonify({"prompt": choice(prompts)}), 200)
api.add_resource(LoopBreakerPromptResource, '/loop_breaker/prompt')


class BreathGroundResource(Resource):
    """
    Handles GET for Breath & Ground techniques.
    """
    def get(self):
        techniques = [
            {
                "name": "Box Breathing",
                "instructions": "Inhale slowly for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat.",
                "duration": "2-5 minutes"
            },
            {
                "name": "5-4-3-2-1 Grounding",
                "instructions": "Name 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste.",
                "duration": "As needed"
            },
            {
                "name": "Deep Belly Breathing",
                "instructions": "Place one hand on your chest and one on your belly. Breathe deeply so your belly rises, keeping your chest still. Exhale slowly.",
                "duration": "3-5 minutes"
            },
            { 
                "name": "Mindful Walking",
                "instructions": "As you walk, bring your awareness to each step: the sensation of your feet on the ground, the movement of your legs, and the rhythm of your breath. If your mind wanders, gently bring it back to your steps.",
                "duration": "5-10 minutes"
            },
            { 
                "name": "Body Scan Meditation",
                "instructions": "Lie down or sit comfortably. Bring your attention to different parts of your body, starting from your toes and slowly moving upwards. Notice any sensations without judgment. Breathe into each area.",
                "duration": "5-15 minutes"
            },
            {
                "name": "Color Visualization",
                "instructions": "Close your eyes and imagine a calming color (e.g., soft blue or green). Breathe in this color, imagining it filling your body with peace. Breathe out any tension or discomfort as a contrasting color.",
                "duration": "3-5 minutes"
            }
        ]
        return make_response(jsonify({"techniques": techniques}), 200)
api.add_resource(BreathGroundResource, '/breath_ground')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5555))
    app.run(port=port, debug=True)
