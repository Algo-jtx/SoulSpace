# Standard library imports
from random import randint, choice
from datetime import datetime, timedelta

from faker import Faker  

# Local imports
from config import app, db  
from models import User, Letter, TimeCapsule, UserNote, SoulNote

fake = Faker()

if __name__ == '__main__':
    with app.app_context():
        print("Clearing existing data...")
        UserNote.query.delete()
        TimeCapsule.query.delete()
        Letter.query.delete()
        SoulNote.query.delete()
        User.query.delete()
        db.session.commit()
        print("Existing data cleared.")

        print("Creating seed data...")

        users = []
        for _ in range(5):
            user = User(
                username=fake.unique.user_name(),
                email=fake.unique.email(),
                created_at=fake.date_time_between(start_date='-1y', end_date='now')
            )
            user.password_hash = "password123"
            users.append(user)
            db.session.add(user)
        db.session.commit()
        print(f"Created {len(users)} users.")

        letters = []
        for user in users:
            for _ in range(randint(2, 5)):
                letter = Letter(
                    user_id=user.id,
                    title=fake.sentence(nb_words=6),
                    content=fake.paragraph(nb_sentences=5),
                    created_at=fake.date_time_between(start_date='-6m', end_date='now')
                )
                letters.append(letter)
                db.session.add(letter)
        db.session.commit()
        print(f"Created {len(letters)} letters.")

        time_capsules = []
        for user in users:
            for _ in range(randint(1, 3)):
                open_date = fake.date_time_between(start_date='+1d', end_date='+5y')
                capsule = TimeCapsule(
                    user_id=user.id,
                    message=fake.paragraph(nb_sentences=7),
                    open_date=open_date,
                    created_at=fake.date_time_between(start_date='-3m', end_date='now')
                )
                time_capsules.append(capsule)
                db.session.add(capsule)
        db.session.commit()
        print(f"Created {len(time_capsules)} time capsules.")

        user_notes = []
        for user in users:
            for _ in range(randint(1, 2)):
                note = UserNote(
                    user_id=user.id,
                    content=fake.paragraph(nb_sentences=10),
                    created_at=fake.date_time_between(start_date='-2m', end_date='now')
                )
                user_notes.append(note)
                db.session.add(note)
        db.session.commit()
        print(f"Created {len(user_notes)} user notes.")

        categories = ['Comfort', 'Reflection', 'Encouragement', 'Peace', 'Mindfulness']
        messages = [
            "Take a deep breath. You are exactly where you need to be.",
            "The quiet moments are where you find your true strength.",
            "You are worthy of rest, peace, and gentle moments.",
            "Every pause is a step forward.",
            "Let your worries drift away like clouds.",
            "You carry kindness in your heart.",
            "Be gentle with yourself today.",
            "Growth happens in stillness too.",
            "Your presence is a gift.",
            "The sun will rise again, and so will you."
        ]
        for msg in messages:
            note = SoulNote(
                message=msg,
                category=choice(categories)
            )
            db.session.add(note)
        db.session.commit()
        print(f"Created {len(messages)} soul notes.")
        print("Seed data creation complete!")