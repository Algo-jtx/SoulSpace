from datetime import datetime
import re 

from sqlalchemy_serializer import SerializerMixin
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.hybrid import hybrid_property
from flask_bcrypt import Bcrypt

from config import db


bcrypt = Bcrypt() 

class User(db.Model, SerializerMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    _password_hash = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    letters = db.relationship('Letter', backref='user', lazy=True, cascade='all, delete-orphan')
    time_capsules = db.relationship('TimeCapsule', backref='user', lazy=True, cascade='all, delete-orphan')
    user_notes = db.relationship('UserNote', backref='user', lazy=True, cascade='all, delete-orphan')

    serialize_rules = ('-letters.user', '-time_capsules.user', '-user_notes.user', '-_password_hash',)

    @hybrid_property
    def password_hash(self):
        raise AttributeError('Password hashes may not be read.')

    @password_hash.setter
    def password_hash(self, password):
        if not isinstance(password, str):
            raise TypeError("Password must be a string.")
        if len(password) < 6: 
            raise ValueError("Password must be at least 6 characters long.")
        self._password_hash = bcrypt.generate_password_hash(password.encode('utf-8')).decode('utf-8')

    def authenticate(self, password):
        return bcrypt.check_password_hash(self._password_hash, password.encode('utf-8'))

    def __repr__(self):
        return f'<User {self.username}>'

    @db.validates('email')
    def validate_email(self, key, email):
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise ValueError("Invalid email format.")
        
        existing_user = User.query.filter(db.func.lower(User.email) == db.func.lower(email)).first()
        if existing_user and existing_user.id != self.id:
            raise ValueError("Email already in use.")
        return email

    @db.validates('username')
    def validate_username(self, key, username):
        if not username:
            raise ValueError("Username cannot be empty.")
        if len(username) < 3 or len(username) > 80:
            raise ValueError("Username must be between 3 and 80 characters.")
        existing_user = User.query.filter(db.func.lower(User.username) == db.func.lower(username)).first()
        if existing_user and existing_user.id != self.id:
            raise ValueError("Username already taken.")
        return username

class Letter(db.Model, SerializerMixin):
    __tablename__ = 'letters'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    serialize_rules = ('-user.letters',)

    def __repr__(self):
        return f'<Letter {self.title}>'

    @db.validates('title')
    def validate_title(self, key, title):
        if not title or len(title) > 255:
            raise ValueError("Title must be non-empty and less than 255 characters.")
        return title

    @db.validates('content')
    def validate_content(self, key, content):
        if not content:
            raise ValueError("Content cannot be empty.")
        return content

class TimeCapsule(db.Model, SerializerMixin):
    __tablename__ = 'time_capsules'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    open_date = db.Column(db.DateTime, nullable=False) # Date when the capsule can be opened
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    serialize_rules = ('-user.time_capsules',)

    def __repr__(self):
        return f'<TimeCapsule {self.id} - Open on {self.open_date.strftime("%Y-%m-%d")}>'

    @db.validates('message')
    def validate_message(self, key, message):
        if not message:
            raise ValueError("Message cannot be empty.")
        return message

    @db.validates('open_date')
    def validate_open_date(self, key, open_date):
        if open_date <= datetime.utcnow():
            raise ValueError("Open date must be in the future.")
        return open_date

class UserNote(db.Model, SerializerMixin):
    __tablename__ = 'user_notes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    serialize_rules = ('-user.user_notes',)

    def __repr__(self):
        return f'<UserNote {self.id}>'

    @db.validates('content')
    def validate_content(self, key, content):
        if not content:
            raise ValueError("Note content cannot be empty.")
        return content

class SoulNote(db.Model, SerializerMixin):
    __tablename__ = 'soul_notes'

    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(500), nullable=False)
    category = db.Column(db.String(100))

    def __repr__(self):
        return f'<SoulNote {self.id} - {self.category}>'

    @db.validates('message')
    def validate_message(self, key, message):
        if not message or len(message) > 500:
            raise ValueError("Message must be non-empty and less than 500 characters.")
        return message

