from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_admin = db.Column(db.Boolean, default=False)
    yas = db.Column(db.Integer)
    cinsiyet = db.Column(db.String(20))
    bolum = db.Column(db.String(100))
    
    results = db.relationship('Result', backref='tester', lazy='dynamic')
    
    def __repr__(self):
        return f'<User {self.username}>'
    
class Result(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    test_type = db.Column(db.String(20), nullable=False)
    reaction_time_ms = db.Column(db.Float, nullable=False)
    accuracy_percent = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    is_analysis_mode = db.Column(db.Boolean, default=True)
    
    def __repr__(self):
        return f'<Result {self.test_type}>'